// This file contains the logic to read and extract text from various file types
// entirely on the client-side (in the browser).

// Declare global variables that are loaded from CDN scripts in index.html
declare const mammoth: any;
declare const pdfjsLib: any;
declare const Tesseract: any;

/**
 * Reads the content of a File object and returns it as a string.
 * Supports .docx, .pdf (with OCR fallback for scanned documents), and image files.
 * @param file The File object to read.
 * @returns A promise that resolves with the text content of the file.
 */
export const readFileContent = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } 
    
    if (fileExt === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            // The item.str is the text content
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
        }

        // Heuristic: If PDF text extraction yields little content, it's likely a scanned/image-based PDF.
        // In that case, fall back to using OCR to get the text.
        if (fullText && fullText.trim().length > 200) {
            return fullText.trim();
        } else {
            console.warn('PDF text content is sparse or empty, falling back to OCR. This may take a moment.');
            const { data: { text } } = await Tesseract.recognize(file, 'vie', {
                logger: m => console.log(m) // Optional: log OCR progress
            });
            return text;
        }
    } 
    
    if (['png', 'jpg', 'jpeg', 'bmp', 'webp'].includes(fileExt || '')) {
        // Handle standard image files for the OCR tab.
        const { data: { text } } = await Tesseract.recognize(file, 'vie', {
            logger: m => console.log(m)
        });
        return text;
    }

    throw new Error(`Định dạng tệp .${fileExt} không được hỗ trợ.`);
};
