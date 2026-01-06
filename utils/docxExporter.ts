
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import FileSaver from "file-saver";

/**
 * Xuất nội dung văn bản sang tệp .docx
 * @param text Nội dung văn bản
 * @param originalFileName Tên tệp gốc để đặt tên tệp mới
 */
export const exportToDocx = async (text: string, originalFileName: string) => {
  const cleanName = originalFileName.replace(/\.[^/.]+$/, "");
  const fileName = `OCR_${cleanName}.docx`;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: text.split("\n").map((line) => {
          return new Paragraph({
            children: [
              new TextRun({
                text: line,
                font: "Times New Roman",
                size: 26, // Tương đương ~13pt, chuẩn văn bản hành chính VN
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              line: 360, // Line spacing 1.5
              after: 200,
            },
          });
        }),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  
  // Kiểm tra phương thức saveAs khả dụng tùy theo cách bundle của esm.sh
  if (typeof FileSaver === 'function') {
    (FileSaver as any)(blob, fileName);
  } else if (FileSaver && typeof (FileSaver as any).saveAs === 'function') {
    (FileSaver as any).saveAs(blob, fileName);
  } else {
    // Fallback cơ bản nếu thư viện không tải được đúng cách
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
};
