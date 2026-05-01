import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { NotFoundError, ForbiddenError } from '../common/errors';
import { UserRole } from '../common/enums';
import { Comment } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

const toResponse = (comment: Comment) => ({
  id: comment.id,
  content: comment.content,
  articleId: comment.articleId,
  authorId: comment.authorId,
  createdAt: comment.createdAt.getTime(),
});

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async findByArticle(articleId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { articleId },
    });
    return comments.map(toResponse);
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundError('Comment not found');
    return toResponse(comment);
  }

  async create(dto: CreateCommentDto) {
    const articleExists = await this.prisma.article.findUnique({
      where: { id: dto.articleId },
    });
    if (!articleExists) {
      throw new UnprocessableEntityException('Article not found');
    }
    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        articleId: dto.articleId,
        authorId: dto.authorId ?? null,
      },
    });
    return toResponse(comment);
  }

  async remove(id: string, currentUser?: { userId: string; role: UserRole }) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundError('Comment not found');
    if (
      currentUser?.role === UserRole.EDITOR &&
      comment.authorId !== currentUser.userId
    ) {
      throw new ForbiddenError('Not authorized to delete this comment');
    }
    await this.prisma.comment.delete({ where: { id } });
  }
}
