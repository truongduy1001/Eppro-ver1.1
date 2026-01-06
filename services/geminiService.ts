
import { GoogleGenAI, Type } from "@google/genai";
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from '../types';
import { readFileContent, extractPdfPagesAsImages } from '../utils/fileReader';

// Fix: Always use new GoogleGenAI({ apiKey: process.env.API_KEY }) directly as per guidelines.
const createAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const safeJsonParse = (text: string | undefined) => {
  if (!text) throw new Error("Không nhận được phản hồi từ AI.");
  let clean = text.trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (jsonMatch) clean = jsonMatch[0];
  try {
    return JSON.parse(clean);
  } catch (e) {
    throw new Error("Dữ liệu AI trả về không đúng định dạng.");
  }
};

/**
 * OCR Chuyên sâu Ver 1.2 - Prompt 4 Giai đoạn (Nâng cấp)
 */
export const performAdvancedOcr = async (file: File, lang: 'vi' | 'en' = 'vi'): Promise<OcrResult> => {
  const ai = createAiClient();
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const outputLang = lang === 'vi' ? 'Tiếng Việt' : 'English';
  
  let parts: any[] = [];
  
  // Giai đoạn chuẩn bị dữ liệu hình ảnh
  if (fileExt === 'pdf') {
      const pageImages = await extractPdfPagesAsImages(file);
      parts = pageImages.map(base64 => ({
          inlineData: { data: base64, mimeType: 'image/jpeg' }
      }));
  } else {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
      });
      parts = [{ inlineData: { data: base64, mimeType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}` } }];
  }

  // Thêm Prompt yêu cầu hệ thống chuyên sâu
  const promptText = `Bạn là Trợ lý OCR & Phân tích Ngôn ngữ Tiếng Việt chuyên sâu. Nhiệm vụ của bạn là chuyển đổi hình ảnh/PDF sang văn bản CHUẨN PHÁP LÝ/HÀNH CHÍNH.

=== PHẦN 1: OCR & TRÍCH XUẤT ===
- Tự động phát hiện ngôn ngữ chính: Tiếng Việt.
- Nhận diện đúng dấu tiếng Việt, chữ hoa/thường, số, ký hiệu.
- GIỮ NGUYÊN CẤU TRÚC GỐC: Tiêu đề, Mục/Điều/Khoản, bảng biểu (chuyển thành văn bản có cấu trúc).
- Xuống dòng đúng logic văn bản hành chính.

=== PHẦN 2: HIỆU CHỈNH AI ===
- Tự động sửa lỗi OCR (I/l/1, O/0, d/đ, dính từ).
- Chuẩn hóa văn phong trang trọng.
- TUYỆT ĐỐI KHÔNG: Tự ý thêm nội dung, diễn giải lại, làm thay đổi ý nghĩa pháp lý.

=== PHẦN 3: PHÂN TÍCH & ĐÁNH GIÁ ===
- Đánh giá độ chính xác. Đánh dấu các đoạn có độ tin cậy thấp bằng [CẦN KIỂM TRA].
- Phát hiện câu văn mơ hồ, thiếu chủ vị.
- Gợi ý cải thiện cách trình bày chuẩn A4 (chỉ đề xuất, không tự sửa nội dung).

=== NGUYÊN TẮC BẮT BUỘC ===
- Trung thành tuyệt đối với nội dung gốc.
- Ưu tiên độ chính xác hơn độ trôi chảy.
- Phản hồi bằng ngôn ngữ: ${outputLang}.

Hãy trả về kết quả dưới dạng JSON theo schema:`;

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cleanText: { type: Type.STRING, description: "Văn bản đã hiệu chỉnh, sẵn sàng xuất file Word" },
          fixedErrors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách lỗi OCR đã sửa" },
          checkRequired: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Các đoạn cần kiểm tra lại" },
          qualityReport: { type: Type.STRING, description: "Nhận xét tổng thể chất lượng và gợi ý" },
          confidenceLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
        },
        required: ["cleanText", "fixedErrors", "checkRequired", "qualityReport", "confidenceLevel"]
      }
    }
  });

  return safeJsonParse(response.text);
};

export const checkVietnameseSpelling = async (file: File, contractName: string, lang: 'vi' | 'en' = 'vi'): Promise<SpellCheckResult> => {
  const text = await readFileContent(file);
  const ai = createAiClient();
  const outputLang = lang === 'vi' ? 'Tiếng Việt' : 'English';
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Bạn là Trợ lý Pháp lý chuyên nghiệp. Hãy kiểm tra chính tả cho văn bản: ${contractName}. Ngôn ngữ phản hồi: ${outputLang}.\n\nNội dung:\n${text}`,
    config: { 
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

export const evaluateContractLegality = async (file: File, contractName: string, lang: 'vi' | 'en' = 'vi'): Promise<LegalEvaluationResult> => {
  const text = await readFileContent(file);
  const ai = createAiClient();
  const outputLang = lang === 'vi' ? 'Tiếng Việt' : 'English';
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Bạn là Luật sư cao cấp. Phân tích rủi ro pháp lý cho: ${contractName}. Ngôn ngữ: ${outputLang}.\n\nNội dung:\n${text}`,
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

export const compareDocuments = async (file1: File, file2: File, lang: 'vi' | 'en' = 'vi'): Promise<ComparisonResult> => {
  const text1 = await readFileContent(file1);
  const text2 = await readFileContent(file2);
  const ai = createAiClient();
  const outputLang = lang === 'vi' ? 'Tiếng Việt' : 'English';
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `So sánh chi tiết 2 văn bản sau để chọn bản an toàn hơn. Ngôn ngữ: ${outputLang}.\n\nVăn bản 1:\n${text1}\n\nVăn bản 2:\n${text2}`,
    config: { 
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          similarityScore: { type: Type.NUMBER },
          differences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                clause: { type: Type.STRING },
                changeType: { type: Type.STRING },
                text1: { type: Type.STRING },
                text2: { type: Type.STRING },
                legalImpact: { type: Type.STRING }
              }
            }
          },
          legalRemarks: { type: Type.STRING },
          formalAssessment: { type: Type.STRING },
          recommendations: { type: Type.STRING },
          bestVersion: { type: Type.STRING }
        },
        required: ["summary", "similarityScore", "differences", "bestVersion"]
      }
    }
  });
  return { ...safeJsonParse(response.text), sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
};

export const getContractDetails = async (contractName: string, lang: 'vi' | 'en' = 'vi'): Promise<ContractDetails> => {
  const ai = createAiClient();
  const outputLang = lang === 'vi' ? 'Tiếng Việt' : 'English';
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Cung cấp quy định pháp luật cho: ${contractName}. Ngôn ngữ: ${outputLang}.`,
    config: { tools: [{googleSearch: {}}] }
  });
  return { details: response.text || "Không có dữ liệu.", sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
};
