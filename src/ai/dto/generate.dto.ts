import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ description: 'Session ID for conversation context' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
