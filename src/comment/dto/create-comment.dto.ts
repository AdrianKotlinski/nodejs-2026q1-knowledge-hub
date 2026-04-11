import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great article!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  articleId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  authorId?: string | null;
}
