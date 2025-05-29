import {
    FunctionDefinition,
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
