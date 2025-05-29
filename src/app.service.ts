import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { Articles, BiasResponse, responseFormat } from './services/llama/biasDetector.types';
import { LlamaService } from './services/llama/llama';
import { parseBiasResponse } from './util';
import { OpenAIService } from './services/openai/openai.service';

@Injectable()
export class AppService {
  private readonly voiceCacheDir: string;
  private readonly prisma: PrismaClient;

  constructor(
    private readonly llamaService: LlamaService,
    private readonly openaiService: OpenAIService
  ) {
    this.voiceCacheDir = path.join(process.cwd(), 'voice-cache');
    this.initializeCacheDirectory();
    this.prisma = new PrismaClient();
  }

  private async initializeCacheDirectory() {
    try {
      await fs.mkdir(this.voiceCacheDir, { recursive: true });
    } catch (error) {
      console.error('Error creating cache directory:', error);
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  async createVoice(name = 'antonio') {
    const fileName = `${name}.mp3`;
    const filePath = path.join(this.voiceCacheDir, fileName);

    try {
      // Check if file exists in cache
      await fs.access(filePath);
      console.log(`Using cached voice file for ${name}`);
      return await fs.readFile(filePath);
    } catch (error) {
      // File doesn't exist, generate new voice
      console.info(`Generating new voice file for ${name}`);
      const buffer = await this.openaiService.textToSpeech({ text: name, instructions: "say the input name" });

      // Save to cache
      await fs.writeFile(filePath, buffer);

      return buffer;
    }
  }

  private async saveQuestionAnswer({ question, answer }: { question: string, answer: string }): Promise<void> {
    const questionAndAnswer = {
      question,
      answer,
      timestamp: new Date()
    };

    try {
      await this.prisma.questionAnswer.create({
        data: questionAndAnswer
      });
    } catch (dbError) {
      console.error('Failed to save Q&A to database:', dbError);
    }
  }

  private async getCachedAnswer(question: string): Promise<Buffer | null> {
    const questionInDb = await this.prisma.questionAnswer.findFirst({
      where: {
        question: question
      }
    });

    if (questionInDb?.answer) {
      // Return answer from cache
      return await fs.readFile(`${this.voiceCacheDir}/${questionInDb.question}.mp3`);
    }

    return null;
  }

  async handleAudioQuestion(audioFile: Express.Multer.File): Promise<Buffer> {
    try {
      if (!audioFile.buffer) {
        throw new Error('No audio file provided');
      }

      // Create a File object from the buffer
      const file = new File(
        [audioFile.buffer],
        audioFile.originalname || 'audio.wav',
        { type: audioFile.mimetype || 'audio/wav' }
      );

      // Convert audio file to text using OpenAI's Whisper
      const question = await this.openaiService.transcribeAudio(file);

      const cachedAnswer = await this.getCachedAnswer(question);
      if (cachedAnswer) {
        return cachedAnswer;
      }

      // Get answer from db using GPT-4
      const dbAnswer = await this.openaiService.fetchDbAnswer({ userQuestion: question });

      if (!dbAnswer.data) {
        throw new Error('Failed to get answer from db');
      }

      // extract answer from the response with llama
      const simpleAnswer = await this.llamaService.extractJsonAnswer({ userQuestion: question, result: dbAnswer.data });

      // Save question and answer log to database
      await this.saveQuestionAnswer({ question, answer: simpleAnswer });

      // Convert answer to speech
      const buffer = await this.openaiService.textToSpeech({ text: simpleAnswer });

      // Save answer to cache
      await fs.writeFile(`${this.voiceCacheDir}/${question}.mp3`, buffer);

      // Return answer
      return buffer;
    } catch (error) {
      console.error('Error processing audio question:', error);
      throw new Error(`Failed to process audio question: ${error.message}`);
    }
  }

  //   async detectBiasOpenAI(body: any) {
  //     // Validate input is an array of articles
  //     const articles = ArticleArray.parse(body);

  //     // Filter out invalid articles (empty content or title)
  //     const validArticles = articles.filter(article =>
  //       article.title &&
  //       article.content &&
  //       article.title.trim() !== '' &&
  //       article.content.trim() !== ''
  //     );

  //     if (validArticles.length === 0) {
  //       throw new Error('No valid articles to analyze');
  //     }

  //     console.info('Analyzing', validArticles.length, 'articles');

  //     // Step 1: Analyze all articles together for comparative bias
  //     const analysis = await this.openai.chat.completions.create({
  //       model: "gpt-4",
  //       messages: [
  //         {
  //           role: "system",
  //           content: `You are a bias detection expert. Analyze these articles and determine which one shows the most bias.

  // For each article, provide:
  // - A bias score (0-100)
  // - The type of bias (MUST be either "positive" or "negative"); re-evaluate none answer and use closest positive | negative match
  // - A single, concise reason for the bias

  // Then select the most biased article based on your analysis.

  // Return JSON:
  // {
  // "articles": [
  // {
  // "index": 0,
  // "biasScore": 0-100,
  // "biasType": "positive/negative",
  // "reason": "single concise reason"
  // }
  // ],
  // "mostBiased": {
  // "index": 0,
  // "type": "positive/negative",
  // "reason": "single concise reason"
  // }
  // }`
  //         },
  //         {
  //           role: "user",
  //           content: validArticles.map((article, index) =>
  //             `Article ${index + 1}:\nTitle: ${article.title}\nContent: ${article.content.substring(0, 500)}${article.content.length > 500 ? '...' : ''}`
  //           ).join('\n\n')
  //         }
  //       ]
  //     });

  //     const content = analysis.choices[0].message.content;
  //     if (!content) {
  //       throw new Error('Failed to get analysis content');
  //     }

  //     try {
  //       const cleanedContent = content.trim().replace(/^[^{]*/, '').replace(/[^}]*$/, '');
  //       if (!cleanedContent) {
  //         throw new Error('No valid JSON content found in response');
  //       }

  //       const parsed = JSON.parse(cleanedContent);

  //       // Validate the response structure and bias types
  //       const validatedResponse = AnalysisResponse.parse(parsed);

  //       // Validate the selected index
  //       const selectedIndex = validatedResponse.mostBiased.index;
  //       if (selectedIndex < 0 || selectedIndex >= validArticles.length) {
  //         throw new Error(`Invalid article index: ${selectedIndex}`);
  //       }

  //       const selectedArticle = validArticles[selectedIndex];

  //       // Log the full analysis for debugging
  //       console.info('Full analysis:', JSON.stringify(validatedResponse, null, 2));

  //       const response = {
  //         biasedArticle: {
  //           title: selectedArticle.title,
  //           type: validatedResponse.mostBiased.type,
  //           reason: validatedResponse.mostBiased.reason
  //         }
  //       };

  //       console.info('Final response:', response);
  //       return response;
  //     } catch (error) {
  //       console.error('Error parsing analysis:', error);
  //       console.error('Raw content:', content);
  //       throw new Error('Failed to analyze articles: ' + error.message);
  //     }
  //   }

  private async callLlamaAPI(articles: Articles[]): Promise<Response> {
    return this.llamaService.chatCompletion({
      messages: [
        {
          role: "system",
          content: "you are responsible for analyzing information and detecting bias.\nGiven an array of objects with``` {title: string; content: string}```, analyze the content and output the object with the most bias"
        },
        {
          role: "user",
          content: `find the biased article\n\`\`\`\n${JSON.stringify(articles)}\n\`\`\``
        }
      ],
      response_format: responseFormat
    });
  }

  async detectBiasLlama(articles: Articles[]): Promise<BiasResponse> {
    console.info('Starting bias detection for', articles.length, 'articles');

    try {
      const response = await this.callLlamaAPI(articles);
      const data = await response.json();
      console.info('Received response:', JSON.stringify(data, null, 2));

      const content = this.llamaService.validateLlamaResponse(data);
      return parseBiasResponse(content);
    } catch (error) {
      console.error('Error processing response:', error);
      throw error;
    }
  }
}