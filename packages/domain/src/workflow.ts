export interface AnalyzeRepositoryInput {
  taskId: string;
  repositoryUrl: string;
}

export interface AnalysisResult {
  summary: string;
  techStack: string[];
  patterns: string[];
  structure: string;
  recommendations: string[];
}
