import OpenAI from "openai";
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env' });

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'] as const;
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Type-safe environment variables
const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
} as const;

const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

async function testApi() {
    const response = await client.responses.create({
        model: "gpt-4.1",
        input: "Write a one-sentence bedtime story about a unicorn."
    });

    return response;
}

// Handle the promise properly
testApi()
    .then(response => console.log('Response:', response))
    .catch(error => console.error('Error:', error));