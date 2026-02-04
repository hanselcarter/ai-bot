import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sessionId!: string;

  @Column('text')
  text!: string;

  @Column()
  sender!: 'user' | 'bot';

  @CreateDateColumn()
  timestamp!: Date;
}
