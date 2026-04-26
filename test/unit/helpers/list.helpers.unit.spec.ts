import { describe, it, expect } from 'vitest';
import { sortItems, paginate } from '../../../src/common/list.helpers';

describe('sortItems', () => {
  const items = [
    { id: 1, name: 'Charlie', age: 30 },
    { id: 2, name: 'Alice', age: 25 },
    { id: 3, name: 'Bob', age: 35 },
  ];

  it('returns items unchanged when sortBy is not provided', () => {
    const result = sortItems(items);
    expect(result).toEqual(items);
  });

  it('sorts ascending by default', () => {
    const result = sortItems(items, 'name') as typeof items;
    expect(result.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('sorts ascending when order is "asc"', () => {
    const result = sortItems(items, 'age', 'asc') as typeof items;
    expect(result.map((i) => i.age)).toEqual([25, 30, 35]);
  });

  it('sorts descending when order is "desc"', () => {
    const result = sortItems(items, 'age', 'desc') as typeof items;
    expect(result.map((i) => i.age)).toEqual([35, 30, 25]);
  });

  it('does not mutate the original array', () => {
    const copy = [...items];
    sortItems(items, 'name', 'desc');
    expect(items).toEqual(copy);
  });

  it('handles equal values without error', () => {
    const dupes = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Alice' },
    ];
    const result = sortItems(dupes, 'name');
    expect(result).toHaveLength(2);
  });
});

describe('paginate', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('returns the plain array when page and limit are undefined', () => {
    const result = paginate(items);
    expect(result).toBe(items);
  });

  it('returns the plain array when only page is provided', () => {
    const result = paginate(items, 1, undefined);
    expect(result).toBe(items);
  });

  it('returns the plain array when only limit is provided', () => {
    const result = paginate(items, undefined, 5);
    expect(result).toBe(items);
  });

  it('returns paginated result with total, page, limit, and data', () => {
    const result = paginate(items, 1, 3) as {
      total: number;
      page: number;
      limit: number;
      data: number[];
    };
    expect(result.total).toBe(10);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(3);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('returns the correct slice for the second page', () => {
    const result = paginate(items, 2, 3) as { data: number[] };
    expect(result.data).toEqual([4, 5, 6]);
  });

  it('returns an empty data array when page exceeds total', () => {
    const result = paginate(items, 10, 5) as { data: number[] };
    expect(result.data).toEqual([]);
  });
});
