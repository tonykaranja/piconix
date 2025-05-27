import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlamaService } from './llama';
import { FunctionResult } from '../openai/types';

// Mock fetch
global.fetch = jest.fn();

// Mock the ConfigService
const mockConfigService = {
    get: jest.fn((key: string) => {
        if (key === 'LLAMA_API_KEY') return 'test-llama-key';
        if (key === 'LLAMA_API_URL') return 'https://api.llama.com/v1';
        return null;
    })
};

describe('LlamaService', () => {
    let service: LlamaService;
    const mockFetch = fetch as jest.Mock;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LlamaService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService
                }
            ],
        }).compile();

        service = module.get<LlamaService>(LlamaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('chatCompletion', () => {
        test('should make successful API call', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    completion_message: {
                        content: {
                            text: 'Test response'
                        }
                    }
                })
            };

            mockFetch.mockResolvedValue(mockResponse);

            const config = {
                messages: [
                    { role: 'user' as const, content: 'Test message' }
                ]
            };

            const response = await service.chatCompletion(config);

            expect(response).toBe(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.llama.com/v1/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-llama-key',
                        'Content-Type': 'application/json'
                    }),
                    body: expect.any(String)
                })
            );
        });

        test('should handle API error', async () => {
            const mockResponse = {
                ok: false,
                status: 500
            };

            mockFetch.mockResolvedValue(mockResponse);

            const config = {
                messages: [
                    { role: 'user' as const, content: 'Test message' }
                ]
            };

            await expect(service.chatCompletion(config))
                .rejects.toThrow('API call failed with status 500');
        });
    });

    describe('extractJsonAnswer', () => {
        test('should extract answer from JSON data', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    completion_message: {
                        content: {
                            text: 'Red Bull'
                        }
                    }
                })
            };

            mockFetch.mockResolvedValue(mockResponse);

            const testData = {
                userQuestion: 'Who constructed the car that finished in position 5 in round 6 of 2015?',
                result: {
                    constructorName: 'Red Bull',
                    constructorId: 'red_bull'
                } as FunctionResult
            };

            const result = await service.extractJsonAnswer(testData);

            expect(result).toBe('Red Bull');
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.llama.com/v1/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-llama-key',
                        'Content-Type': 'application/json'
                    }),
                    body: expect.stringContaining(testData.userQuestion)
                })
            );
        });

        test('should handle empty response', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    completion_message: {
                        content: {
                            text: ''
                        }
                    }
                })
            };

            mockFetch.mockResolvedValue(mockResponse);

            const testData = {
                userQuestion: 'Test question',
                result: {
                    constructorName: 'Red Bull',
                    constructorId: 'red_bull'
                } as FunctionResult
            };

            await expect(service.extractJsonAnswer(testData))
                .rejects.toThrow('No content in Llama response');
        });

        test('should handle missing content', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    completion_message: {
                        content: {}
                    }
                })
            };

            mockFetch.mockResolvedValue(mockResponse);

            const testData = {
                userQuestion: 'Test question',
                result: {
                    constructorName: 'Red Bull',
                    constructorId: 'red_bull'
                } as FunctionResult
            };

            await expect(service.extractJsonAnswer(testData))
                .rejects.toThrow('No content in Llama response');
        });
    });

    describe('validateLlamaResponse', () => {
        test('should validate correct response', () => {
            const validResponse = {
                completion_message: {
                    content: {
                        text: 'Valid response'
                    }
                }
            };

            const result = service.validateLlamaResponse(validResponse);
            expect(result).toBe('Valid response');
        });

        test('should throw error for invalid response', () => {
            const invalidResponse = {
                completion_message: {
                    content: {}
                }
            };

            expect(() => service.validateLlamaResponse(invalidResponse))
                .toThrow('Invalid response format from Llama API');
        });
    });
}); 