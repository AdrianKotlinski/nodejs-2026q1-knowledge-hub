import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SummaryMaxLength {
  SHORT = 'short',
  MEDIUM = 'medium',
  DETAILED = 'detailed',
}

export class SummarizeArticleDto {
  @ApiPropertyOptional({ enum: SummaryMaxLength, default: SummaryMaxLength.MEDIUM })
  @IsOptional()
  @IsEnum(SummaryMaxLength)
  maxLength?: SummaryMaxLength = SummaryMaxLength.MEDIUM;
}
