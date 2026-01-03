import React, { useState, useCallback, useRef } from 'react';

interface FileDropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  title: string;
  acceptedFormats?: 'documents' | 'images' | 'ocr';
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ file, onFileSelect, title, acceptedFormats = 'documents' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  let accept: string;
  let description: string;
  let acceptedMimeTypes: string[];
  let acceptedExtensions: string[];
  let alertMessage: string;

  if (acceptedFormats === 'images') {
      accept = "image/png,image/jpeg,image/gif,image/bmp,.png,.jpg,.jpeg,.gif,.bmp";
      description = "Hỗ trợ tệp ảnh (.png, .jpg, .bmp)";
      acceptedMimeTypes = ["image/png", "image/jpeg", "image/gif", "image/bmp"];
      acceptedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
      alertMessage = "Chỉ chấp nhận tệp ảnh (.png, .jpg, .gif, .bmp).";
  } else if (acceptedFormats === 'ocr') {
      accept = "image/png,image/jpeg,image/bmp,application/pdf,.png,.jpg,.jpeg,.bmp,.pdf";
      description = "Hỗ trợ tệp ảnh (.png, .jpg) và .pdf";
      acceptedMimeTypes = ["image/png", "image/jpeg", "image/bmp", "application/pdf"];
      acceptedExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.pdf'];
      alertMessage = "Chỉ chấp nhận tệp ảnh hoặc tệp .pdf.";
  } else { // documents
      accept = "application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,.docx,.pdf";
      description = "Hỗ trợ .docx, .pdf";
      acceptedMimeTypes = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/pdf"];
      acceptedExtensions = ['.docx', '.pdf'];
      alertMessage = "Chỉ chấp nhận tệp .docx hoặc .pdf.";
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const fileName = droppedFile.name.toLowerCase();
      
      if (acceptedMimeTypes.includes(droppedFile.type) || acceptedExtensions.some(ext => fileName.endsWith(ext))) {
        onFileSelect(droppedFile);
      } else {
        alert(alertMessage);
      }
      e.dataTransfer.clearData();
    }
  }, [onFileSelect, acceptedMimeTypes, acceptedExtensions, alertMessage]);
  
  const handleRemoveFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col w-full">
      <h3 className="text-center font-semibold mb-2 text-slate-300">{title}</h3>
      <div
        onClick={handleClick}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`relative w-full p-6 text-center border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${isDragging ? 'border-sky-400 bg-sky-900/30' : 'border-slate-600 hover:border-sky-500 hover:bg-slate-700/50'}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={accept}
        />
        {!file ? (
            <div className="flex flex-col items-center justify-center pointer-events-none text-sm">
                <svg className="w-10 h-10 mb-2 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                <p className="text-slate-400">
                    <span className="font-semibold text-sky-400">Nhấn để tải lên</span> hoặc thả tệp
                </p>
                 <p className="text-xs text-slate-500 mt-1">{description}</p>
            </div>
        ) : (
            <div className="text-center text-sm text-slate-300">
                <p className="font-medium break-all">{file.name}</p>
                 <button 
                    onClick={handleRemoveFile} 
                    className="mt-2 text-xs text-red-400 hover:text-red-300 hover:underline"
                    aria-label={`Xóa tệp ${file.name}`}
                 >
                    Xóa tệp
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default FileDropzone;