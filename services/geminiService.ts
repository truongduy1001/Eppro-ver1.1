
import { GoogleGenAI, Type } from "@google/genai";
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from '../types';
import { readFileContent, extractPdfPagesAsImages } from '../utils/fileReader';

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
    console.error("JSON Parse Error. Raw text:", text);
    throw new Error("Dữ liệu AI trả về không đúng định dạng JSON.");
  }
};

export const performAdvancedOcr = async (file: File, lang: 'vi' | 'en' = 'vi'): Promise<OcrResult> => {
  const ai = createAiClient();
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const outputLang = lang === 'vi' ? 'Tiếng Việt' : 'English';
  
  let parts: any[] = [];
  
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
      parts = [{ inlineData: { data: base64, mimeType: 'image/jpeg' } }];
  }

  const promptText = `Bạn là Trợ lý OCR chuyên sâu. Chuyển đổi sang văn bản CHUẨN PHÁP LÝ.
=== PHẦN 1: OCR & TRÍCH XUẤT ===
- Nhận diện đúng dấu tiếng Việt. Giữ nguyên cấu trúc.
=== PHẦN 2: HIỆU CHỈNH AI ===
- Sửa lỗi I/l/1, O/0, d/đ.
=== PHẦN 3: ĐÁNH GIÁ ===
- Đánh dấu [CẦN KIỂM TRA] nếu mờ.
=== NGUYÊN TẮC ===
- Trung thành tuyệt đối nội dung gốc.
- Phản hồi bằng: ${outputLang}.`;

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cleanText: { type: Type.STRING },
          fixedErrors: { type: Type.ARRAY, items: { type: Type.STRING } },
          checkRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
          qualityReport: { type: Type.STRING },
          confidenceLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
        },
        required: ["cleanText", "fixedErrors", "checkRequired", "qualityReport", "confidenceLevel"]
      }
    }
  });

  return safeJsonParse(response.text);
};

export const compareDocuments = async (files: File[], lang: 'vi' | 'en' = 'vi'): Promise<ComparisonResult> => {
  const ai = createAiClient();
  const outputLang = lang === 'vi' ? 'Tiếng Việt' : 'English';
  
  const contents = await Promise.all(files.map(async (f, idx) => {
    const text = await readFileContent(f);
    return `--- TÀI LIỆU ${idx + 1}: ${f.name} ---\n${text}\n`;
  }));

  const allText = contents.join('\n\n');

  const prompt = `Bạn là Trợ lý Pháp lý AI chuyên nghiệp. Hãy thực hiện SO SÁNH CHI TIẾT các tài liệu đã cung cấp.

=== YÊU CẦU SO SÁNH ===
1. Câu chữ (wording)
2. Nội dung (ý nghĩa)
3. Điều khoản pháp lý
4. Mức độ ràng buộc / rủi ro

=== NGUYÊN TẮC BẮT BUỘC ===
- Trung thành tuyệt đối với tài liệu. Không suy đoán ngoài tài liệu.
- Phân tích rủi ro pháp lý tập trung vào: Điều khoản mơ hồ, nội dung bất lợi, nguy cơ tranh chấp, thay đổi ảnh hưởng pháp lý.

=== CẤU TRÚC PHẢN HỒI JSON ===
- summary: I. Tóm tắt nhanh sự khác biệt chính.
- detailedTable: II. Bảng so sánh chi tiết (clause, changeType, description, impact).
- legalRemarks: III. Nhận xét pháp lý (rủi ro, trách nhiệm).
- recommendations: IV. Đề xuất chỉnh sửa / lưu ý quan trọng.

Ngôn ngữ phản hồi: ${outputLang}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      { text: prompt },
      { text: allText }
    ],
    config: { 
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          detailedTable: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                clause: { type: Type.STRING },
                changeType: { type: Type.STRING, enum: ['added', 'removed', 'modified', 'unchanged'] },
                description: { type: Type.STRING },
                impact: { type: Type.STRING }
              },
              required: ["clause", "changeType", "description", "impact"]
            }
          },
          legalRemarks: { type: Type.STRING },
          recommendations: { type: Type.STRING }
        },
        required: ["summary", "detailedTable", "legalRemarks", "recommendations"]
      }
    }
  });

  return { ...safeJsonParse(response.text), sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
};

export const checkVietnameseSpelling = async (file: File, contractName: string, lang: 'vi' | 'en' = 'vi'): Promise<SpellCheckResult> => {
  const text = await readFileContent(file);
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Kiểm tra chính tả văn bản: ${contractName}.\n\nNội dung:\n${text}`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hasErrors: { type: Type.BOOLEAN },
          errors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { incorrectWord: {type: Type.STRING}, correctedWord: {type: Type.STRING}, context: {type: Type.STRING} } } },
          formatErrors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { errorType: {type: Type.STRING}, description: {type: Type.STRING}, recommendation: {type: Type.STRING} } } }
        }
      }
    }
  });
  return safeJsonParse(response.text);
};

export const evaluateContractLegality = async (file: File, contractName: string, lang: 'vi' | 'en' = 'vi'): Promise<LegalEvaluationResult> => {
  const text = await readFileContent(file);
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Phân tích pháp lý: ${contractName}.\n\nNội dung:\n${text}`,
    config: { 
      tools: [{googleSearch: {}}],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          legalScore: { type: Type.NUMBER },
          feedback: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: {type: Type.STRING}, clause: {type: Type.STRING}, comment: {type: Type.STRING}, recommendation: {type: Type.STRING} } } }
        }
      }
    }
  });
  return { 
    ...safeJsonParse(response.text), 
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks 
  };
};

export const getContractDetails = async (contractName: string, lang: 'vi' | 'en' = 'vi'): Promise<ContractDetails> => {
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Quy định pháp luật: ${contractName}`,
    config: { tools: [{googleSearch: {}}] }
  });
  return { 
    details: response.text || "No data", 
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks 
  };
};
