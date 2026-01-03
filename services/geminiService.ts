
import { GoogleGenAI, Type } from "@google/genai";
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from '../types';
import { readFileContent } from '../utils/fileReader';

const createAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY chưa được cấu hình. Hãy kiểm tra lại Settings trong Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

const safeJsonParse = (text: string | undefined) => {
  if (!text) throw new Error("Không nhận được phản hồi từ AI.");
  
  // Xử lý loại bỏ các ký tự lạ, khoảng trắng và markdown code blocks
  let clean = text.trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/); // Tìm cặp ngoặc nhọn đầu tiên và cuối cùng
  if (jsonMatch) {
    clean = jsonMatch[0];
  }

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Lỗi parse JSON:", clean);
    throw new Error("Dữ liệu AI trả về không đúng định dạng. Vui lòng thử lại lần nữa.");
  }
};

export const checkVietnameseSpelling = async (file: File, contractName: string): Promise<SpellCheckResult> => {
  const text = await readFileContent(file);
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Kiểm tra chính tả văn bản: ${contractName}.\n\nNội dung:\n${text}`,
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
        },
        required: ["hasErrors"]
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
    model: 'gemini-3-flash-preview',
    contents: `Bạn là Luật sư cao cấp. Phân tích rủi ro pháp lý cho loại: ${contractName}.\n\nNội dung văn bản:\n${text}`,
    config: { 
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          legalScore: { type: Type.NUMBER, description: "Điểm từ 0-100" },
          feedback: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "Chỉ chọn: critical, warning, suggestion" },
                clause: { type: Type.STRING },
                comment: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ["type", "comment"]
            }
          }
        },
        required: ["legalScore", "feedback"]
      }
    }
  });
  
  const result = safeJsonParse(response.text);
  return {
    legalScore: result.legalScore ?? 0,
    feedback: Array.isArray(result.feedback) ? result.feedback : [],
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const getContractDetails = async (contractName: string): Promise<ContractDetails> => {
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tóm tắt quy định pháp luật về: ${contractName}.`,
    config: { tools: [{googleSearch: {}}] }
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
    contents: `So sánh văn bản 1 và 2.\n\n1: ${text1}\n\n2: ${text2}`,
    config: { 
      responseMimeType: "application/json"
    }
  });
  return safeJsonParse(response.text);
};

export const performOcr = async (file: File): Promise<OcrResult> => {
  const text = await readFileContent(file);
  return { text };
};
