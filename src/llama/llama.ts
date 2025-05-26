import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface LlamaMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface LlamaRequestConfig {
    messages: LlamaMessage[];
    model?: string;
    temperature?: number;
    top_p?: number;
    max_completion_tokens?: number;
    response_format?: any;
    repetition_penalty?: number;
    stream?: boolean;
}

@Injectable()
export class LlamaService {
    private readonly apiKey: string;
    private readonly baseUrl: string;
    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('LLAMA_API_KEY');
        if (!apiKey) {
            throw new Error('LLAMA_API_KEY is not set in environment variables');
        }
        this.apiKey = apiKey;
        this.baseUrl = this.configService.get<string>('LLAMA_API_URL', 'https://api.llama.com/v1') ?? 'https://api.llama.com/v1';
    }

    async chatCompletion(config: LlamaRequestConfig): Promise<Response> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: config.model || "Llama-4-Maverick-17B-128E-Instruct-FP8",
                temperature: config.temperature ?? 0.6,
                top_p: config.top_p ?? 0.9,
                max_completion_tokens: config.max_completion_tokens ?? 2048,
                repetition_penalty: config.repetition_penalty ?? 1,
                stream: config.stream ?? false,
                ...config
            })
        });

        if (!response.ok) {
            console.error('API request failed with status:', response.status);
            throw new Error(`API call failed with status ${response.status}`);
        }

        return response;
    }
}