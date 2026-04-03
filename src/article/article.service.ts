import { Injectable, NotFoundException } from '@nestjs/common';
import { db, Article, ArticleStatus } from '../db/in-memory.store';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

const applyFilters = (
  articles: Article[],
  status?: string,
  categoryId?: string,
  tag?: string,
): Article[] => {
  return articles
    .filter((a) => (status ? a.status === status : true))
    .filter((a) => (categoryId ? a.categoryId === categoryId : true))
    .filter((a) => (tag ? a.tags.includes(tag) : true));
};

const definedEntries = (dto: UpdateArticleDto) =>
  Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));

@Injectable()
export class ArticleService {
  findAll(status?: string, categoryId?: string, tag?: string): Article[] {
    return applyFilters(
      Array.from(db.articles.values()),
      status,
      categoryId,
      tag,
    );
  }

  findOne(id: string): Article {
    const article = db.articles.get(id);
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  create(dto: CreateArticleDto): Article {
    const now = Date.now();
    const article: Article = {
      id: crypto.randomUUID(),
      title: dto.title,
      content: dto.content,
      status: dto.status ?? ArticleStatus.DRAFT,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    db.articles.set(article.id, article);
    return article;
  }

  update(id: string, dto: UpdateArticleDto): Article {
    const article = db.articles.get(id);
    if (!article) throw new NotFoundException('Article not found');
    Object.assign(article, definedEntries(dto), { updatedAt: Date.now() });
    return article;
  }

  remove(id: string): void {
    const article = db.articles.get(id);
    if (!article) throw new NotFoundException('Article not found');

    db.comments.forEach((comment, commentId) => {
      if (comment.articleId === id) {
        db.comments.delete(commentId);
      }
    });

    db.articles.delete(id);
  }
}
