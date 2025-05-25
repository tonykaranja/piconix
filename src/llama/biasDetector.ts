export interface Articles {
    title: string;
    content: string;
}

export interface BiasedArticle {
    title: string;
    type: 'positive' | 'negative';
    reason: string;
}

export interface BiasResponse {
    biasedArticle: BiasedArticle;
}

export const responseFormat = {
    type: "json_schema",
    json_schema: {
        schema: {
            properties: {
                biasedArticle: {
                    properties: {
                        title: {
                            type: "string"
                        },
                        type: {
                            type: "string",
                            enum: ["positive", "negative"]
                        },
                        reason: {
                            type: "string"
                        }
                    },
                    required: [
                        "title",
                        "type",
                        "reason"
                    ],
                    type: "object"
                }
            },
            required: [
                "biasedArticle"
            ],
            type: "object"
        }
    }
};
