import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatRagDto {
  @ApiProperty({ description: 'Question to ask the knowledge base' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ description: 'Conversation ID for multi-turn chat' })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
