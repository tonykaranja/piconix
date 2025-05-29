import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlamaService } from './services/llama/llama';
import { OpenAIService } from './services/openai/openai.service';
import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: LlamaService,
          useValue: {
            chatCompletion: jest.fn(),
            extractJsonAnswer: jest.fn(),
            validateLlamaResponse: jest.fn()
          }
        },
        {
          provide: OpenAIService,
          useValue: {
            chatCompletion: jest.fn(),
            fetchDbAnswer: jest.fn(),
            transcribeAudio: jest.fn(),
            textToSpeech: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn()
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
