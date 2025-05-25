import OpenAI from "openai";
import { chatWithF1Bot } from "./openai";
import { config } from 'dotenv';
config({ path: '.env' });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const testQuestions = [
    "What position did Michael Schumacher finish in round 1 in 2000?",
    // "Who finished in position 1 in round 1 of 2000?",
    // "Who constructed the car that finished in position 1 in round 1 of 2000?",
    // "What constructor did Michael Schumacher drive for in round 1 in 2000?",
    // "What is the nationality of the constructor that finished in position 1 in round 1 of 2000?"
];

async function runTests() {
    for (const question of testQuestions) {
        console.log(`\n🧠 Question: ${question}`);
        try {
            const result = await chatWithF1Bot({ userQuestion: question, openai: openai });
            console.log(`✅ Answer:`, result);
        } catch (err) {
            console.error(`❌ Error answering "${question}":`, err);
        }
    }
}

runTests();
