import { GoogleGenAI, Type } from "@google/genai";
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from '../types';
import { readFileContent } from '../utils/fileReader';

/**
 * Khởi tạo AI Client.
 * API Key được lấy trực tiếp từ process.env.API_KEY được nền tảng chèn tự động.
 */
const createAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "__API_KEY__" || apiKey === "undefined") {
    throw new Error("API Key chưa được thiết lập. Vui lòng sử dụng nút 'Chọn API Key' phía trên.");
  }
  // Khởi tạo instance mới mỗi lần gọi để đảm bảo sử dụng key vừa được chọn
  return new GoogleGenAI({ apiKey });
};

const safeJsonParse = (text: string | undefined) => {
  if (!text) throw new Error("AI không phản hồi dữ liệu.");
  let clean = text.trim();
  const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) clean = match[1].trim();
  
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Lỗi Parse JSON:", clean);
    throw new Error("Dữ liệu phản hồi từ AI không đúng định dạng JSON.");
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Bạn là luật sư chuyên gia. Phân tích rủi ro pháp lý và lỗ hổng hợp đồng cho: ${contractName} dựa trên Bộ luật Dân sự 2015 và các văn bản luật liên quan mới nhất. Đưa ra khuyến nghị chi tiết.\n\nNội dung:\n${text}`,
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
                type: { type: Type.STRING },
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
    contents: `Cung cấp chi tiết các quy định pháp luật hiện hành và các điều khoản mẫu bắt buộc cho: ${contractName}. Đảm bảo các thông tin cập nhật đến năm 2024-2025.`,
    config: {
      tools: [{googleSearch: {}}]
    }
  });
  return { 
    details: response.text || "Không có dữ liệu chi tiết.",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const compareDocuments = async (file1: File, file2: File): Promise<ComparisonResult> => {
  const text1 = await readFileContent(file1);
  const text2 = await readFileContent(file2);
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `So sánh hai văn bản sau để tìm điểm tương đồng và khác biệt chính về nội dung pháp lý:\n\nVăn bản 1: ${text1}\n\nVăn bản 2: ${text2}`,
    config: { 
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          similarityScore: { type: Type.NUMBER },
          matches: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                textFromFile1: { type: Type.STRING },
                textFromFile2: { type: Type.STRING }
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

export const performOcr = async (file: File): Promise<OcrResult> => {
  const text = await readFileContent(file);
  return { text };
};