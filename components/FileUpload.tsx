import React, { useRef, useState, useCallback } from 'react';

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onCheck: () => void;
  onEvaluate: () => void;
  isLoading: boolean;
  isEvaluating: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ file, onFileSelect, onCheck, onEvaluate, isLoading, isEvaluating }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      const acceptedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/pdf",
      ];
      const acceptedExtensions = ['.docx', '.pdf'];
      const fileName = droppedFile.name.toLowerCase();
      
      if (acceptedTypes.includes(droppedFile.type) || acceptedExtensions.some(ext => fileName.endsWith(ext))) {
        onFileSelect(droppedFile);
      } else {
        alert("Chỉ chấp nhận tệp .docx hoặc .pdf.");
      }
      e.dataTransfer.clearData();
    }
  }, [onFileSelect]);

  return (
    <div className="flex flex-col items-center">
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={handleClick}
        className={`w-full p-8 sm:p-10 text-center border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${isDragging ? 'border-sky-400 bg-sky-900/30' : 'border-slate-600 hover:border-sky-500 hover:bg-slate-700/50'}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".docx,.pdf"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <svg className="w-12 h-12 mb-3 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p className="mb-2 text-sm text-slate-400">
            <span className="font-semibold text-sky-400">Nhấn để tải lên</span> hoặc kéo và thả tệp
          </p>
          <p className="text-xs text-slate-500">Hỗ trợ .docx, .pdf</p>
        </div>
      </div>
      {file && (
        <div className="w-full text-center text-sm text-slate-300 bg-slate-700/50 p-3 rounded-lg mt-6">
          <p><span className="font-medium">Tệp đã chọn:</span> {file.name}</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-6 w-full">
        <button
          onClick={onCheck}
          disabled={!file || isLoading || isEvaluating}
          className="w-full sm:w-auto px-8 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-300"
        >
          {isLoading ? 'Đang xử lý...' : 'Kiểm tra Chính tả & Thể thức'}
        </button>
        <button
          onClick={onEvaluate}
          disabled={!file || isLoading || isEvaluating}
          className="w-full sm:w-auto px-8 py-3 text-base font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-300"
        >
          {isEvaluating ? 'Đang phân tích...' : 'Phát hiện Lỗ hổng Pháp lý'}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;