import OpenAI from "openai";
import { chatWithF1Bot } from "./openai";
import { LlamaService } from "../llama/llama";
import { ConfigService } from "@nestjs/config";

// Mock OpenAI
jest.mock('openai', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn()
            }
        }
    }))
}));

// Mock the ConfigService
jest.mock('@nestjs/config');
const mockConfigService = {
    get: jest.fn((key: string) => {
        if (key === 'LLAMA_API_KEY') return 'test-llama-key';
        if (key === 'LLAMA_API_URL') return 'https://api.llama.com/v1';
        return null;
    })
};

// Mock the LlamaService
jest.mock('../llama/llama');
const mockLlamaService = {
    apiKey: 'test-llama-key',
    baseUrl: 'https://api.llama.com/v1',
    configService: mockConfigService,
    chatCompletion: jest.fn().mockResolvedValue({
        json: () => Promise.resolve({
            completion_message: {
                content: {
                    text: 'Test Answer'
                }
            }
        })
    }),
    processWithLlama: jest.fn().mockResolvedValue('Test Answer')
};

// Mock the functions module
jest.mock('./functions', () => ({
    functions: [
        {
            name: "get_driver_position",
            description: "Get the finishing position of a driver for a given season and round.",
            parameters: {
                type: "object",
                properties: {
                    driverName: { type: "string" },
                    season: { type: "integer" },
                    round: { type: "integer" }
                },
                required: ["driverName", "season", "round"]
            }
        }
    ],
    handleFunctionCall: jest.fn().mockImplementation((name: string, args: any) => {
        if (name === 'get_driver_position') {
            return Promise.resolve({
                position: 1,
                constructorName: 'Ferrari',
                constructorId: 'fer'
            });
        }
        throw new Error(`Unknown function: ${name}`);
    })
}));

describe('F1 Bot Tests', () => {
    let openai: OpenAI;
    let llamaService: LlamaService;

    beforeAll(() => {
        // Initialize OpenAI with test API key
        openai = new OpenAI({ apiKey: 'test-openai-key' });
        // Initialize LlamaService with mocked ConfigService
        llamaService = mockLlamaService as unknown as LlamaService;
    });

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    const testQuestions = [
        "What position did Michael Schumacher finish in round 1 in 2000?",
        "Who finished in position 1 in round 1 of 2000?",
        "Who constructed the car that finished in position 1 in round 1 of 2000?",
        "What constructor did Michael Schumacher drive for in round 1 in 2000?",
        "What is the nationality of the constructor that finished in position 1 in round 1 of 2000?"
    ];

    test.each(testQuestions)('should process question: %s', async (question) => {
        // Mock OpenAI chat completion
        const mockOpenAIResponse = {
            id: 'chatcmpl-123',
            object: 'chat.completion',
            created: 1677652288,
            model: 'gpt-4',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: null,
                    function_call: {
                        name: 'get_driver_position',
                        arguments: JSON.stringify({
                            driverName: 'Michael Schumacher',
                            season: 2000,
                            round: 1
                        })
                    }
                },
                finish_reason: 'function_call'
            }]
        };

        (openai.chat.completions.create as jest.Mock).mockResolvedValue(mockOpenAIResponse);

        const result = await chatWithF1Bot({
            userQuestion: question,
            openai,
            llamaService
        });

        expect(result).toBeDefined();
        expect(result).toBe('Test Answer');
        expect(openai.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
            model: 'gpt-4',
            messages: expect.arrayContaining([
                expect.objectContaining({
                    role: 'system',
                    content: expect.any(String)
                }),
                expect.objectContaining({
                    role: 'user',
                    content: question
                })
            ]),
            functions: expect.any(Array),
            function_call: 'auto'
        }));
        expect(llamaService.processWithLlama).toHaveBeenCalledWith(
            question,
            expect.objectContaining({
                position: 1,
                constructorName: 'Ferrari',
                constructorId: 'fer'
            })
        );
    });

    test('should throw error for empty question', async () => {
        await expect(chatWithF1Bot({
            userQuestion: '',
            openai,
            llamaService
        })).rejects.toThrow('Question cannot be empty');
    });

    test('should throw error when OpenAI returns no response', async () => {
        const mockOpenAIResponse = {
            id: 'chatcmpl-123',
            object: 'chat.completion',
            created: 1677652288,
            model: 'gpt-4',
            choices: []
        };

        (openai.chat.completions.create as jest.Mock).mockResolvedValue(mockOpenAIResponse);

        await expect(chatWithF1Bot({
            userQuestion: 'Test question',
            openai,
            llamaService
        })).rejects.toThrow('No response from OpenAI');
    });

    test('should throw error when OpenAI returns no function call', async () => {
        const mockOpenAIResponse = {
            id: 'chatcmpl-123',
            object: 'chat.completion',
            created: 1677652288,
            model: 'gpt-4',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: 'Some response without function call'
                },
                finish_reason: 'stop'
            }]
        };

        (openai.chat.completions.create as jest.Mock).mockResolvedValue(mockOpenAIResponse);

        await expect(chatWithF1Bot({
            userQuestion: 'Test question',
            openai,
            llamaService
        })).rejects.toThrow('No function call in message');
    });

    test('should throw error when OpenAI API call fails', async () => {
        const apiError = new Error('API Error');
        (openai.chat.completions.create as jest.Mock).mockRejectedValue(apiError);

        await expect(chatWithF1Bot({
            userQuestion: 'Test question',
            openai,
            llamaService
        })).rejects.toThrow(apiError);
    });
});
