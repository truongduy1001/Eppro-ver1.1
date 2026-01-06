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
  let clean = text.trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (jsonMatch) clean = jsonMatch[0];
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Lỗi parse JSON:", clean);
    throw new Error("Dữ liệu AI trả về không đúng định dạng. Vui lòng thử lại.");
  }
};

export const checkVietnameseSpelling = async (file: File, contractName: string): Promise<SpellCheckResult> => {
  const text = await readFileContent(file);
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Bạn là Trợ lý Pháp lý chuyên nghiệp. Hãy kiểm tra chính tả, hành văn và tính trang trọng cho văn bản: ${contractName}.\n\nNội dung:\n${text}`,
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
  return { ...safeJsonParse(response.text), sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
};

export const evaluateContractLegality = async (file: File, contractName: string): Promise<LegalEvaluationResult> => {
  const text = await readFileContent(file);
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Bạn là Luật sư cao cấp Việt Nam. Phân tích rủi ro pháp lý cho loại: ${contractName}. 
    Tập trung vào: Điều khoản mơ hồ, nội dung bất lợi, thiếu căn cứ pháp lý.\n\nNội dung văn bản:\n${text}`,
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
  return { legalScore: result.legalScore ?? 0, feedback: result.feedback || [], sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
};

export const compareDocuments = async (file1: File, file2: File): Promise<ComparisonResult> => {
  const text1 = await readFileContent(file1);
  const text2 = await readFileContent(file2);
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Bạn là Luật sư chuyên gia cấp cao. Hãy so sánh chi tiết 2 văn bản dưới đây để CHỌN BẢN AN TOÀN HƠN.
    
    Yêu cầu:
    1. Chỉ ra điểm GIỐNG NHAU.
    2. Chỉ ra điểm KHÁC NHAU (Câu chữ, ý nghĩa pháp lý).
    3. Liệt kê nội dung bị THÊM / BỚT / CHỈNH SỬA theo từng điều khoản.
    4. Phân tích rủi ro: Điều khoản mơ hồ, bất lợi cho một bên.
    5. Kiểm tra tính trang trọng và chuẩn văn bản pháp lý.

    Văn bản 1 (Gốc/Tham chiếu):
    ${text1}
    
    Văn bản 2 (Sửa đổi/Đối ứng):
    ${text2}`,
    config: { 
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "Tóm tắt ngắn gọn sự khác biệt và đánh giá tổng quan" },
          similarityScore: { type: Type.NUMBER, description: "Phần trăm tương đồng thực tế" },
          differences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                clause: { type: Type.STRING },
                changeType: { type: Type.STRING, description: "added, removed, modified, unchanged" },
                text1: { type: Type.STRING },
                text2: { type: Type.STRING },
                legalImpact: { type: Type.STRING, description: "Rủi ro hoặc lợi ích pháp lý của thay đổi này" }
              }
            }
          },
          legalRemarks: { type: Type.STRING, description: "Nhận xét chi tiết về các lỗ hổng và rủi ro (Markdown)" },
          formalAssessment: { type: Type.STRING, description: "Đánh giá lỗi chính tả, hành văn và tính chuẩn mực (Markdown)" },
          recommendations: { type: Type.STRING, description: "Đề xuất cải thiện cụ thể (Markdown)" },
          bestVersion: { type: Type.STRING, description: "file1 hoặc file2 kèm lý do" }
        },
        required: ["summary", "similarityScore", "differences", "bestVersion"]
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
    contents: `Cung cấp quy định pháp luật và điều khoản bắt buộc cho: ${contractName}.`,
    config: { tools: [{googleSearch: {}}] }
  });
  return { details: response.text || "Không có dữ liệu.", sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
};
