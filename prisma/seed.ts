import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

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
    where: { id: 'cat00000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'cat00000-0000-0000-0000-000000000001',
      name: 'TypeScript',
      description: 'TypeScript language articles',
    },
  });

  const catNode = await prisma.category.upsert({
    where: { id: 'cat00000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'cat00000-0000-0000-0000-000000000002',
      name: 'Node.js',
      description: 'Node.js runtime articles',
    },
  });

  const catNest = await prisma.category.upsert({
    where: { id: 'cat00000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: 'cat00000-0000-0000-0000-000000000003',
      name: 'NestJS',
      description: 'NestJS framework articles',
    },
  });

  // ── Tags ───────────────────────────────────────────────────────────────────
  for (const name of ['typescript', 'nodejs', 'nestjs', 'backend', 'api']) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }

  // ── Articles ───────────────────────────────────────────────────────────────
  await prisma.article.upsert({
    where: { id: 'art00000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'art00000-0000-0000-0000-000000000001',
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

  await prisma.article.upsert({
    where: { id: 'art00000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'art00000-0000-0000-0000-000000000002',
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
    where: { id: 'art00000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: 'art00000-0000-0000-0000-000000000003',
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
    where: { id: 'art00000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: 'art00000-0000-0000-0000-000000000004',
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
    where: { id: 'art00000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: 'art00000-0000-0000-0000-000000000005',
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
    where: { id: 'cmt00000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'cmt00000-0000-0000-0000-000000000001',
      content: 'Great introduction to NestJS!',
      articleId: 'art00000-0000-0000-0000-000000000001',
      authorId: editor.id,
    },
  });

  await prisma.comment.upsert({
    where: { id: 'cmt00000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'cmt00000-0000-0000-0000-000000000002',
      content: 'Would love to see more examples with real projects.',
      articleId: 'art00000-0000-0000-0000-000000000001',
      authorId: null,
    },
  });

  await prisma.comment.upsert({
    where: { id: 'cmt00000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: 'cmt00000-0000-0000-0000-000000000003',
      content: 'This helped me understand generics much better.',
      articleId: 'art00000-0000-0000-0000-000000000002',
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
