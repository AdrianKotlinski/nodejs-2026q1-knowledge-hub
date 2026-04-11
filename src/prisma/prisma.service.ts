import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly _client: PrismaClient;

  constructor() {
    this._client = new (PrismaClient as any)({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  get user(): PrismaClient['user'] {
    return this._client.user;
  }

  get article(): PrismaClient['article'] {
    return this._client.article;
  }

  get category(): PrismaClient['category'] {
    return this._client.category;
  }

  get comment(): PrismaClient['comment'] {
    return this._client.comment;
  }

  get tag(): PrismaClient['tag'] {
    return this._client.tag;
  }

  async onModuleInit() {
    await (this._client as any).$connect();
  }

  async onModuleDestroy() {
    await (this._client as any).$disconnect();
  }
}
