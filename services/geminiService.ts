import { GoogleGenAI, Type } from "@google/genai";
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from '../types';
import { readFileContent } from '../utils/fileReader';

const createAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY chưa được cấu hình trên hệ thống Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

const safeJsonParse = (text: string | undefined) => {
  if (!text) throw new Error("AI không phản hồi dữ liệu.");
  let clean = text.trim();
  // Loại bỏ markdown code blocks nếu có
  const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) clean = match[1].trim();
  
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Error. Original text:", text);
    throw new Error("Lỗi định dạng dữ liệu từ AI. Vui lòng thử lại.");
  }
};

export const checkVietnameseSpelling = async (file: File, contractName: string): Promise<SpellCheckResult> => {
  const text = await readFileContent(file);
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Bạn là trợ lý pháp lý Việt Nam. Kiểm tra chính tả và thể thức văn bản cho: ${contractName}.\n\nNội dung:\n${text}`,
    config: { 
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hasErrors: { type: Type.BOOLEAN },
          errors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                incorrectWord: { type: Type.STRING },
                correctedWord: { type: Type.STRING },
                context: { type: Type.STRING }
              }
            }
          },
          formatErrors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                errorType: { type: Type.STRING },
                description: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  
  const result = safeJsonParse(response.text);
  return {
    ...result,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const evaluateContractLegality = async (file: File, contractName: string): Promise<LegalEvaluationResult> => {
  const text = await readFileContent(file);
  const ai = createAiClient();
  // Sử dụng Flash cho nhanh và ổn định hơn Pro trong môi trường web
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Bạn là luật sư chuyên gia cấp cao tại Việt Nam. Phân tích rủi ro pháp lý cho: ${contractName}. 
    CHỈ ĐƯỢC PHÉP TRẢ VỀ loại lỗi là: 'suggestion', 'warning', hoặc 'critical'.\n\nNội dung văn bản:\n${text}`,
    config: { 
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          legalScore: { type: Type.NUMBER },
          feedback: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { 
                  type: Type.STRING, 
                  description: "Chỉ được dùng: suggestion, warning, critical" 
                },
                clause: { type: Type.STRING },
                comment: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  
  const result = safeJsonParse(response.text);
  return {
    ...result,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const getContractDetails = async (contractName: string): Promise<ContractDetails> => {
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Cung cấp chi tiết các quy định pháp luật hiện hành và các điều khoản mẫu bắt buộc cho: ${contractName}.`,
    config: {
      tools: [{googleSearch: {}}]
    }
  });
  return { 
    details: response.text || "Không có dữ liệu.",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const compareDocuments = async (file1: File, file2: File): Promise<ComparisonResult> => {
  const text1 = await readFileContent(file1);
  const text2 = await readFileContent(file2);
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `So sánh hai văn bản sau:\n\nVăn bản 1: ${text1}\n\nVăn bản 2: ${text2}`,
    config: { 
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text);
};

export const performOcr = async (file: File): Promise<OcrResult> => {
  const text = await readFileContent(file);
  return { text };
};