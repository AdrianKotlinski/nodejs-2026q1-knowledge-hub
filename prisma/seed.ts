import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { v5 as uuidv5 } from 'uuid';

const SEED_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const id = (name: string) => uuidv5(name, SEED_NAMESPACE);

const prisma = new (PrismaClient as any)({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
}) as PrismaClient;
const SALT_ROUNDS = 10;

async function main() {
  // ── Users ──────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      password: await bcrypt.hash('admin123', SALT_ROUNDS),
      role: 'admin',
    },
  });

  const editor = await prisma.user.upsert({
    where: { login: 'editor' },
    update: {},
    create: {
      login: 'editor',
      password: await bcrypt.hash('editor123', SALT_ROUNDS),
      role: 'editor',
    },
  });

  // ── Categories ─────────────────────────────────────────────────────────────
  const catTS = await prisma.category.upsert({
    where: { id: id('category-typescript') },
    update: {},
    create: {
      id: id('category-typescript'),
      name: 'TypeScript',
      description: 'TypeScript language articles',
    },
  });

  const catNode = await prisma.category.upsert({
    where: { id: id('category-nodejs') },
    update: {},
    create: {
      id: id('category-nodejs'),
      name: 'Node.js',
      description: 'Node.js runtime articles',
    },
  });

  const catNest = await prisma.category.upsert({
    where: { id: id('category-nestjs') },
    update: {},
    create: {
      id: id('category-nestjs'),
      name: 'NestJS',
      description: 'NestJS framework articles',
    },
  });

  // ── Tags ───────────────────────────────────────────────────────────────────
  for (const name of ['typescript', 'nodejs', 'nestjs', 'backend', 'api']) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }

  // ── Articles ───────────────────────────────────────────────────────────────
  const article1Id = id('article-getting-started-nestjs');
  await prisma.article.upsert({
    where: { id: article1Id },
    update: {},
    create: {
      id: article1Id,
      title: 'Getting Started with NestJS',
      content: 'NestJS is a progressive Node.js framework for building efficient server-side applications.',
      status: 'published',
      authorId: admin.id,
      categoryId: catNest.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'nestjs' }, create: { name: 'nestjs' } },
          { where: { name: 'backend' }, create: { name: 'backend' } },
        ],
      },
    },
  });

  const article2Id = id('article-typescript-generics');
  await prisma.article.upsert({
    where: { id: article2Id },
    update: {},
    create: {
      id: article2Id,
      title: 'TypeScript Generics Deep Dive',
      content: 'Generics allow us to create reusable, type-safe components in TypeScript.',
      status: 'published',
      authorId: editor.id,
      categoryId: catTS.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'typescript' }, create: { name: 'typescript' } },
        ],
      },
    },
  });

  await prisma.article.upsert({
    where: { id: id('article-nodejs-event-loop') },
    update: {},
    create: {
      id: id('article-nodejs-event-loop'),
      title: 'Node.js Event Loop Explained',
      content: 'The event loop is what allows Node.js to perform non-blocking I/O operations.',
      status: 'draft',
      authorId: editor.id,
      categoryId: catNode.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'nodejs' }, create: { name: 'nodejs' } },
          { where: { name: 'backend' }, create: { name: 'backend' } },
        ],
      },
    },
  });

  await prisma.article.upsert({
    where: { id: id('article-rest-apis-nestjs') },
    update: {},
    create: {
      id: id('article-rest-apis-nestjs'),
      title: 'Building REST APIs with NestJS',
      content: 'REST APIs are a common way to expose data and business logic to clients.',
      status: 'published',
      authorId: admin.id,
      categoryId: catNest.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'nestjs' }, create: { name: 'nestjs' } },
          { where: { name: 'api' }, create: { name: 'api' } },
        ],
      },
    },
  });

  await prisma.article.upsert({
    where: { id: id('article-nodejs-v18-features') },
    update: {},
    create: {
      id: id('article-nodejs-v18-features'),
      title: 'Node.js v18 Features Overview',
      content: 'Node.js v18 introduced fetch API, test runner, and other improvements.',
      status: 'archived',
      authorId: null,
      categoryId: catNode.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'nodejs' }, create: { name: 'nodejs' } },
        ],
      },
    },
  });

  // ── Comments ───────────────────────────────────────────────────────────────
  await prisma.comment.upsert({
    where: { id: id('comment-great-introduction') },
    update: {},
    create: {
      id: id('comment-great-introduction'),
      content: 'Great introduction to NestJS!',
      articleId: article1Id,
      authorId: editor.id,
    },
  });

  await prisma.comment.upsert({
    where: { id: id('comment-more-examples') },
    update: {},
    create: {
      id: id('comment-more-examples'),
      content: 'Would love to see more examples with real projects.',
      articleId: article1Id,
      authorId: null,
    },
  });

  await prisma.comment.upsert({
    where: { id: id('comment-generics-helped') },
    update: {},
    create: {
      id: id('comment-generics-helped'),
      content: 'This helped me understand generics much better.',
      articleId: article2Id,
      authorId: admin.id,
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
