import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { LlamaService } from '../llama/llama';
import { DbService } from '../db.service';
import OpenAI from 'openai';

// Mock OpenAI
const mockOpenAI = {
    chat: {
        completions: {
            create: jest.fn()
        }
    },
    audio: {
        transcriptions: {
            create: jest.fn()
        },
        speech: {
            create: jest.fn()
        }
    }
};

jest.mock('openai', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockOpenAI)
}));

// Mock the ConfigService
const mockConfigService = {
    get: jest.fn((key: string) => {
        if (key === 'OPENAI_API_KEY') return 'test-openai-key';
        return null;
    })
};

// Mock the LlamaService
const mockLlamaService = {
    extractJsonAnswer: jest.fn().mockResolvedValue('Test Answer')
};

// Mock the DbService
const mockDbService = {
    handleOpenAIFunctionCall: jest.fn().mockImplementation((name: string, args: any) => {
        if (name === 'get_driver_position') {
            return Promise.resolve({
                position: 1,
                constructorName: 'Ferrari',
                constructorId: 'fer'
            });
        }
        throw new Error(`Unknown function: ${name}`);
    })
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

describe('OpenAIService', () => {
    let service: OpenAIService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OpenAIService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService
                },
                {
                    provide: LlamaService,
                    useValue: mockLlamaService
                },
                {
                    provide: DbService,
                    useValue: mockDbService
                }
            ],
        }).compile();

        service = module.get<OpenAIService>(OpenAIService);
    });

    afterEach(() => {
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

        mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);

        const result = await service.fetchDbAnswer({ userQuestion: question });

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
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
    });

    test('should throw error for empty question', async () => {
        await expect(service.fetchDbAnswer({ userQuestion: '' }))
            .rejects.toThrow('Question cannot be empty');
    });

    test('should handle OpenAI API error', async () => {
        const apiError = new Error('API Error');
        mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

        const result = await service.fetchDbAnswer({ userQuestion: 'Test question' });
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    test('should handle missing function call', async () => {
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

        mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);

        const result = await service.fetchDbAnswer({ userQuestion: 'Test question' });
        expect(result.success).toBe(false);
        expect(result.error).toBe('No function call in message');
    });

    test('should handle transcription', async () => {
        const mockTranscriptionResponse = {
            text: 'Transcribed text'
        };

        mockOpenAI.audio.transcriptions.create.mockResolvedValue(mockTranscriptionResponse);

        const file = new File(['test'], 'test.wav', { type: 'audio/wav' });
        const result = await service.transcribeAudio(file);

        expect(result).toBe('Transcribed text');
        expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith({
            file,
            model: 'whisper-1'
        });
    });

    test('should handle text to speech', async () => {
        const mockSpeechResponse = {
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
        };

        mockOpenAI.audio.speech.create.mockResolvedValue(mockSpeechResponse);

        const result = await service.textToSpeech({ text: 'Test text' });

        expect(result).toBeInstanceOf(Buffer);
        expect(mockOpenAI.audio.speech.create).toHaveBeenCalledWith({
            model: 'gpt-4o-mini-tts',
            voice: 'alloy',
            input: 'Test text'
        });
        expect(mockSpeechResponse.arrayBuffer).toHaveBeenCalled();
    });
}); 