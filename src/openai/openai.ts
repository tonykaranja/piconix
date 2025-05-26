import OpenAI from "openai";
import { functions, handleFunctionCall } from "./functions";
import { LlamaService } from "../llama/llama";

export async function chatWithF1Bot({ userQuestion, openai, llamaService }: { userQuestion: string, openai: OpenAI, llamaService: LlamaService }): Promise<string> {
    if (!userQuestion?.trim()) {
        throw new Error("Question cannot be empty");
    }

    console.log(`[DEBUG] Chatting with F1 bot: ${userQuestion}`);

    try {
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

        // Then, use Llama to process the answer
        const llamaResponse = await llamaService.chatCompletion({
            messages: [
                {
                    role: "system",
                    content: "You are a expert in extracting information from json data. Given the json with answer data and the original question, extract a clear, concise answer in natural language. Focus on the most relevant information and be direct. Do not include any other information or repeat the question. provide one word answer / fewest words if possible for nouns, names and position numbers or nouns or as need be. give answer only in form of `5th` (for position) and name ie `Lewis Hamilton`"
                },
                {
                    role: "user",
                    content: `Question: ${userQuestion}\nRaw json answer data: ${JSON.stringify(result)}\nPlease extract a simple, clear, concise answer for the question based on the answer data. use one-word answer / fewest words if possible for names and position numbers or nouns or as need be.`
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

    } catch (error) {
        console.error("[ERROR] Error in chatWithF1Bot:", error);
        throw error instanceof Error
            ? error
            : new Error("Unknown error occurred while processing the question");
    }
}
