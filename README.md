# Piconix - F1 Data Analysis Service

A NestJS-based service that provides Formula One data analysis using OpenAI and Llama AI models.

## Overview

Piconix is a specialized service that combines the power of OpenAI's GPT-4 and Llama AI to provide intelligent analysis of Formula One data. The service processes natural language queries about F1 data and returns concise, accurate responses.

## Features

- Natural language processing of F1-related queries
- Integration with OpenAI GPT-4 for initial query processing
- Llama AI integration for data extraction and response refinement
- Structured data handling with Prisma ORM
- Docker support for easy deployment

## Services

### OpenAI Service

The `OpenAIService` provides integration with OpenAI's API, offering the following capabilities:

- **Chat Completion**: Process natural language queries using GPT-4
- **Database Query**: Extract structured data from the database based on user questions
- **Audio Transcription**: Convert speech to text using Whisper
- **Text-to-Speech**: Convert text responses to speech

Example usage:
```typescript
@Injectable()
export class YourService {
  constructor(private openAIService: OpenAIService) {}

  async processQuery(question: string) {
    const result = await this.openAIService.fetchDbAnswer({ userQuestion: question });
    // Process result...
  }
}
```

### Llama Service

The `LlamaService` provides integration with Llama AI, specializing in:

- **Chat Completion**: Process queries using Llama's language model
- **JSON Answer Extraction**: Extract and format answers from structured data
- **Response Validation**: Ensure response quality and format

Example usage:
```typescript
@Injectable()
export class YourService {
  constructor(private llamaService: LlamaService) {}

  async getAnswer(question: string, data: any) {
    const result = await this.llamaService.extractJsonAnswer({
      userQuestion: question,
      result: data
    });
    // Process result...
  }
}
```

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose (for containerized deployment)
- OpenAI API key
- Llama API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Llama Configuration
LLAMA_API_KEY=your_llama_api_key
LLAMA_API_URL=https://api.llama.com/v1

# Database Configuration (if using Prisma)
DATABASE_URL=your_database_url
```

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd piconix
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database (if using Prisma):
```bash
npx prisma generate
npx prisma migrate dev
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start in watch mode, automatically reloading when changes are detected.

## Building

Build the project:
```bash
npm run build
```

## Running in Production

Start the production server:
```bash
npm run start:prod
```

## Docker Deployment

Build and run using Docker Compose:
```bash
docker-compose up --build
```

## API Usage

The service provides endpoints for F1 data queries. Here's an example of how to use it:

```typescript
// Using OpenAI Service
const openaiResponse = await openAIService.fetchDbAnswer({
    userQuestion: "Who won the Monaco Grand Prix in 2023?"
});

// Using Llama Service
const llamaResponse = await llamaService.extractJsonAnswer({
    userQuestion: "Who won the Monaco Grand Prix in 2023?",
    result: openaiResponse.data
});
```

## Testing

Run the test suite:
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```
src/
├── llama/           # Llama AI integration
│   ├── llama.ts     # LlamaService implementation
│   └── types.ts     # Llama-specific types
├── openai/          # OpenAI integration
│   ├── openai.service.ts  # OpenAIService implementation
│   ├── functions.ts       # OpenAI function definitions
│   └── types.ts          # OpenAI-specific types
├── prisma/          # Database schema and migrations
└── test/            # Test files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
