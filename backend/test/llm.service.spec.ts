import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../src/llm/llm.service';

jest.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
  })),
  GoogleGenerativeAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedDocuments: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  })),
}));

jest.mock('langchain/vectorstores/memory', () => ({
  MemoryVectorStore: {
    fromDocuments: jest.fn().mockResolvedValue({
      similaritySearch: jest.fn().mockResolvedValue([
        { pageContent: 'Test content about design patterns', metadata: { source: 'test.md' } },
      ]),
    }),
  },
}));

describe('LlmService', () => {
  let service: LlmService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        GOOGLE_API_KEY: 'test-api-key',
        GEMINI_MODEL: 'gemini-1.5-flash',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('configuration', () => {
    it('should read GOOGLE_API_KEY from config', () => {
      expect(configService.get('GOOGLE_API_KEY')).toBe('test-api-key');
    });

    it('should read GEMINI_MODEL from config', () => {
      expect(configService.get('GEMINI_MODEL')).toBe('gemini-1.5-flash');
    });
  });

  describe('chat', () => {
    it('should return error message when LLM is not configured', async () => {
      const unconfiguredConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LlmService,
          {
            provide: ConfigService,
            useValue: unconfiguredConfigService,
          },
        ],
      }).compile();

      const unconfiguredService = module.get<LlmService>(LlmService);
      await unconfiguredService.onModuleInit();

      const result = await unconfiguredService.chat('test message');
      expect(result).toContain('GOOGLE_API_KEY');
    });
  });

  describe('chatStream', () => {
    it('should yield error message when LLM is not configured', async () => {
      const unconfiguredConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LlmService,
          {
            provide: ConfigService,
            useValue: unconfiguredConfigService,
          },
        ],
      }).compile();

      const unconfiguredService = module.get<LlmService>(LlmService);
      await unconfiguredService.onModuleInit();

      const tokens: string[] = [];
      for await (const token of unconfiguredService.chatStream('test message')) {
        tokens.push(token);
      }

      expect(tokens.join('')).toContain('GOOGLE_API_KEY');
    });
  });
});
