import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import * as fs from 'fs';
import * as path from 'path';

const SYSTEM_PROMPT = `You are an expert Software Engineering assistant. You specialize in:
- Design patterns and architecture
- Testing best practices (unit, integration, E2E)
- Clean code principles and refactoring
- Software development methodologies

Use the provided context to answer questions accurately.
If a question is outside software engineering, politely redirect:
"I specialize in software engineering topics. Feel free to ask about design patterns, testing, clean code, or development practices!"

Keep answers concise but informative.

Context:
{context}`;

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  private vectorStore: MemoryVectorStore;
  private llm: ChatOpenAI;
  private chain: RunnableSequence<{ question: string }, string>;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set. LLM features will be disabled.');
      return;
    }

    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: model,
      temperature: 0.7,
    });

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
    });

    const documents = await this.loadKnowledgeDocuments();
    this.vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);

    this.chain = this.createChain();
    this.logger.log('LLM service initialized with RAG support');
  }

  private async loadKnowledgeDocuments(): Promise<Document[]> {
    const knowledgeDir = path.join(__dirname, 'knowledge');
    const documents: Document[] = [];

    if (!fs.existsSync(knowledgeDir)) {
      this.logger.warn(`Knowledge directory not found: ${knowledgeDir}`);
      return documents;
    }

    const files = fs.readdirSync(knowledgeDir).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(knowledgeDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const chunks = this.splitIntoChunks(content, 1000, 200);

      for (const chunk of chunks) {
        documents.push(
          new Document({
            pageContent: chunk,
            metadata: { source: file },
          }),
        );
      }
    }

    this.logger.log(`Loaded ${documents.length} document chunks from ${files.length} files`);
    return documents;
  }

  private splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }

    return chunks;
  }

  private createChain(): RunnableSequence<{ question: string }, string> {
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(SYSTEM_PROMPT),
      HumanMessagePromptTemplate.fromTemplate('{question}'),
    ]);

    return RunnableSequence.from([
      {
        context: async (input: { question: string }) => {
          const docs = await this.vectorStore.similaritySearch(input.question, 3);
          return docs.map((doc) => doc.pageContent).join('\n\n');
        },
        question: (input: { question: string }) => input.question,
      },
      prompt,
      this.llm,
      new StringOutputParser(),
    ]);
  }

  async chat(message: string): Promise<string> {
    if (!this.llm) {
      return 'LLM service is not configured. Please set OPENAI_API_KEY environment variable.';
    }

    try {
      const response = await this.chain.invoke({ question: message });
      return response;
    } catch (error) {
      this.logger.error('Error calling LLM:', error);
      throw new Error('Failed to get response from AI service');
    }
  }

  async *chatStream(message: string, signal?: AbortSignal): AsyncGenerator<string> {
    if (!this.llm) {
      yield 'LLM service is not configured. Please set OPENAI_API_KEY environment variable.';
      return;
    }

    try {
      const context = await this.getContext(message);
      const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(SYSTEM_PROMPT),
        HumanMessagePromptTemplate.fromTemplate('{question}'),
      ]);

      const formattedMessages = await prompt.formatMessages({ context, question: message });
      const stream = await this.llm.stream(formattedMessages, { signal });

      for await (const chunk of stream) {
        if (signal?.aborted) break;
        if (chunk.content) {
          yield chunk.content.toString();
        }
      }
    } catch (error) {
      // Don't log abort errors as they're expected when client disconnects
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      this.logger.error('Error streaming LLM:', error);
      throw new Error('Failed to stream response from AI service');
    }
  }

  private async getContext(question: string): Promise<string> {
    if (!this.vectorStore) {
      return '';
    }
    const docs = await this.vectorStore.similaritySearch(question, 3);
    return docs.map((doc) => doc.pageContent).join('\n\n');
  }
}
