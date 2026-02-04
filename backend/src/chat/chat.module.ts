import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessageEntity]), LlmModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
