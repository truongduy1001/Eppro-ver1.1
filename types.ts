
export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  }
}

export interface SpellCheckError {
  incorrectWord: string;
  correctedWord: string;
  context: string;
}

export interface FormatError {
  errorType: string;
  description: string;
  recommendation: string;
}

export interface SpellCheckResult {
  hasErrors: boolean;
  errors: SpellCheckError[];
  formatErrors: FormatError[];
  sources?: GroundingChunk[];
}

export interface ContractType {
  id: string;
  name: string;
  description: string;
}

export interface ContractDetails {
  details: string;
  sources?: GroundingChunk[];
}

export interface LegalFeedbackItem {
  type: 'suggestion' | 'warning' | 'critical';
  clause: string;
  comment: string;
  recommendation: string;
}

export interface LegalEvaluationResult {
  legalScore: number;
  feedback: LegalFeedbackItem[];
  sources?: GroundingChunk[];
}

// Cấu trúc mới cho So sánh chuyên sâu
export interface ComparisonDifference {
  clause: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  text1: string;
  text2: string;
  legalImpact: string;
}

export interface ComparisonResult {
  summary: string;
  similarityScore: number;
  differences: ComparisonDifference[];
  legalRemarks: string;
  formalAssessment: string;
  recommendations: string;
  bestVersion: 'file1' | 'file2' | 'equal';
  sources?: GroundingChunk[];
}

export interface OcrResult {
  text: string;
  sources?: GroundingChunk[];
}
