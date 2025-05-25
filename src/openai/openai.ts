import OpenAI from "openai";
import { functions, handleFunctionCall } from "./functions";

export async function chatWithF1Bot({ userQuestion, openai }: { userQuestion: string, openai: OpenAI }) {
    console.log(`[DEBUG] Chatting with F1 bot: ${userQuestion}`);
    const chat = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: "You are an expert in Formula One data." },
            { role: "user", content: userQuestion }
        ],
        functions,
        function_call: "auto"
    });
    console.log(`[DEBUG] Chat:`, chat);

    const message = chat.choices[0].message;
    console.log(`[DEBUG] Message:`, message);

    // if (message.tool_calls && message.tool_calls.length > 0) {
    //     const toolCall = message.tool_calls[0];
    //     const result = await handleFunctionCall(toolCall.function.name, toolCall.function.arguments);

    //     return result;
    // }

    if (message.function_call) {
        const result = await handleFunctionCall(message.function_call.name, JSON.parse(message.function_call.arguments || "{}"));
        console.log(`[DEBUG] Result:`, result);
        return result;
    }

    if (!message.content) {
        throw new Error("No content in message");
    }

    return message.content;
}
