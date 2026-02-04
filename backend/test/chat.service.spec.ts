import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatService } from '../src/chat/chat.service';
import { ChatMessageEntity } from '../src/chat/entities/chat-message.entity';
import { LlmService } from '../src/llm/llm.service';

describe('ChatService', () => {
  let service: ChatService;
  let repository: Repository<ChatMessageEntity>;

  const mockLlmService = {
    chat: jest.fn().mockResolvedValue('Mock LLM response'),
    chatStream: jest.fn().mockImplementation(async function* (_message: string, _signal?: AbortSignal) {
      yield 'Hello';
      yield ' World';
    }),
  };

  const mockMessages: ChatMessageEntity[] = [];

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => ({
      id: `${Date.now()}-${Math.random()}`,
      ...dto,
      timestamp: new Date(),
    })),
    save: jest.fn().mockImplementation((entity) => {
      mockMessages.push(entity);
      return Promise.resolve(entity);
    }),
    find: jest.fn().mockImplementation(({ where }) => {
      const filtered = mockMessages.filter((m) => m.sessionId === where.sessionId);
      return Promise.resolve(filtered);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockMessages.length = 0;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatMessageEntity),
          useValue: mockRepository,
        },
        {
          provide: LlmService,
          useValue: mockLlmService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    repository = module.get<Repository<ChatMessageEntity>>(
      getRepositoryToken(ChatMessageEntity),
    );
  });

  describe('processMessage', () => {
    it('should call LlmService.chat with the message', async () => {
      await service.processMessage('hello', 'test-session');
      expect(mockLlmService.chat).toHaveBeenCalledWith('hello');
    });

    it('should return LLM response', async () => {
      mockLlmService.chat.mockResolvedValueOnce('Test response');
      const result = await service.processMessage('hello', 'test-session');
      expect(result).toBe('Test response');
    });

    it('should store messages in database', async () => {
      mockLlmService.chat.mockResolvedValueOnce('Bot reply');
      await service.processMessage('test message', 'session1');

      expect(mockRepository.create).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);

      const history = await service.getChatHistory('session1');
      expect(history).toHaveLength(2);
      expect(history[0].sender).toBe('user');
      expect(history[0].text).toBe('test message');
      expect(history[1].sender).toBe('bot');
      expect(history[1].text).toBe('Bot reply');
    });

    it('should maintain separate history per session', async () => {
      mockLlmService.chat
        .mockResolvedValueOnce('Response 1')
        .mockResolvedValueOnce('Response 2');

      await service.processMessage('message1', 'session1');
      await service.processMessage('message2', 'session2');

      const history1 = await service.getChatHistory('session1');
      const history2 = await service.getChatHistory('session2');

      expect(history1).toHaveLength(2);
      expect(history2).toHaveLength(2);
      expect(history1[0].text).toBe('message1');
      expect(history2[0].text).toBe('message2');
    });
  });

  describe('getChatHistory', () => {
    it('should return empty array for new session', async () => {
      const history = await service.getChatHistory('new-session');
      expect(history).toEqual([]);
    });

    it('should return all messages in order', async () => {
      mockLlmService.chat
        .mockResolvedValueOnce('First reply')
        .mockResolvedValueOnce('Second reply');

      await service.processMessage('first', 'session');
      await service.processMessage('second', 'session');

      const history = await service.getChatHistory('session');

      expect(history).toHaveLength(4);
      expect(history[0].text).toBe('first');
      expect(history[2].text).toBe('second');
    });
  });

  describe('streamMessage', () => {
    it('should stream tokens from LlmService', async () => {
      const tokens: string[] = [];

      for await (const chunk of service.streamMessage('test', 'stream-session')) {
        tokens.push(chunk);
      }

      expect(tokens).toEqual(['Hello', ' World']);
      expect(mockLlmService.chatStream).toHaveBeenCalledWith('test', undefined);
    });

    it('should save user and bot messages after streaming', async () => {
      const tokens: string[] = [];

      for await (const chunk of service.streamMessage('test message', 'stream-session-2')) {
        tokens.push(chunk);
      }

      const history = await service.getChatHistory('stream-session-2');
      expect(history).toHaveLength(2);
      expect(history[0].sender).toBe('user');
      expect(history[0].text).toBe('test message');
      expect(history[1].sender).toBe('bot');
      expect(history[1].text).toBe('Hello World');
    });
  });
});
