import { PrismaClient } from '@prisma/client'
import { loadAllData } from './utils/csvLoader'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting data import...')

    try {
        await loadAllData()
        console.log('Data import completed successfully!')
    } catch (error) {
        console.error('Error during data import:', error)
        throw error
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    }) 