import { parse } from 'csv-parse/sync'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// Constants
const DATA_DIR = join(process.cwd(), 'data', 'f1')
console.info('Current working directory:', process.cwd())
console.info('Data directory:', DATA_DIR)

// Helper function to check if file exists
function checkFileExists(filePath: string): boolean {
    const exists = existsSync(filePath)
    console.info(`Checking file ${filePath}: ${exists ? 'exists' : 'not found'}`)
    return exists
}

// Validation functions
function validateCircuit(record: any) {
    if (!record.circuitId || !record.circuitName) {
        throw new Error(`Invalid circuit record: ${JSON.stringify(record)}`)
    }
}

function validateConstructor(record: any) {
    if (!record.constructorId || !record.Name || !record.year) {
        throw new Error(`Invalid constructor record: ${JSON.stringify(record)}`)
    }
    if (isNaN(parseInt(record.year))) {
        throw new Error(`Invalid year: ${record.year}`)
    }
}

function validateDriver(record: any) {
    if (!record.driverId || !record.GivenName || !record.FamilyName || !record.DateOfBirth) {
        throw new Error(`Invalid driver record: ${JSON.stringify(record)}`)
    }
}

function validateResult(record: any) {
    if (!record.Season || !record.Round || !record.DriverID || !record.ConstructorName) {
        throw new Error(`Invalid result record: ${JSON.stringify(record)}`)
    }
    if (isNaN(parseInt(record.Season)) || isNaN(parseInt(record.Round))) {
        throw new Error(`Invalid Season or Round: ${record.Season}, ${record.Round}`)
    }
}

function validateQualifyingResult(record: any) {
    if (!record.Season || !record.Round || !record.DriverID || !record.ConstructorID) {
        throw new Error(`Invalid qualifying result record: ${JSON.stringify(record)}`)
    }
    if (isNaN(parseInt(record.Season)) || isNaN(parseInt(record.Round))) {
        throw new Error(`Invalid Season or Round: ${record.Season}, ${record.Round}`)
    }
}

function validatePitStop(record: any) {
    if (!record.season || !record.round || !record.driverId || !record.stop || !record.lap) {
        throw new Error(`Invalid pit stop record: ${JSON.stringify(record)}`)
    }
    if (isNaN(parseInt(record.season)) || isNaN(parseInt(record.round)) ||
        isNaN(parseInt(record.stop)) || isNaN(parseInt(record.lap))) {
        throw new Error(`Invalid numeric fields: ${record.season}, ${record.round}, ${record.stop}, ${record.lap}`)
    }
}

// Generic batch processing function
async function processBatch<T, R>(
    records: R[],
    batchSize: number,
    validateFn: (record: R) => void,
    transformFn: (record: R) => T,
    createManyFn: (data: T[]) => Promise<{ count: number }>
) {
    console.info(`Processing batch of ${records.length} records`)
    const batches: R[][] = []
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        batches.push(batch)
    }

    for (const [index, batch] of batches.entries()) {
        try {
            console.info(`Processing batch ${index + 1}/${batches.length} (${batch.length} records)`)
            // Validate all records in batch
            batch.forEach(validateFn)
            // Transform records
            const transformedData = batch.map(transformFn)
            // Create records with skipDuplicates option
            const result = await createManyFn(transformedData)
            console.info(`Created ${result.count} records in batch ${index + 1} (skipped duplicates)`)
        } catch (error) {
            console.error(`Error processing batch ${index + 1}:`, error)
            throw error
        }
    }
}

// Helper to build a lookup map for constructor name/year to id
function buildConstructorLookup(): Record<string, Record<number, string>> {
    const csvPath = join(DATA_DIR, 'constructors.csv')
    const fileContent = readFileSync(csvPath, 'utf-8')
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    })
    const map: Record<string, Record<number, string>> = {}
    for (const rec of records) {
        const name = rec.Name
        const year = parseInt(rec.year)
        const id = rec.constructorId
        if (!map[name]) map[name] = {}
        map[name][year] = id
    }
    return map
}

export async function loadCircuits(tx: Prisma.TransactionClient) {
    const csvPath = join(DATA_DIR, 'circuits.csv')
    if (!checkFileExists(csvPath)) {
        throw new Error(`Circuits CSV file not found at ${csvPath}`)
    }

    console.info('Loading circuits from:', csvPath)
    const fileContent = readFileSync(csvPath, 'utf-8')
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    })
    console.info(`Found ${records.length} circuit records`)

    await processBatch(
        records,
        1000,
        validateCircuit,
        (record) => ({
            id: record.circuitId,
            name: record.circuitName,
            locality: record.locality || null,
            country: record.country || null,
            latitude: record.latitude ? parseFloat(record.latitude) : null,
            longitude: record.longitude ? parseFloat(record.longitude) : null,
            url: record.url || null
        }),
        (data) => tx.circuit.createMany({ data, skipDuplicates: true })
    )
}

export async function loadConstructors(tx: Prisma.TransactionClient) {
    const csvPath = join(DATA_DIR, 'constructors.csv')
    const fileContent = readFileSync(csvPath, 'utf-8')
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    })

    await processBatch(
        records,
        1000,
        validateConstructor,
        (record) => ({
            id: record.constructorId,
            year: parseInt(record.year),
            name: record.Name,
            nationality: record.Nationality || null,
            url: record.url || null
        }),
        (data) => tx.constructor.createMany({ data, skipDuplicates: true })
    )
}

