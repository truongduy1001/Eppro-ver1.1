
// This file contains the logic to read and extract text from various file types
// entirely on the client-side (in the browser).

declare const mammoth: any;
declare const pdfjsLib: any;
declare const Tesseract: any;

/**
 * Trích xuất các trang của PDF thành mảng các Base64 Images để gửi cho AI
 */
export const extractPdfPagesAsImages = async (file: File): Promise<string[]> => {
    const pdfLib = (window as any).pdfjsLib || pdfjsLib;
    if (!pdfLib) throw new Error("PDF.js not loaded");
    
    pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    const images: string[] = [];
    
    // Giới hạn OCR 10 trang đầu để tránh quá tải (có thể tăng thêm tùy nhu cầu)
    const pageLimit = Math.min(pdfDoc.numPages, 10);
    
    for (let i = 1; i <= pageLimit; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 cho độ nét cao
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport }).promise;
        const imageData = canvas.toDataURL('image/jpeg', 0.85); // Dùng JPEG để tối ưu dung lượng gửi AI
        images.push(imageData.split(',')[1]); // Lấy phần data base64 thô
    }
    
    return images;
};

export const readFileContent = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'docx') {
        if (typeof mammoth === 'undefined') throw new Error("Mammoth not loaded");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } 
    
    if (fileExt === 'pdf') {
        const pdfLib = (window as any).pdfjsLib || pdfjsLib;
        if (!pdfLib) throw new Error("PDF.js not loaded");

        pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        try {
            const loadingTask = pdfLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdfDoc = await loadingTask.promise;
            let fullText = '';
            
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                
                if (pageText.trim().length < 10) {
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: context!, viewport }).promise;
                    const ocrText = await performOCR(canvas.toDataURL('image/png'));
                    fullText += ocrText + '\n';
                } else {
                    fullText += pageText + '\n';
                }
            }
            return fullText.trim();
        } catch (err) {
            throw new Error("Không thể đọc tệp PDF.");
        }
    } 
    
    if (['png', 'jpg', 'jpeg', 'bmp', 'webp'].includes(fileExt || '')) {
        const base64 = await fileToBase64(file);
        return await performOCR(base64);
    }

    throw new Error(`Định dạng tệp .${fileExt} không được hỗ trợ.`);
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const performOCR = async (imageSource: any): Promise<string> => {
    if (typeof Tesseract === 'undefined') throw new Error("OCR not loaded");
    const { data: { text } } = await Tesseract.recognize(imageSource, 'vie');
    return text;
};
