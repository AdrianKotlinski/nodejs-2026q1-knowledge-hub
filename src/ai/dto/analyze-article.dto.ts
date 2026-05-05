import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum AnalysisTask {
  REVIEW = 'review',
  BUGS = 'bugs',
  OPTIMIZE = 'optimize',
  EXPLAIN = 'explain',
}

export class AnalyzeArticleDto {
  @ApiPropertyOptional({ enum: AnalysisTask, default: AnalysisTask.REVIEW })
  @IsOptional()
  @IsEnum(AnalysisTask)
  task?: AnalysisTask = AnalysisTask.REVIEW;
}
