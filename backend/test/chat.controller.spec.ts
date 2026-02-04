import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatController } from '../src/chat/chat.controller';
import { ChatService } from '../src/chat/chat.service';
import { ChatMessageEntity } from '../src/chat/entities/chat-message.entity';
import { LlmService } from '../src/llm/llm.service';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

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
      controllers: [ChatController],
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

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
  });

  describe('sendMessage', () => {
    it('should return bot reply', async () => {
      mockLlmService.chat.mockResolvedValueOnce('Test reply');
      const result = await controller.sendMessage({ message: 'hello' }, '127.0.0.1');
      expect(result).toEqual({ reply: 'Test reply' });
    });

    it('should process different messages correctly', async () => {
      mockLlmService.chat.mockResolvedValueOnce('Response to question');
      const result = await controller.sendMessage(
        { message: 'How are you?' },
        '127.0.0.1',
      );
      expect(result).toEqual({ reply: 'Response to question' });
    });
  });

  describe('getHistory', () => {
    it('should return empty history for new IP', async () => {
      const result = await controller.getHistory('192.168.1.1');
      expect(result).toEqual([]);
    });

    it('should return history after sending messages', async () => {
      mockLlmService.chat.mockResolvedValueOnce('Bot response');
      await controller.sendMessage({ message: 'test' }, '192.168.1.2');
      const history = await controller.getHistory('192.168.1.2');

      expect(history).toHaveLength(2);
      expect(history[0].sender).toBe('user');
      expect(history[1].sender).toBe('bot');
    });
  });

  describe('streamMessage', () => {
    it('should stream tokens and save messages to history', async () => {
      const mockReq = {
        on: jest.fn(),
      };
      const mockRes = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      await controller.streamMessage(
        { message: 'test message' },
        '192.168.1.3',
        mockReq as any,
        mockRes as any,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockRes.write).toHaveBeenCalled();
      expect(mockRes.end).toHaveBeenCalled();
      expect(mockReq.on).toHaveBeenCalledWith('close', expect.any(Function));

      const history = await controller.getHistory('192.168.1.3');
      expect(history).toHaveLength(2);
      expect(history[0].sender).toBe('user');
      expect(history[0].text).toBe('test message');
      expect(history[1].sender).toBe('bot');
      expect(history[1].text).toBe('Hello World');
    });
  });
});
