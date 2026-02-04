import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
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
  private llm: ChatGoogleGenerativeAI;
  private chain: RunnableSequence<{ question: string }, string>;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
    const model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';

    if (!apiKey) {
      this.logger.warn('GOOGLE_API_KEY not set. LLM features will be disabled.');
      return;
    }

    this.llm = new ChatGoogleGenerativeAI({
      apiKey,
      model,
      temperature: 0.7,
      maxRetries: 2,
    });

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: 'text-embedding-004',
    });

    const documents = await this.loadKnowledgeDocuments();
    this.vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);

    this.chain = this.createChain();
    this.logger.log('LLM service initialized with Gemini and RAG support');
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
      return 'LLM service is not configured. Please set GOOGLE_API_KEY environment variable.';
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
      yield 'LLM service is not configured. Please set GOOGLE_API_KEY environment variable.';
      return;
    }

    try {
      const context = await this.getContext(message);
      const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(SYSTEM_PROMPT),
        HumanMessagePromptTemplate.fromTemplate('{question}'),
      ]);

      const formattedMessages = await prompt.formatMessages({ context, question: message });
      const stream = await this.llm.stream(formattedMessages);

      for await (const chunk of stream) {
        if (signal?.aborted) break;
        const content = chunk.content;
        if (content) {
          const text = typeof content === 'string' ? content : String(content);
          if (text) {
            yield text;
          }
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
