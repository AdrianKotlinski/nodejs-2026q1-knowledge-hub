import { AnalysisTask } from '../dto/analyze-article.dto';

const TASK_INSTRUCTIONS: Record<AnalysisTask, string> = {
  [AnalysisTask.REVIEW]:
    'Review the following article for quality, clarity, and completeness.',
  [AnalysisTask.BUGS]:
    'Identify any factual errors, inconsistencies, or logical issues in the following article.',
  [AnalysisTask.OPTIMIZE]:
    'Suggest improvements to make the following article more engaging and effective.',
  [AnalysisTask.EXPLAIN]:
    'Explain the main concepts in the following article in simple terms.',
};

export function buildAnalyzePrompt(
  title: string,
  content: string,
  task: AnalysisTask,
): string {
  return `${TASK_INSTRUCTIONS[task]}

Return a JSON object with three fields:
- "analysis": a comprehensive analysis string
- "suggestions": an array of actionable suggestion strings (at least 2)
- "severity": one of "info", "warning", or "error" based on how critical the issues are

Title: ${title}
Content: ${content}`;
}
