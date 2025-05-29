import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { functions } from './functions';
import {
    OpenAIRequestConfig,
    OpenAIResponse,
    FunctionResponse
} from './types';
import { DbService } from '../db.service';

@Injectable()
export class OpenAIService {
    private readonly apiKey: string;
    private readonly openai: OpenAI;

    constructor(private configService: ConfigService, private dbService: DbService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not set in environment variables');
        }
        this.apiKey = apiKey;
        this.openai = new OpenAI({ apiKey: this.apiKey });
    }

    async chatCompletion(config: OpenAIRequestConfig): Promise<OpenAIResponse> {
        try {
            const chat = await this.openai.chat.completions.create({
                ...{
                    model: "gpt-4",
                    ...config
                }
            });

            if (!chat.choices?.[0]?.message) {
                throw new Error("No response from OpenAI");
            }

            return chat.choices[0].message as OpenAIResponse;
        } catch (error) {
            console.error('OpenAI API request failed:', error);
            throw error instanceof Error ? error : new Error('Unknown error occurred with OpenAI API');
        }
    }

    async fetchDbAnswer({ userQuestion }: { userQuestion: string }): Promise<FunctionResponse> {
        if (!userQuestion?.trim()) {
            throw new Error("Question cannot be empty");
        }

        try {
            const message = await this.chatCompletion({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert in Formula One data. Extract the most relevant information from the data and provide a clear, concise answer."
                    },
                    { role: "user", content: userQuestion }
                ],
                functions,
                function_call: "auto"
            });

            if (!message.function_call) {
                throw new Error("No function call in message");
            }

            const result = await this.dbService.handleOpenAIFunctionCall(
                message.function_call.name,
                JSON.parse(message.function_call.arguments || "{}")
            );

            if (!result) {
                throw new Error("No result from function call");
            }

            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error("[ERROR] Error in processWithOpenAI:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred while processing the question"
            };
        }
    }

    async transcribeAudio(file: File): Promise<string> {
        const transcription = await this.openai.audio.transcriptions.create({
            file,
            model: "whisper-1",
        });

        if (!transcription.text) {
            throw new Error('Failed to transcribe audio');
        }

        return transcription.text;
    }

    async textToSpeech({ text, instructions }: { text: string, instructions?: string }): Promise<Buffer> {
        const mp3 = await this.openai.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "alloy",
            input: text,
            ...(instructions && { instructions }),
        });

        return Buffer.from(await mp3.arrayBuffer());
    }
} 