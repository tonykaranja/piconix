import OpenAI from "openai";
import { functions, handleFunctionCall } from "./functions";

export async function chatWithF1Bot({ userQuestion, openai }: { userQuestion: string, openai: OpenAI }): Promise<string> {
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

        const processedAnswer = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a Formula One expert. Given the raw data and the original question, provide a clear, concise answer in natural language. Focus on the most relevant information and be direct. Do not include any other information or repeat the question. provide one word answer / fewest words if possible for nouns, names and position numbers or nouns or as need be. give answer only in form of `5th position` or name ie `Lewis Hamilton`"
                },
                {
                    role: "user",
                    content: `Question: ${userQuestion}\nRaw Data: ${JSON.stringify(result)}\nPlease provide a simple, clear, concise answer based on this data. use one-word answer / fewest words if possible for names and position numbers or nouns or as need be.`
                }
            ]
        });

        if (!processedAnswer.choices?.[0]?.message?.content) {
            throw new Error("No content in processed answer");
        }

        const answer = processedAnswer.choices[0].message.content;
        console.log(`[DEBUG] Processed Answer:`, answer);

        if (!answer.trim()) {
            throw new Error("Empty answer generated");
        }

        return answer;
    } catch (error) {
        console.error("[ERROR] Error in chatWithF1Bot:", error);
        throw error instanceof Error
            ? error
            : new Error("Unknown error occurred while processing the question");
    }
}
