import { Controller, Post, Get, Body, UseGuards, Ip, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { CreateChatDto, ChatResponse, ChatMessage } from './dto/chat.dto';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Controller('chat')
@UseGuards(RateLimitGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @Body() createChatDto: CreateChatDto,
    @Ip() ip: string,
  ): Promise<ChatResponse> {
    const reply = await this.chatService.processMessage(createChatDto.message, ip);
    return { reply };
  }

  @Post('stream')
  async streamMessage(
    @Body() createChatDto: CreateChatDto,
    @Ip() ip: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // AbortController to stop streaming when client disconnects
    const abortController = new AbortController();
    const { signal } = abortController;

    req.on('close', () => {
      abortController.abort();
    });

    try {
      const stream = this.chatService.streamMessage(createChatDto.message, ip, signal);

      for await (const chunk of stream) {
        if (signal.aborted) break;
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
      }

      if (!signal.aborted) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }
      res.end();
    } catch (error) {
      if (!signal.aborted) {
        res.write(`data: ${JSON.stringify({ error: 'Failed to stream response' })}\n\n`);
      }
      res.end();
    }
  }

  @Get('history')
  async getHistory(@Ip() ip: string): Promise<ChatMessage[]> {
    return this.chatService.getChatHistory(ip);
  }
}
