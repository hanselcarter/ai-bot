import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from './chat/chat.module';
import { LlmModule } from './llm/llm.module';
import { ChatMessageEntity } from './chat/entities/chat-message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH || 'data/chat.db',
      entities: [ChatMessageEntity],
      synchronize: true,
    }),
    ChatModule,
    LlmModule,
  ],
})
export class AppModule {}