export async function loadDrivers(tx: Prisma.TransactionClient) {
    const csvPath = join(DATA_DIR, 'drivers.csv')
    const fileContent = readFileSync(csvPath, 'utf-8')
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    })

    await processBatch(
        records,
        1000,
        validateDriver,
        (record) => ({
            id: record.driverId,
            givenName: record.GivenName,
            familyName: record.FamilyName,
            dateOfBirth: new Date(record.DateOfBirth),
            nationality: record.Nationality || null,
            url: record.url || null
        }),
        (data) => tx.driver.createMany({ data, skipDuplicates: true })
    )
}

export async function loadRaces(tx: Prisma.TransactionClient) {
    const csvPath = join(DATA_DIR, 'races.csv')
    const fileContent = readFileSync(csvPath, 'utf-8')
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    }) as Array<{
        season: string;
        round: string;
        circuitId: string;
        date?: string;
    }>

    await processBatch(
        records,
        1000,
        (record) => {
            if (!record.season || !record.round || !record.circuitId) {
                throw new Error(`Invalid race record: ${JSON.stringify(record)}`)
            }
            if (isNaN(parseInt(record.season)) || isNaN(parseInt(record.round))) {
                throw new Error(`Invalid season or round: ${record.season}, ${record.round}`)
            }
        },
        (record) => ({
            season: parseInt(record.season),
            round: parseInt(record.round),
            circuitId: record.circuitId,
            raceDate: record.date ? new Date(record.date) : null
        }),
        (data) => tx.race.createMany({ data, skipDuplicates: true })
    )
}

export async function loadResults(tx: Prisma.TransactionClient) {
    const constructorLookup = buildConstructorLookup()
    const csvPath = join(DATA_DIR, 'results.csv')
    const fileContent = readFileSync(csvPath, 'utf-8')
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    })
    // Filter records with missing constructor mapping
    const filteredRecords = records.filter(record => {
        const season = parseInt(record.Season)
        const constructorName = record.ConstructorName
        const constructorId = constructorLookup[constructorName]?.[season]
        if (!constructorId) {
            console.warn(`Skipping result: No constructorId found for name ${constructorName} and year ${season}`)
            return false
        }
        return true
    })

    await processBatch(
        filteredRecords,
        1000,
        validateResult,
        (record) => {
            const season = parseInt(record.Season)
            const constructorName = record.ConstructorName
            const constructorId = constructorLookup[constructorName][season]
            return {
                season,
                round: parseInt(record.Round),
                driverId: record.DriverID,
                constructorId: constructorId,
                constructorYear: season,
                position: parseInt(record.Position),
                points: parseFloat(record.Points),
                grid: parseInt(record.Grid),
                laps: parseInt(record.Laps),
                status: record.Status || null,
                time: record.Time || null,
                fastestLapTime: record.FastestLapTime || null,
                fastestLapLap: record.FastestLapLap ? parseInt(record.FastestLapLap) : null,
                averageSpeed: record.AverageSpeed ? parseFloat(record.AverageSpeed) : null
            }
        },
        (data) => tx.result.createMany({ data, skipDuplicates: true })
    )
}

export async function loadQualifyingResults(tx: Prisma.TransactionClient) {
    const constructorLookup = buildConstructorLookup()
    const csvPath = join(DATA_DIR, 'qualifying_results.csv')
    const fileContent = readFileSync(csvPath, 'utf-8')
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    })
    // Filter records with missing constructor mapping
    const filteredRecords = records.filter(record => {
        const season = parseInt(record.Season)
        const constructorName = record.ConstructorName
        const constructorId = constructorLookup[constructorName]?.[season]
        if (!constructorId) {
            console.warn(`Skipping qualifying result: No constructorId found for name ${constructorName} and year ${season}`)
            return false
        }
        return true
    })

    await processBatch(
        filteredRecords,
        1000,
        validateQualifyingResult,
        (record) => {
            const season = parseInt(record.Season)
            const constructorName = record.ConstructorName
            const constructorId = constructorLookup[constructorName][season]
            return {
                season,
                round: parseInt(record.Round),
                driverId: record.DriverID,
                constructorId: constructorId,
                constructorYear: season,
                position: parseInt(record.Position),
                q1: record.Q1 || null,
                q2: record.Q2 || null,
                q3: record.Q3 || null
            }
        },
        (data) => tx.qualifyingResult.createMany({ data, skipDuplicates: true })
    )
}

export async function loadPitStops(tx: Prisma.TransactionClient) {
    const csvPath = join(DATA_DIR, 'pitstops.csv')
    const fileContent = readFileSync(csvPath, 'utf-8')
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    })

    await processBatch(
        records,
        1000,
        validatePitStop,
        (record) => ({
            season: parseInt(record.season),
            round: parseInt(record.round),
            driverId: record.driverId,
            stop: parseInt(record.stop),
            lap: parseInt(record.lap),
            duration: parseFloat(record.duration)
        }),
        (data) => tx.pitStop.createMany({ data, skipDuplicates: true })
    )
}

// Main function to load all data in a transaction
export async function loadAllData() {
    console.info('Starting data import...')
    console.info('Checking data directory...')

    if (!existsSync(DATA_DIR)) {
        throw new Error(`Data directory not found at ${DATA_DIR}`)
    }

    try {
        await prisma.$transaction(async (tx) => {
            console.info('Starting transaction...')

            console.info('Loading circuits...')
            await loadCircuits(tx)

            console.info('Loading constructors...')
            await loadConstructors(tx)

            console.info('Loading drivers...')
            await loadDrivers(tx)

            // Skipping races loading due to missing races.csv
            console.info('Skipping races loading (races.csv not found)...')

            console.info('Loading results...')
            await loadResults(tx)

            console.info('Loading qualifying results...')
            await loadQualifyingResults(tx)

            console.info('Loading pit stops...')
            await loadPitStops(tx)

            console.info('Transaction completed successfully')
        })

        console.info('Data import completed successfully!')
    } catch (error) {
        console.error('Error during data import:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
} 