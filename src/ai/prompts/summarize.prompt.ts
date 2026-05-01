import { SummaryMaxLength } from '../dto/summarize-article.dto';

const LENGTH_INSTRUCTIONS: Record<SummaryMaxLength, string> = {
  [SummaryMaxLength.SHORT]: 'in 2-3 sentences',
  [SummaryMaxLength.MEDIUM]: 'in 1-2 paragraphs (4-6 sentences)',
  [SummaryMaxLength.DETAILED]: 'in 3-5 paragraphs covering all key points',
};

export function buildSummarizePrompt(
  title: string,
  content: string,
  maxLength: SummaryMaxLength,
): string {
  return `Summarize the following article ${LENGTH_INSTRUCTIONS[maxLength]}.
Return ONLY the summary text, no preamble.

Title: ${title}
Content: ${content}`;
}
