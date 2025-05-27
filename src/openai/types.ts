import { ChatCompletionMessage } from 'openai/resources/chat/completions';

export type FunctionRole = 'system' | 'user' | 'assistant';

export interface FunctionMessage {
    role: FunctionRole;
    content: string;
}

export interface FunctionDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
        }>;
        required: string[];
    };
}

export interface FunctionCall {
    name: string;
    arguments: string;
}

export interface FunctionResponse {
    success: boolean;
    data?: FunctionResult;
    error?: string;
}

export interface FunctionHandler {
    (args: Record<string, any>): Promise<FunctionResponse>;
}

export interface FunctionRegistry {
    [key: string]: FunctionHandler;
}

export type OpenAIResponse = ChatCompletionMessage & {
    function_call?: FunctionCall;
};

export interface OpenAIRequestConfig {
    messages: FunctionMessage[];
    model?: string;
    temperature?: number;
    functions?: FunctionDefinition[];
    function_call?: 'auto' | 'none' | { name: string };
}

// Function-specific return types
export interface DriverPositionResult {
    position: number;
    constructorName: string;
    constructorId: string;
}

export interface DriverByPositionResult {
    driverName: string;
    driverId: string;
    constructorName: string;
    constructorId: string;
}

export interface ConstructorByPositionResult {
    constructorName: string;
    constructorId: string;
}

// Union type for all possible function results
export type FunctionResult =
    | DriverPositionResult
    | DriverByPositionResult
    | ConstructorByPositionResult;

// Type guard functions
export function isDriverPositionResult(result: FunctionResult): result is DriverPositionResult {
    return 'position' in result && 'constructorName' in result && 'constructorId' in result;
}

export function isDriverByPositionResult(result: FunctionResult): result is DriverByPositionResult {
    return 'driverName' in result && 'driverId' in result && 'constructorName' in result && 'constructorId' in result;
}

export function isConstructorByPositionResult(result: FunctionResult): result is ConstructorByPositionResult {
    return 'constructorName' in result && 'constructorId' in result && !('position' in result) && !('driverName' in result);
} 