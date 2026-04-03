import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUUID()
  articleId: string;

  @IsOptional()
  @IsUUID()
  authorId?: string | null;
}
