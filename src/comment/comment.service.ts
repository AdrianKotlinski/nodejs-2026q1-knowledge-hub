import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { db, Comment } from '../db/in-memory.store';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  findByArticle(articleId: string): Comment[] {
    return Array.from(db.comments.values()).filter(
      (c) => c.articleId === articleId,
    );
  }

  findOne(id: string): Comment {
    const comment = db.comments.get(id);
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  create(dto: CreateCommentDto): Comment {
    const articleExists = db.articles.has(dto.articleId);
    if (!articleExists) {
      throw new UnprocessableEntityException('Article not found');
    }

    const comment: Comment = {
      id: crypto.randomUUID(),
      content: dto.content,
      articleId: dto.articleId,
      authorId: dto.authorId ?? null,
      createdAt: Date.now(),
    };
    db.comments.set(comment.id, comment);
    return comment;
  }

  remove(id: string): void {
    const comment = db.comments.get(id);
    if (!comment) throw new NotFoundException('Comment not found');
    db.comments.delete(id);
  }
}
