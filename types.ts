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

// Types for Legal Evaluation
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

// Types for Document Comparison
export interface SimilarityMatch {
  textFromFile1: string;
  textFromFile2: string;
}

export interface ComparisonResult {
  similarityScore: number; // Percentage from 0 to 100
  matches: SimilarityMatch[];
}

export interface OcrResult {
  text: string;
  sources?: GroundingChunk[];
}
