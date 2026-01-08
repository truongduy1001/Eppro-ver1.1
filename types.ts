
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

export interface ComparisonDifference {
  clause: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  description: string;
  impact: string;
}

export interface ComparisonResult {
  summary: string;             // I. Tóm tắt nhanh sự khác biệt chính
  detailedTable: ComparisonDifference[]; // II. Bảng so sánh chi tiết
  legalRemarks: string;        // III. Nhận xét pháp lý
  recommendations: string;     // IV. Đề xuất chỉnh sửa / lưu ý quan trọng
  sources?: GroundingChunk[];
}

export interface OcrResult {
  cleanText: string;
  fixedErrors: string[];
  checkRequired: string[];
  qualityReport: string;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  sources?: GroundingChunk[];
}
