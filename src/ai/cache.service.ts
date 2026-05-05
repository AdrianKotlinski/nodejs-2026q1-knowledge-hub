import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class AiCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs =
    parseInt(process.env.AI_CACHE_TTL_SEC ?? '300', 10) * 1000;

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  buildKey(...parts: (string | number | undefined)[]): string {
    return parts.filter(Boolean).join(':');
  }
}
