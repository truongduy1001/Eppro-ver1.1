
// This file contains the logic to read and extract text from various file types
// entirely on the client-side (in the browser).

// Declare global variables that are loaded from CDN scripts in index.html
declare const mammoth: any;
declare const pdfjsLib: any;
declare const Tesseract: any;

/**
 * Reads the content of a File object and returns it as a string.
 * Supports .docx, .pdf (with OCR fallback for scanned documents), and image files.
 */
export const readFileContent = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    // 1. Xử lý File Word (.docx)
    if (fileExt === 'docx') {
        if (typeof mammoth === 'undefined') {
            throw new Error("Thư viện Mammoth chưa được tải. Vui lòng kiểm tra kết nối mạng.");
        }
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } 
    
    // 2. Xử lý File PDF
    if (fileExt === 'pdf') {
        const pdfLib = (window as any).pdfjsLib || pdfjsLib;
        if (!pdfLib) {
            throw new Error("Thư viện PDF.js chưa sẵn sàng. Vui lòng tải lại trang.");
        }

        pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        try {
            const loadingTask = pdfLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdfDoc = await loadingTask.promise;
            let fullText = '';
            let isScanned = false;
            
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                
                if (pageText.trim().length < 10) {
                    // Nếu trang không có text, render sang canvas để OCR
                    console.log(`Trang ${i} có vẻ là ảnh scan, đang xử lý OCR...`);
                    const viewport = page.getViewport({ scale: 2.0 }); // Tăng scale để OCR chính xác hơn
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context!, viewport }).promise;
                    const imageData = canvas.toDataURL('image/png');
                    const ocrText = await performOCR(imageData);
                    fullText += ocrText + '\n';
                    isScanned = true;
                } else {
                    fullText += pageText + '\n';
                }
            }

            return fullText.trim();
        } catch (err) {
            console.error('Lỗi khi đọc PDF:', err);
            throw new Error("Không thể đọc tệp PDF. Tệp có thể bị hỏng hoặc bảo mật.");
        }
    } 
    
    // 3. Xử lý Ảnh (OCR trực tiếp)
    if (['png', 'jpg', 'jpeg', 'bmp', 'webp'].includes(fileExt || '')) {
        const base64 = await fileToBase64(file);
        return await performOCR(base64);
    }

    throw new Error(`Định dạng tệp .${fileExt} không được hỗ trợ.`);
};

/**
 * Chuyển đổi File sang Base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

/**
 * Hàm hỗ trợ chạy OCR bằng Tesseract.js
 * Chấp nhận: File, Blob, Base64 String, Canvas
 */
const performOCR = async (imageSource: any): Promise<string> => {
    if (typeof Tesseract === 'undefined') {
        throw new Error("Thư viện OCR chưa được tải. Vui lòng kiểm tra kết nối mạng.");
    }
    try {
        const { data: { text } } = await Tesseract.recognize(imageSource, 'vie', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    console.log('OCR Progress:', Math.round(m.progress * 100) + '%');
                }
            }
        });
        return text;
    } catch (err) {
        console.error('OCR Error:', err);
        throw new Error("Lỗi khi nhận diện hình ảnh (OCR). Vui lòng thử lại với ảnh rõ nét hơn.");
    }
};
