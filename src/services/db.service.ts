import { PrismaClient } from "@prisma/client";
import {
    DriverPositionResult,
    DriverByPositionResult,
    ConstructorByPositionResult,
    FunctionResult,
} from './openai/types';
import { Injectable } from "@nestjs/common";

@Injectable()
export class DbService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getDriverPosition({ driverName, season, round }: { driverName: string, season: number, round: number }): Promise<DriverPositionResult> {
        const [givenName, ...familyParts] = driverName.trim().split(" ");
        const familyName = familyParts.join(" ");
        console.log(`[DEBUG] Searching for driver: givenName='${givenName}', familyName='${familyName}'`);

        const driver = await this.prisma.driver.findFirst({
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

        const result = await this.prisma.result.findFirst({
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

    async getDriverByPosition({ position, season, round }: { position: number, season: number, round: number }): Promise<DriverByPositionResult> {
        console.log(`[DEBUG] Searching for result: position=${position}, season=${season}, round=${round}`);
        const result = await this.prisma.result.findFirst({
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

    async getConstructorByPosition({ position, season, round }: { position: number, season: number, round: number }): Promise<ConstructorByPositionResult> {
        console.log(`[DEBUG] Searching for constructor by result: position=${position}, season=${season}, round=${round}`);
        const result = await this.prisma.result.findFirst({
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

    async handleOpenAIFunctionCall(name: string, args: any): Promise<FunctionResult> {
        try {
            switch (name) {
                case "get_driver_position":
                    return await this.getDriverPosition({ driverName: args.driverName, season: args.season, round: args.round });
                case "get_driver_by_position":
                    return await this.getDriverByPosition({ position: args.position, season: args.season, round: args.round });
                case "get_constructor_by_position":
                    return await this.getConstructorByPosition({ position: args.position, season: args.season, round: args.round });
                default:
                    throw new Error(`Unknown function: ${name}`);
            }
        } catch (error) {
            console.error(`[ERROR] Error in ${name}:`, error);
            throw error;
        }
    }

} 