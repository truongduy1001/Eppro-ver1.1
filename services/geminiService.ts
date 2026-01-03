import { GoogleGenAI } from "@google/genai";
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from '../types';
import { readFileContent } from '../utils/fileReader';

/**
 * Khởi tạo AI client.
 * Hệ thống sẽ tự động cung cấp process.env.API_KEY.
 */
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const safeJsonParse = (text: string | undefined) => {
  if (!text) throw new Error("AI không trả về dữ liệu.");
  let clean = text.trim();
  const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) clean = match[1].trim();
  
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Lỗi Parse JSON:", clean);
    throw new Error("Phản hồi từ AI không đúng định dạng JSON hợp lệ.");
  }
};

export const checkVietnameseSpelling = async (file: File, contractName: string): Promise<SpellCheckResult> => {
  const text = await readFileContent(file);
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Bạn là trợ lý pháp lý. Kiểm tra chính tả và thể thức cho: ${contractName}.\n\nNội dung:\n${text}`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text);
};

export const evaluateContractLegality = async (file: File, contractName: string): Promise<LegalEvaluationResult> => {
  const text = await readFileContent(file);
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Phân tích rủi ro pháp lý cho hợp đồng: ${contractName}.\n\nNội dung:\n${text}`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text);
};

export const getContractDetails = async (contractName: string): Promise<ContractDetails> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Cung cấp chi tiết quy định và mẫu phụ lục cho: ${contractName}`
  });
  return { details: response.text || "Không có dữ liệu." };
};

export const compareDocuments = async (file1: File, file2: File): Promise<ComparisonResult> => {
  const text1 = await readFileContent(file1);
  const text2 = await readFileContent(file2);
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `So sánh hai văn bản sau:\nVăn bản 1: ${text1}\nVăn bản 2: ${text2}`,
    config: { responseMimeType: "application/json" }
  });
  return safeJsonParse(response.text);
};

export const performOcr = async (file: File): Promise<OcrResult> => {
  const text = await readFileContent(file);
  return { text };
};