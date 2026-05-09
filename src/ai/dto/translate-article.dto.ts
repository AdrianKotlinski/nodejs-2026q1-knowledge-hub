import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranslateArticleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceLanguage?: string;
}
