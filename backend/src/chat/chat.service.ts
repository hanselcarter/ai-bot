import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './dto/chat.dto';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessageEntity)
    private chatMessageRepository: Repository<ChatMessageEntity>,
    private readonly llmService: LlmService,
  ) {}

  async processMessage(message: string, sessionId: string = 'default'): Promise<string> {
    const userMessage = this.chatMessageRepository.create({
      sessionId,
      text: message,
      sender: 'user',
    });
    await this.chatMessageRepository.save(userMessage);

    const botReply = await this.llmService.chat(message);

    const botMessage = this.chatMessageRepository.create({
      sessionId,
      text: botReply,
      sender: 'bot',
    });
    await this.chatMessageRepository.save(botMessage);

    return botReply;
  }

  async getChatHistory(sessionId: string = 'default'): Promise<ChatMessage[]> {
    const messages = await this.chatMessageRepository.find({
      where: { sessionId },
      order: { timestamp: 'ASC' },
    });

    return messages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
    }));
  }

  async *streamMessage(
    message: string,
    sessionId: string = 'default',
    signal?: AbortSignal,
  ): AsyncGenerator<string> {
    // Save user message
    const userMessage = this.chatMessageRepository.create({
      sessionId,
      text: message,
      sender: 'user',
    });
    await this.chatMessageRepository.save(userMessage);

    // Stream and collect bot reply
    let fullReply = '';
    for await (const chunk of this.llmService.chatStream(message, signal)) {
      if (signal?.aborted) break;
      fullReply += chunk;
      yield chunk;
    }

    // Save complete bot message (even if aborted, save what we have)
    if (fullReply) {
      const botMessage = this.chatMessageRepository.create({
        sessionId,
        text: fullReply,
        sender: 'bot',
      });
      await this.chatMessageRepository.save(botMessage);
    }
  }
}
