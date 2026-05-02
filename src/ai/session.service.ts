import { Injectable } from '@nestjs/common';

export interface ConversationTurn {
  role: 'user' | 'model';
  text: string;
}

@Injectable()
export class AiSessionService {
  private readonly sessions = new Map<string, ConversationTurn[]>();
  private readonly maxTurns = 10;
  private readonly sessionTtlMs = 30 * 60 * 1000;
  private readonly sessionExpiry = new Map<string, number>();

  getHistory(sessionId: string): ConversationTurn[] {
    this.evictIfExpired(sessionId);
    return this.sessions.get(sessionId) ?? [];
  }

  addTurn(sessionId: string, role: 'user' | 'model', text: string): void {
    this.evictIfExpired(sessionId);
    const history = this.sessions.get(sessionId) ?? [];
    history.push({ role, text });
    if (history.length > this.maxTurns * 2) {
      history.splice(0, 2);
    }
    this.sessions.set(sessionId, history);
    this.sessionExpiry.set(sessionId, Date.now() + this.sessionTtlMs);
  }

  private evictIfExpired(sessionId: string): void {
    const expiry = this.sessionExpiry.get(sessionId);
    if (expiry && Date.now() > expiry) {
      this.sessions.delete(sessionId);
      this.sessionExpiry.delete(sessionId);
    }
  }

  buildContextualPrompt(history: ConversationTurn[], newPrompt: string): string {
    const contextLines = history.map(
      (t) => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.text}`,
    );
    return [...contextLines, `User: ${newPrompt}`].join('\n');
  }
}
