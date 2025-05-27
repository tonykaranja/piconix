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

    async processWithLlama({ userQuestion, result }: { userQuestion: string, result: any }): Promise<string> {
        const llamaResponse = await this.chatCompletion({
            messages: [
                {
                    role: "system",
                    content: `
                You are a expert in extracting information from json data. Given the json with answer data and the original question, extract a clear, concise answer in natural language. Focus on the most relevant information and be direct. Do not include any other information or repeat the question. provide one word answer / fewest words if possible for nouns, names and position numbers or nouns or as need be.
                Question: 'Who constructed the car that finished in position 5 in round 6 of 2015?' & answer JSON raw ${JSON.stringify({ constructorName: 'Red Bull', constructorId: 'red_bull' })}, answer should be 'Red Bull'.;
                for questions like Question: 'Who finished in position 8 in round 17 of 2015?' Raw json answer ${JSON.stringify({
                        driverName: 'Sergio Pérez',
                        driverId: 'perez',
                        constructorName: 'Force India',
                        constructorId: 'force_india'
                    })}, give name of driver (driverName) only ie 'Sergio Pérez'.;
                for questions like Question: 'What position did Giancarlo Fisichella finish in round 3 in 2008?' Raw json answer ${JSON.stringify({
                        position: 12,
                        constructorName: 'Force India',
                        constructorId: 'force_india'
                    })}, give (position) only ie '12th'.;
                `
                },
                {
                    role: "user",
                    content: `Question: ${userQuestion}\nRaw json answer data: ${JSON.stringify(result)}\nPlease extract a simple, clear, concise answer in natural language for the question based on the answer data.`
                }
            ],
            temperature: 0.2
        });

        const llamaData = await llamaResponse.json();
        console.info(`[DEBUG] Llama Data:`, llamaData);
        if (!llamaData.completion_message?.content?.text) {
            throw new Error("No content in Llama response");
        }

        const answer: string = llamaData.completion_message.content.text;
        console.info(`[DEBUG] Processed Answer:`, answer);

        if (!answer.trim()) {
            throw new Error("Empty answer generated");
        }

        console.info(`[DEBUG] Answer:`, answer);
        return answer;
    }
}
