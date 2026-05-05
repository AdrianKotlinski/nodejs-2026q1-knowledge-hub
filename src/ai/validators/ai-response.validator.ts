export function parseJsonFromText(text: string): unknown | null {
  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
  } catch {
    return null;
  }
}

export interface TranslateResult {
  translatedText: string;
  detectedLanguage: string;
}

export interface AnalyzeResult {
  analysis: string;
  suggestions: string[];
  severity: 'info' | 'warning' | 'error';
}

export function validateTranslateResult(raw: unknown): TranslateResult {
  const obj = raw as Record<string, unknown>;
  return {
    translatedText:
      typeof obj?.translatedText === 'string'
        ? obj.translatedText
        : String(raw),
    detectedLanguage:
      typeof obj?.detectedLanguage === 'string'
        ? obj.detectedLanguage
        : 'unknown',
  };
}

export function validateAnalyzeResult(raw: unknown): AnalyzeResult {
  const obj = raw as Record<string, unknown>;
  const validSeverities = ['info', 'warning', 'error'] as const;
  return {
    analysis:
      typeof obj?.analysis === 'string' ? obj.analysis : 'Analysis unavailable',
    suggestions: Array.isArray(obj?.suggestions)
      ? ((obj.suggestions as unknown[]).filter(
          (s) => typeof s === 'string',
        ) as string[])
      : ['Review the content manually'],
    severity: validSeverities.includes(
      obj?.severity as (typeof validSeverities)[number],
    )
      ? (obj.severity as 'info' | 'warning' | 'error')
      : 'info',
  };
}
