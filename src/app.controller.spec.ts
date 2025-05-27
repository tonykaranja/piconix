import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlamaService } from './llama/llama';
import { ConfigService } from '@nestjs/config';

// Mock LlamaService
jest.mock('./llama/llama');
const mockLlamaService = {
  apiKey: 'test-llama-key',
  baseUrl: 'https://api.llama.com/v1',
  configService: {
    get: jest.fn((key: string) => {
      if (key === 'LLAMA_API_KEY') return 'test-llama-key';
      if (key === 'LLAMA_API_URL') return 'https://api.llama.com/v1';
      return null;
    })
  },
  chatCompletion: jest.fn().mockResolvedValue({
    json: () => Promise.resolve({
      completion_message: {
        content: {
          text: 'Test Answer'
        }
      }
    })
  })
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: LlamaService,
          useValue: mockLlamaService
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'test-openai-key';
              return null;
            })
          }
        }
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
