import { Injectable } from '@nestjs/common';
import OpenAI from "openai";
import { config } from 'dotenv';
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import * as fs from 'fs/promises';
import * as path from 'path';

const BiasDetection = z.object({
    biasedArticle: z.object({
        title: z.string(),
        type: z.enum(['positive', 'negative']),
        reason: z.string(),
    }),
});

const Article = z.object({
    title: z.string(),
    content: z.string(),
});

const ArticleArray = z.array(Article);

const BiasType = z.enum(['positive', 'negative', 'none']).transform(val =>
    val === 'none' ? 'negative' : val
);

const ArticleAnalysis = z.object({
    index: z.number(),
    biasScore: z.number().min(0).max(100),
    biasType: BiasType,
    reason: z.string().min(1)
});

const AnalysisResponse = z.object({
    articles: z.array(ArticleAnalysis),
    mostBiased: z.object({
        index: z.number(),
        type: BiasType,
        reason: z.string().min(1)
    })
});

config({ path: '.env' });

// Type-safe environment variables
const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
} as const;

@Injectable()
export class AppService {
    private readonly openai: OpenAI;
    private readonly voiceCacheDir: string;

    constructor() {
        this.openai = new OpenAI({
            apiKey: env.OPENAI_API_KEY,
        });
        this.voiceCacheDir = path.join(process.cwd(), 'voice-cache');
        this.initializeCacheDirectory();
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
            console.log(`Generating new voice file for ${name}`);
            const mp3 = await this.openai.audio.speech.create({
                model: "gpt-4o-mini-tts",
                voice: "alloy",
                input: name,
                instructions: "say the input name",
            });

            const buffer = Buffer.from(await mp3.arrayBuffer());

            // Save to cache
            await fs.writeFile(filePath, buffer);

            return buffer;
        }
    }

    async handleAudioQuestion(audioFile: Express.Multer.File): Promise<Buffer> {
        try {
            if (!audioFile) {
                throw new Error('No audio file provided');
            }

            // Ensure we have a valid buffer
            if (!audioFile.buffer) {
                throw new Error('Audio file buffer is empty');
            }

            // Create a File object from the buffer
            const file = new File(
                [audioFile.buffer],
                audioFile.originalname || 'audio.wav',
                { type: audioFile.mimetype || 'audio/wav' }
            );

            // Convert audio file to text using OpenAI's Whisper
            const transcription = await this.openai.audio.transcriptions.create({
                file,
                model: "whisper-1",
            });

            if (!transcription.text) {
                throw new Error('Failed to transcribe audio');
            }

            // Get answer from GPT-4
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "Provide concise, accurate answers to the input question."
                    },
                    {
                        role: "user",
                        content: transcription.text
                    }
                ],
            });

            const answer = completion.choices[0].message.content;
            if (!answer) {
                throw new Error('Failed to generate answer');
            }

            // Convert answer to speech
            const mp3 = await this.openai.audio.speech.create({
                model: "gpt-4o-mini-tts",
                voice: "alloy",
                input: answer,
            });

            return Buffer.from(await mp3.arrayBuffer());
        } catch (error) {
            console.error('Error processing audio question:', error);
            throw new Error(`Failed to process audio question: ${error.message}`);
        }
    }

    //   async detectBias(body: any) {
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
    //   "articles": [
    //     {
    //       "index": 0,
    //       "biasScore": 0-100,
    //       "biasType": "positive/negative",
    //       "reason": "single concise reason"
    //     }
    //   ],
    //   "mostBiased": {
    //     "index": 0,
    //     "type": "positive/negative",
    //     "reason": "single concise reason"
    //   }
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
    async detectBias(body: any) {
        // Validate input is an array of articles
        const articles = ArticleArray.parse(body);

        // Filter out invalid articles (empty content or title)
        const validArticles = articles.filter(article =>
            article.title &&
            article.content &&
            article.title.trim() !== '' &&
            article.content.trim() !== ''
        );

        if (validArticles.length === 0) {
            throw new Error('No valid articles to analyze');
        }

        console.info('Analyzing', validArticles.length, 'articles');

        // Step 1: Analyze all articles together for comparative bias
        const analysis = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a bias detection expert. Analyze these articles and determine which one shows the most bias.

For each article, provide:
- A bias score (0-100)
- The type of bias (MUST be either "positive" or "negative"); re-evaluate none answer and use closest positive | negative match
- A single, concise reason for the bias

Then select the most biased article based on your analysis.

Return JSON:
{
"articles": [
{
"index": 0,
"biasScore": 0-100,
"biasType": "positive/negative",
"reason": "single concise reason"
}
],
"mostBiased": {
"index": 0,
"type": "positive/negative",
"reason": "single concise reason"
}
}`
                },
                {
                    role: "user",
                    content: validArticles.map((article, index) =>
                        `Article ${index + 1}:\nTitle: ${article.title}\nContent: ${article.content.substring(0, 500)}${article.content.length > 500 ? '...' : ''}`
                    ).join('\n\n')
                }
            ]
        });

        const content = analysis.choices[0].message.content;
        if (!content) {
            throw new Error('Failed to get analysis content');
        }

        try {
            const cleanedContent = content.trim().replace(/^[^{]*/, '').replace(/[^}]*$/, '');
            if (!cleanedContent) {
                throw new Error('No valid JSON content found in response');
            }

            const parsed = JSON.parse(cleanedContent);

            // Validate the response structure and bias types
            const validatedResponse = AnalysisResponse.parse(parsed);

            // Validate the selected index
            const selectedIndex = validatedResponse.mostBiased.index;
            if (selectedIndex < 0 || selectedIndex >= validArticles.length) {
                throw new Error(`Invalid article index: ${selectedIndex}`);
            }

            const selectedArticle = validArticles[selectedIndex];

            // Log the full analysis for debugging
            console.info('Full analysis:', JSON.stringify(validatedResponse, null, 2));

            const response = {
                biasedArticle: {
                    title: selectedArticle.title,
                    type: validatedResponse.mostBiased.type,
                    reason: validatedResponse.mostBiased.reason
                }
            };

            console.info('Final response:', response);
            return response;
        } catch (error) {
            console.error('Error parsing analysis:', error);
            console.error('Raw content:', content);
            throw new Error('Failed to analyze articles: ' + error.message);
        }
    }
}
