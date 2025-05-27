import { PrismaClient } from "@prisma/client";
import {
    FunctionDefinition,
    DriverPositionResult,
    DriverByPositionResult,
    ConstructorByPositionResult,
    FunctionResult
} from './types';

export const functions: FunctionDefinition[] = [
    {
        name: "get_driver_position",
        description: "Get the finishing position of a driver for a given season and round.",
        parameters: {
            type: "object",
            properties: {
                driverName: { type: "string", description: "Full name of the driver (e.g. 'Sergio Perez')" },
                season: { type: "integer", description: "F1 season (e.g. 2018)" },
                round: { type: "integer", description: "Round number (e.g. 13)" }
            },
            required: ["driverName", "season", "round"]
        }
    },
    {
        name: "get_driver_by_position",
        description: "Find the driver who finished in a given position for a specific season and round.",
        parameters: {
            type: "object",
            properties: {
                position: { type: "integer", description: "Finishing position (e.g. 1)" },
                season: { type: "integer", description: "F1 season (e.g. 2018)" },
                round: { type: "integer", description: "Round number (e.g. 5)" }
            },
            required: ["position", "season", "round"]
        }
    },
    {
        name: "get_constructor_by_position",
        description: "Find the constructor of the car that finished in a given position for a specific season and round.",
        parameters: {
            type: "object",
            properties: {
                position: { type: "integer", description: "Finishing position (e.g. 3)" },
                season: { type: "integer", description: "F1 season (e.g. 2015)" },
                round: { type: "integer", description: "Round number (e.g. 1)" }
            },
            required: ["position", "season", "round"]
        }
    }
];

const prisma = new PrismaClient();

export async function get_driver_position({ driverName, season, round }: {
    driverName: string;
    season: number;
    round: number;
}): Promise<DriverPositionResult> {
    const [givenName, ...familyParts] = driverName.trim().split(" ");
    const familyName = familyParts.join(" ");
    console.log(`[DEBUG] Searching for driver: givenName='${givenName}', familyName='${familyName}'`);

    const driver = await prisma.driver.findFirst({
        where: {
            AND: [
                { givenName: { equals: givenName, mode: "insensitive" } },
                { familyName: { equals: familyName, mode: "insensitive" } }
            ]
        }
    });
    console.log(`[DEBUG] Found driver:`, driver);

    if (!driver) {
        throw new Error(`Driver not found: ${driverName}`);
    }

    const result = await prisma.result.findFirst({
        where: { driverId: driver.id, season, round },
        include: { constructor: true }
    });
    console.log(`[DEBUG] Result for driverId='${driver.id}', season=${season}, round=${round}:`, result);

    if (!result) {
        throw new Error(`No result found for ${driverName} in season ${season}, round ${round}`);
    }

    return {
        position: result.position,
        constructorName: result.constructor.name,
        constructorId: result.constructor.id
    };
}

export async function get_driver_by_position({ position, season, round }: {
    position: number;
    season: number;
    round: number;
}): Promise<DriverByPositionResult> {
    console.log(`[DEBUG] Searching for result: position=${position}, season=${season}, round=${round}`);
    const result = await prisma.result.findFirst({
        where: { position, season, round },
        include: { driver: true, constructor: true }
    });
    console.log(`[DEBUG] Found result:`, result);

    if (!result || !result.driver) {
        throw new Error(`No driver found in position ${position} for season ${season}, round ${round}`);
    }

    return {
        driverName: `${result.driver.givenName} ${result.driver.familyName}`,
        driverId: result.driver.id,
        constructorName: result.constructor.name,
        constructorId: result.constructor.id
    };
}

export async function get_constructor_by_position({ position, season, round }: {
    position: number;
    season: number;
    round: number;
}): Promise<ConstructorByPositionResult> {
    console.log(`[DEBUG] Searching for constructor by result: position=${position}, season=${season}, round=${round}`);
    const result = await prisma.result.findFirst({
        where: { position, season, round },
        include: { constructor: true }
    });
    console.log(`[DEBUG] Found result:`, result);

    if (!result || !result.constructor) {
        throw new Error(`No constructor found in position ${position} for season ${season}, round ${round}`);
    }

    return {
        constructorName: result.constructor.name,
        constructorId: result.constructor.id
    };
}

export async function handleFunctionCall(name: string, args: any): Promise<FunctionResult> {
    try {
        switch (name) {
            case "get_driver_position":
                return await get_driver_position(args);
            case "get_driver_by_position":
                return await get_driver_by_position(args);
            case "get_constructor_by_position":
                return await get_constructor_by_position(args);
            default:
                throw new Error(`Unknown function: ${name}`);
        }
    } catch (error) {
        console.error(`[ERROR] Error in ${name}:`, error);
        throw error;
    }
}

