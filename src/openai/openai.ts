import OpenAI from "openai";
import { functions, handleFunctionCall } from "./functions";
import { LlamaService } from "../llama/llama";

async function getFunctionCallResult({ openai, userQuestion }: { openai: OpenAI, userQuestion: string }): Promise<any> {
    const chat = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: "You are an expert in Formula One data. Extract the most relevant information from the data and provide a clear, concise answer." },
            { role: "user", content: userQuestion }
        ],
        functions,
        function_call: "auto"
    });

    if (!chat.choices?.[0]?.message) {
        throw new Error("No response from OpenAI");
    }

    const message = chat.choices[0].message;
    console.log(`[DEBUG] Message:`, message);

    if (!message.function_call) {
        throw new Error("No function call in message");
    }

    const result = await handleFunctionCall(
        message.function_call.name,
        JSON.parse(message.function_call.arguments || "{}")
    );

    if (!result) {
        throw new Error("No result from function call");
    }

    console.log(`[DEBUG] Raw Result:`, result);
    return result;
}

export async function chatWithF1Bot({ userQuestion, openai, llamaService }: { userQuestion: string, openai: OpenAI, llamaService: LlamaService }): Promise<string> {
    if (!userQuestion?.trim()) {
        throw new Error("Question cannot be empty");
    }

    console.log(`[DEBUG] Chatting with F1 bot: ${userQuestion}`);

    try {
        const result = await getFunctionCallResult({ openai, userQuestion });
        return await llamaService.processWithLlama({ userQuestion, result });
    } catch (error) {
        console.error("[ERROR] Error in chatWithF1Bot:", error);
        throw error instanceof Error
            ? error
            : new Error("Unknown error occurred while processing the question");
    }
}
