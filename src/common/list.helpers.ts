export interface PaginatedResult<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

export function sortItems<T>(items: T[], sortBy?: string, order?: string): T[] {
  if (!sortBy) return items;
  const dir = order === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortBy];
    const bv = (b as Record<string, unknown>)[sortBy];
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

export function paginate<T>(
  items: T[],
  page?: number,
  limit?: number,
): T[] | PaginatedResult<T> {
  if (page === undefined || limit === undefined) return items;
  const start = (page - 1) * limit;
  return {
    total: items.length,
    page,
    limit,
    data: items.slice(start, start + limit),
  };
}
