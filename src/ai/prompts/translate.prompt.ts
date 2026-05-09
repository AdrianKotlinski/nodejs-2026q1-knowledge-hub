export function buildTranslatePrompt(
  content: string,
  targetLanguage: string,
  sourceLanguage?: string,
): string {
  const sourcePart = sourceLanguage ? `from ${sourceLanguage} ` : '';
  return `Translate the following text ${sourcePart}to ${targetLanguage}.
Return a JSON object with two fields:
- "translatedText": the translated text
- "detectedLanguage": the detected source language (ISO 639-1 code, e.g. "en")

Text to translate:
${content}`;
}
