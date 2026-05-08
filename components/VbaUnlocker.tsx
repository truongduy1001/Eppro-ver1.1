import React, { useState } from 'react';
import { Unlock, FileKey, UploadCloud, File, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import axios from 'axios';

interface VbaUnlockerProps {
  theme: 'dark' | 'light';
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const VbaUnlocker: React.FC<VbaUnlockerProps> = ({ theme }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    const validExtensions = ['.doc', '.docm', '.xls', '.xlsm', '.ppt', '.pptm'];
    const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      setError("Chỉ hỗ trợ các định dạng .doc, .docm, .xls, .xlsm, .ppt, .pptm");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File quá lớn. Vui lòng chọn file dưới 50MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const handleUnlock = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/tools/vba-unlock', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob' // Important to receive binary data
      });

      // Create a download link for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `unlocked_${file.name}`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      link.parentNode?.removeChild(link);
      
      setSuccess(true);
    } catch (err: any) {
      if (err.response && err.response.data instanceof Blob) {
        // Read blob error message
        const text = await err.response.data.text();
        try {
          const jsonError = JSON.parse(text);
          setError(jsonError.error || "Lỗi không xác định khi bẻ khóa.");
        } catch (e) {
          setError("Lỗi máy chủ khi bẻ khóa VBA.");
        }
      } else {
        setError("Lỗi kết nối tới máy chủ.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="text-center w-full max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-xl bg-orange-500/10 text-orange-500">
          <Unlock className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black mb-3 text-orange-500">Gỡ Pass VBA Office</h2>
        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Bẻ khóa (xóa mật khẩu) các file chứa Macro VBA (Excel, Word, PowerPoint). Phiên bản an toàn, dữ liệu chỉ được xử lý tạm thời và xóa ngay lập tức.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Upload Column */}
        <div className="space-y-6">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`relative flex flex-col items-center justify-center p-10 border-2 rounded-2xl transition-all ${
              isDragging 
                ? 'border-orange-500 bg-orange-500/10 scale-105' 
                : theme === 'dark' 
                  ? 'border-dashed border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600' 
                  : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
            }`}
          >
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".doc,.docm,.xls,.xlsm,.ppt,.pptm"
              onChange={(e) => e.target.files && e.target.files[0] && handleFileSelected(e.target.files[0])}
            />
            <div className={`p-4 rounded-full mb-4 ${theme === 'dark' ? 'bg-slate-700 text-orange-400' : 'bg-white text-orange-500 shadow-sm'}`}>
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2">Chọn file Office</h3>
            <p className="text-xs font-medium text-slate-500 text-center px-4 max-w-sm">Hỗ trợ .doc, .docm, .xls, .xlsm, .ppt, .pptm</p>
          </div>

          {file && (
            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-4 mb-5">
                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  <FileKey className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate text-sm">{file.name}</h4>
                  <p className="text-xs font-medium text-slate-500">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button 
                onClick={handleUnlock} 
                disabled={isProcessing}
                className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                  isProcessing 
                    ? 'opacity-80 cursor-not-allowed bg-orange-600/50 text-white' 
                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5'
                }`}
              >
                {isProcessing ? 'Đang bẻ khóa...' : '🔓 Tiến hành gỡ Pass'}
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> <span className="leading-tight">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Gỡ MK thành công! Tệp tin đang được tải xuống.</span>
            </div>
          )}
        </div>

        {/* Instructions Column */}
        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
             📚 Hướng dẫn sử dụng
          </h3>
          <ol className={`space-y-4 text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            <li className="flex gap-3">
               <span className="font-bold text-orange-500">1.</span>
               <span>Tải lên tệp Office (Word, Excel, PowerPoint) của bạn.</span>
            </li>
            <li className="flex gap-3">
               <span className="font-bold text-orange-500">2.</span>
               <span>Hệ thống sẽ tải file "unlocked_..." về máy.</span>
            </li>
            <li className="flex gap-3">
               <span className="font-bold text-orange-500">3.</span>
               <span>Mở tệp đã tải xuống, nhấn <kbd className={`px-1.5 py-0.5 rounded text-xs ml-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'} border`}>ALT + F11</kbd> (Tiếp tục nếu hiện lỗi).</span>
            </li>
            <li className="flex gap-3">
               <span className="font-bold text-orange-500">4.</span>
               <span>Trong giao diện chỉnh sửa Macro, <b>chưa vội mở thư mục</b>, chọn đường dẫn <b>Tools &gt; VBA Project Properties</b>.</span>
            </li>
            <li className="flex gap-3">
               <span className="font-bold text-orange-500">5.</span>
               <span>Chuyển sang tab <b>Protection</b>, sửa mật khẩu thành bất kỳ (VD: 123) và <b>vẫn giữ dấu tick ở ô Lock...</b>.</span>
            </li>
            <li className="flex gap-3">
               <span className="font-bold text-orange-500">6.</span>
               <span>Lưu tệp lại và thoát chương trình hoàn toàn. Mở lại tệp và làm tương tự (Alt + F11 &gt; Protection), <b>bỏ tick và xóa trống ô mật khẩu</b>.</span>
            </li>
            <li className="flex gap-3">
               <span className="font-bold text-orange-500">7.</span>
               <span>Lưu lại một lần nữa. File của bạn đã hoàn toàn bẻ khóa Macro.</span>
            </li>
          </ol>
        </div>

      </div>
    </div>
  );
};

export default VbaUnlocker;
