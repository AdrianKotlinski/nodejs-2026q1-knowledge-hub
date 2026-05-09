import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ConversationService {
  private readonly store = new Map<string, Message[]>();
  private readonly maxMessages = parseInt(
    process.env.RAG_CONVERSATION_MAX_MESSAGES ?? '20',
    10,
  );

  ensureConversationId(id?: string): string {
    return id ?? randomUUID();
  }

  addMessage(conversationId: string, role: 'user' | 'assistant', content: string): void {
    const history = this.store.get(conversationId) ?? [];
    history.push({ role, content });
    if (history.length > this.maxMessages) {
      history.splice(0, history.length - this.maxMessages);
    }
    this.store.set(conversationId, history);
  }

  getHistory(conversationId: string): Message[] {
    return this.store.get(conversationId) ?? [];
  }
}
