import { request } from './lib';
import { StatusCodes } from 'http-status-codes';
import { articlesRoutes } from './endpoints';

const makeArticle = (title: string) => ({
  title,
  content: 'Test content',
  status: 'draft',
  authorId: null,
  categoryId: null,
  tags: [],
});

describe('Pagination & Sorting (e2e)', () => {
  const commonHeaders = { Accept: 'application/json' };
  const createdIds: string[] = [];

  const createArticle = async (title: string): Promise<string> => {
    const res = await request
      .post(articlesRoutes.create)
      .set(commonHeaders)
      .send(makeArticle(title));
    expect(res.status).toBe(StatusCodes.CREATED);
    createdIds.push(res.body.id);
    return res.body.id;
  };

  afterAll(async () => {
    for (const id of createdIds) {
      await request.delete(articlesRoutes.delete(id)).set(commonHeaders);
    }
  });

  describe('Pagination', () => {
    it('should return a paginated response shape when page and limit are provided', async () => {
      await createArticle('PAG_A');
      await createArticle('PAG_B');
      await createArticle('PAG_C');

      const res = await request
        .get(`${articlesRoutes.getAll}?page=1&limit=2`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toMatchObject({
        page: 1,
        limit: 2,
        total: expect.any(Number),
        data: expect.any(Array),
      });
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.total).toBeGreaterThanOrEqual(3);
    });

    it('should return a plain array when page and limit are absent', async () => {
      const res = await request.get(articlesRoutes.getAll).set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('should return correct slice on page 2', async () => {
      const page1 = await request
        .get(`${articlesRoutes.getAll}?page=1&limit=2`)
        .set(commonHeaders);

      const page2 = await request
        .get(`${articlesRoutes.getAll}?page=2&limit=2`)
        .set(commonHeaders);

      expect(page1.status).toBe(StatusCodes.OK);
      expect(page2.status).toBe(StatusCodes.OK);

      const ids1: string[] = page1.body.data.map((a) => a.id);
      const ids2: string[] = page2.body.data.map((a) => a.id);

      const overlap = ids1.filter((id) => ids2.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Sorting', () => {
    it('should sort articles by title ascending', async () => {
      await createArticle('SORT_C');
      await createArticle('SORT_A');
      await createArticle('SORT_B');

      const res = await request
        .get(`${articlesRoutes.getAll}?sortBy=title&order=asc`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      const titles: string[] = res.body
        .filter((a) => a.title.startsWith('SORT_'))
        .map((a) => a.title);

      expect(titles).toEqual([...titles].sort());
    });

    it('should sort articles by title descending', async () => {
      const res = await request
        .get(`${articlesRoutes.getAll}?sortBy=title&order=desc`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      const titles: string[] = res.body
        .filter((a) => a.title.startsWith('SORT_'))
        .map((a) => a.title);

      expect(titles).toEqual([...titles].sort().reverse());
    });
  });
});
