import { BiasResponse } from "./llama/biasDetector.types";

export function parseBiasResponse(content: string): BiasResponse {
    try {
        // Parse the content as JSON and validate the structure
        const parsedContent = JSON.parse(content);
        if (!parsedContent.biasedArticle) {
            throw new Error('Invalid response structure: missing biasedArticle');
        }

        // Validate the required fields
        const { title, type, reason } = parsedContent.biasedArticle;
        if (!title || !type || !reason) {
            throw new Error('Invalid response structure: missing required fields');
        }

        // Clean up the title by removing extra quotes
        parsedContent.biasedArticle.title = title.replace(/^"|"$/g, '');

        console.info('Successfully parsed and validated response');
        return parsedContent as BiasResponse;
    } catch (e) {
        console.error('Failed to parse response content:', e);
        throw new Error('Invalid response format');
    }
}