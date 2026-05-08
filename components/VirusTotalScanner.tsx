import React, { useState, useEffect, useCallback } from 'react';
import { Shield, ShieldAlert, ShieldCheck, FileSearch, UploadCloud, File, AlertCircle, Loader2, CheckCircle2, Copy, ExternalLink, Activity, RefreshCw, FolderSearch } from 'lucide-react';
import axios from 'axios';

interface VirusTotalScannerProps {
  theme: 'dark' | 'light';
}

interface ScanStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  timeout: number;
}

interface ScanResult {
  id: string;
  type: string;
  file_info: {
    sha256: string;
    md5?: string;
    name?: string;
    size: number;
  };
  stats: ScanStats;
  engine_results: Record<string, {
    category: string;
    engine_name: string;
    result: string | null;
  }>;
  status: 'queued' | 'in-progress' | 'completed';
}

interface FileScanItem {
  id: string;
  file: File;
  status: 'pending' | 'hashing' | 'checking' | 'uploading' | 'polling' | 'completed' | 'error' | 'rate_limited';
  progressText: string;
  result?: ScanResult;
  error?: string;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const VirusTotalScanner: React.FC<VirusTotalScannerProps> = ({ theme }) => {
  const [fileQueue, setFileQueue] = useState<FileScanItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<ScanResult | null>(null);

  // SHA-256 calculator helper
  const calculateSHA256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const addFilesToQueue = (files: File[]) => {
    setGlobalError(null);
    const validFiles = files.filter(f => f.size > 0);
    if (validFiles.length === 0) return;

    if (fileQueue.length + validFiles.length > 50) {
      setGlobalError("Chỉ hỗ trợ quét tối đa 50 file cùng lúc trên trình duyệt.");
      return;
    }

    const newItems: FileScanItem[] = validFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      status: 'pending',
      progressText: 'Chờ quét'
    }));

    setFileQueue(prev => [...prev, ...newItems]);
    setActiveResult(null);
  };

  const updateFileStatus = (id: string, updates: Partial<FileScanItem>) => {
    setFileQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const processFile = async (item: FileScanItem) => {
    if (item.file.size > 32 * 1024 * 1024) {
      updateFileStatus(item.id, { status: 'error', error: "File quá lớn (>32MB)", progressText: 'Lỗi' });
      return;
    }

    try {
      updateFileStatus(item.id, { status: 'hashing', progressText: 'Đang tính Hash...' });
      const fileHash = await calculateSHA256(item.file);
      
      updateFileStatus(item.id, { status: 'checking', progressText: 'Kiểm tra VT...' });
      try {
        const hashRes = await axios.get(`/api/security/hash/${fileHash}`);
        if (hashRes.data && hashRes.data.data) {
          const vtData = hashRes.data.data;
          const finalResult: ScanResult = {
            id: vtData.id,
            type: 'file',
            file_info: {
              sha256: fileHash,
              name: vtData.attributes.names?.[0] || item.file.name,
              size: vtData.attributes.size || item.file.size,
            },
            stats: vtData.attributes.last_analysis_stats,
            engine_results: vtData.attributes.last_analysis_results,
            status: 'completed'
          };
          updateFileStatus(item.id, { status: 'completed', result: finalResult, progressText: 'Hoàn tất' });
          await saveToHistory(finalResult);
          return;
        }
      } catch (err: any) {
        if (err?.response?.status === 429) {
          updateFileStatus(item.id, { status: 'rate_limited', error: 'Vượt quá giới hạn API', progressText: 'Lỗi API' });
          throw new Error("RATE_LIMIT");
        }
        if (err?.response?.status !== 404) {
          throw new Error(err?.response?.data?.error || "Lỗi khi kết nối đến cơ sở dữ liệu VirusTotal.");
        }
      }

      updateFileStatus(item.id, { status: 'uploading', progressText: 'Đang tải lên...' });
      const formData = new FormData();
      formData.append('file', item.file);
      const uploadRes = await axios.post('/api/security/scan-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const analysisId = uploadRes.data?.data?.id;
      if (!analysisId) throw new Error("Tải tệp lên thành công nhưng không có Analysis ID.");

      updateFileStatus(item.id, { status: 'polling', progressText: 'Chờ phân tích...' });
      await pollAnalysisResult(item.id, analysisId, fileHash, item.file);

    } catch (err: any) {
      if (err.message === "RATE_LIMIT") {
        setGlobalError("Đã đạt giới hạn API của VirusTotal (thường là 4 request/phút đối với bản miễn phí). Vui lòng chờ một lát rồi thử lại.");
        throw err;
      }
      updateFileStatus(item.id, { status: 'error', error: err?.response?.data?.error || err.message || "Lỗi không xác định.", progressText: 'Lỗi' });
    }
  };

  const pollAnalysisResult = async (itemId: string, analysisId: string, fileHash: string, fileObj: File, tryCount = 0) => {
    if (tryCount > 30) {
      updateFileStatus(itemId, { status: 'error', error: "Quá thời gian chờ", progressText: 'Lỗi Timeout' });
      return;
    }
    
    try {
      const res = await axios.get(`/api/security/scan-result/${analysisId}`);
      const data = res.data?.data;
      if (data) {
        const status = data.attributes.status;
        if (status === 'completed') {
          const finalResult: ScanResult = {
            id: analysisId,
            type: 'analysis',
            file_info: {
              sha256: fileHash,
              name: fileObj.name,
              size: fileObj.size,
            },
            stats: data.attributes.stats,
            engine_results: data.attributes.results,
            status: 'completed'
          };
          updateFileStatus(itemId, { status: 'completed', result: finalResult, progressText: 'Hoàn tất' });
          await saveToHistory(finalResult);
        } else {
          updateFileStatus(itemId, { progressText: `Chờ phân tích (${tryCount * 2}s)...` });
          setTimeout(() => pollAnalysisResult(itemId, analysisId, fileHash, fileObj, tryCount + 1), 5000);
        }
      } else {
        throw new Error("Phản hồi Analysis không hợp lệ.");
      }
    } catch (err: any) {
      if (err?.response?.status === 429) {
          updateFileStatus(itemId, { status: 'rate_limited', error: 'Vượt giới hạn API', progressText: 'Lỗi API' });
          return;
      }
      updateFileStatus(itemId, { status: 'error', error: err?.response?.data?.error || "Mất kết nối", progressText: 'Lỗi' });
    }
  };

  const startScanBatch = async () => {
    setIsScanning(true);
    setGlobalError(null);
    const pendingItems = fileQueue.filter(item => item.status === 'pending' || item.status === 'error' || item.status === 'rate_limited');
    
    for (const item of pendingItems) {
      try {
        await processFile(item);
        // Add a delay between API calls to avoid hitting rate limit too fast
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e: any) {
        if (e.message === "RATE_LIMIT") break;
      }
    }
    setIsScanning(false);
  };

  const getSafetyLevel = (stats?: ScanStats) => {
    if (!stats) return { label: 'Đang xử lý', color: 'text-slate-500', bg: 'bg-slate-500/10', val: 'UNKNOWN' };
    if (stats.malicious >= 3) {
      return { label: 'NGUY HIỂM', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', val: 'DANGEROUS' };
    }
    if (stats.suspicious > 0 || stats.malicious > 0) {
      return { label: 'NGHI NGỜ', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', val: 'SUSPICIOUS' };
    }
    return { label: 'AN TOÀN', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', val: 'SAFE' };
  };

  const saveToHistory = async (res: ScanResult) => {
    try {
      await axios.post('/api/security/history', {
        file_name: res.file_info.name || 'Unknown',
        file_size: res.file_info.size,
        sha256: res.file_info.sha256,
        scan_status: getSafetyLevel(res.stats).val,
        malicious_count: res.stats.malicious,
        suspicious_count: res.stats.suspicious,
        harmless_count: res.stats.harmless, // safe count
        undetected_count: res.stats.undetected,
        total_engine: res.stats.malicious + res.stats.suspicious + res.stats.harmless + res.stats.undetected + res.stats.timeout,
        virus_total_analysis_id: res.id,
        virus_total_link: `https://www.virustotal.com/gui/file/${res.file_info.sha256}`
      });
    } catch(err) {
      console.error("Failed to save history", err);
    }
  };

  const DashboardView = ({ result }: { result: ScanResult }) => {
    const [copied, setCopied] = useState(false);
    return (
      <div className="flex flex-col h-full fade-in-100 animate-in">
        {/* Header Status */}
        <div className={`p-6 border-b text-center ${getSafetyLevel(result.stats).bg} ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <h3 className={`text-2xl font-black mb-2 tracking-wide ${getSafetyLevel(result.stats).color}`}>
            {getSafetyLevel(result.stats).label}
          </h3>
          <div className="flex justify-center items-center gap-6 mt-4">
            <div className="text-center">
              <p className={`text-4xl font-black ${result.stats.malicious > 0 ? 'text-red-500' : (theme === 'dark' ? 'text-slate-300' : 'text-slate-700')}`}>{result.stats.malicious}</p>
              <p className="text-[10px] uppercase font-bold text-slate-500 mt-1 tracking-wider">Phát hiện<br/>độc hại</p>
            </div>
            <div className={`w-px h-10 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
            <div className="text-center">
              <p className={`text-4xl font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{result.stats.harmless + result.stats.undetected}</p>
              <p className="text-[10px] uppercase font-bold text-slate-500 mt-1 tracking-wider">An toàn &<br/>Không sạch</p>
            </div>
            <div className={`w-px h-10 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
            <div className="text-center">
              <p className="text-2xl font-black text-slate-400 mt-2">
                  {result.stats.malicious + result.stats.suspicious + result.stats.harmless + result.stats.undetected + result.stats.timeout}
              </p>
              <p className="text-[10px] uppercase font-bold text-slate-500 mt-1 tracking-wider">Tổng<br/>Engine</p>
            </div>
          </div>
        </div>
        
        {/* File Info */}
        <div className={`p-5 border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-800/20' : 'border-slate-200 bg-slate-50'}`}>
            <p className="text-xs font-bold text-slate-500 mb-1">SHA-256 HASH</p>
            <div className="flex items-center gap-3">
              <p className="font-mono text-xs w-full overflow-hidden text-ellipsis font-semibold">{result.file_info.sha256}</p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(result.file_info.sha256);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }} 
                className={`p-1.5 rounded-lg shrink-0 ${copied ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/20 hover:bg-slate-500/40 text-slate-400'}`}>
                {copied ? <CheckCircle2 className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
              </button>
            </div>
        </div>

        {/* Detailed Breakdown list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-2">Cơ sở dữ liệu Antivirus</h4>
          {Object.entries(result.engine_results).sort((a,b) => {
            if (a[1].category === 'malicious' && b[1].category !== 'malicious') return -1;
            if (a[1].category !== 'malicious' && b[1].category === 'malicious') return 1;
            return a[0].localeCompare(b[0]);
          }).map(([engine, data]) => (
            <div key={engine} className={`flex items-center justify-between p-3 rounded-xl border ${
              data.category === 'malicious' || data.category === 'suspicious' 
                ? (theme === 'dark' ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200')
                : (theme === 'dark' ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-200 hover:bg-slate-100')
            }`}>
              <span className="font-bold text-sm">{engine}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded capitalize ${
                data.category === 'malicious' ? 'bg-red-500/20 text-red-500' 
                  : data.category === 'suspicious' ? 'bg-amber-500/20 text-amber-500'
                  : data.category === 'harmless' || data.category === 'undetected' ? 'text-slate-400'
                  : 'text-slate-500'
              }`}>
                {data.result || data.category}
              </span>
            </div>
          ))}
        </div>

          {/* Footer VT Link */}
          <div className={`p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Xuất PDF</button>
              <button className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Xuất Excel</button>
            </div>
            <a 
              href={`https://www.virustotal.com/gui/file/${result.file_info.sha256}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-indigo-500 hover:text-indigo-400 uppercase tracking-widest w-full sm:w-auto justify-center"
            >
              Xem báo cáo đầy đủ <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
      </div>
    );
  };

  return (
    <div className={`w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="text-center w-full max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-indigo-500/10 text-indigo-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black mb-3">Quét File & Thư Mục An Toàn</h2>
        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Kiểm tra độ bảo mật bằng VirusTotal. Hỗ trợ quét hàng loạt tập tin hoặc toàn bộ thư mục (USB). Do giới hạn API, tính năng quét thư mục chỉ phù hợp với số lượng tệp nhỏ.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload Column */}
        <div className="space-y-6">
          <div className="flex gap-4">
             <div className="relative flex-1">
                <input 
                  type="file" 
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => e.target.files && addFilesToQueue(Array.from(e.target.files))}
                />
                <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-500' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                  <UploadCloud className="w-6 h-6 mb-2 text-indigo-500" />
                  <span className="font-bold text-sm">Chọn Files</span>
                </div>
             </div>
             
             <div className="relative flex-1">
                <input 
                  type="file" 
                  /* @ts-ignore - webkitdirectory is non-standard but widely supported */
                  webkitdirectory="true" 
                  directory="true"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => e.target.files && addFilesToQueue(Array.from(e.target.files))}
                />
                <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-amber-500' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                  <FolderSearch className="w-6 h-6 mb-2 text-amber-500" />
                  <span className="font-bold text-sm">Chọn Ổ đĩa / USB</span>
                </div>
             </div>
          </div>

          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`relative flex flex-col items-center justify-center p-8 border-2 rounded-3xl transition-all ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-500/10 scale-105' 
                : theme === 'dark' 
                  ? 'border-dashed border-slate-700 bg-slate-800/50 ' 
                  : 'border-dashed border-slate-300 bg-slate-50'
            }`}
          >
            <h3 className="font-bold text-lg mb-2">Hoặc Kéo & Thả tập tin vào đây</h3>
            <p className="text-sm font-medium text-slate-500 text-center max-w-sm">Hỗ trợ quét đồng loạt nhiều tệp</p>
          </div>

          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400/90' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
            <h4 className="flex items-center gap-2 font-bold mb-1 text-sm">
              <AlertCircle className="w-4 h-4" /> Giới hạn API VirusTotal
            </h4>
            <p className="text-[11px] font-medium opacity-90 leading-relaxed uppercase tracking-widest">
              Phiên bản miễn phí chỉ cho phép quét 4 tệp / phút. Nếu bạn chọn cả thư mục USB chứa hàng trăm tệp, quá trình quét sẽ bị từ chối bởi máy chủ. Vui lòng cân nhắc chỉ quét các tệp nghi ngờ.
            </p>
          </div>

          {globalError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" /> <span className="leading-tight">{globalError}</span>
            </div>
          )}

          {fileQueue.length > 0 && (
            <div className={`mt-4 rounded-2xl border overflow-hidden flex flex-col max-h-[400px] ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className={`p-4 border-b flex justify-between items-center bg-opacity-50 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 <h4 className="font-bold text-sm flex items-center gap-2">
                   Danh sách chờ ({fileQueue.length})
                 </h4>
                 <button 
                  onClick={() => { setFileQueue([]); setActiveResult(null); setIsScanning(false); }}
                  className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1"
                 >
                   Xóa tất cả
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                 {fileQueue.map((item, idx) => (
                    <div 
                      key={item.id} 
                      onClick={() => item.result && setActiveResult(item.result)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-default transition-all ${
                        item.status === 'completed' && item.result ? (theme === 'dark' ? 'hover:bg-slate-700/50 cursor-pointer' : 'hover:bg-slate-100 cursor-pointer') : ''
                      } ${theme === 'dark' ? 'border border-transparent hover:border-slate-700' : 'border border-transparent hover:border-slate-200'}`}
                    >
                       <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`p-2 rounded-lg shrink-0 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                             {(item.status === 'hashing' || item.status === 'uploading' || item.status === 'checking' || item.status === 'polling') ? (
                               <Loader2 className="w-4 h-4 text-indigo-400 justify-center animate-spin" />
                             ) : item.status === 'error' || item.status === 'rate_limited' ? (
                               <AlertCircle className="w-4 h-4 text-red-400" />
                             ) : item.status === 'completed' ? (
                               <ShieldCheck className={`w-4 h-4 ${item.result && item.result.stats.malicious > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                             ) : (
                               <File className="w-4 h-4 text-slate-400" />
                             )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{item.file.name}</p>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{formatBytes(item.file.size)} &bull; {item.progressText}</p>
                          </div>
                       </div>
                       {item.result && (
                         <div className="shrink-0 text-right">
                            {item.result.stats.malicious > 0 ? (
                               <span className="text-xs font-bold px-2 py-1 bg-red-500/20 text-red-500 rounded-md">PHÁT HIỆN: {item.result.stats.malicious}</span>
                            ) : (
                               <span className="text-xs font-bold px-2 py-1 bg-emerald-500/20 text-emerald-500 rounded-md">AN TOÀN</span>
                            )}
                         </div>
                       )}
                    </div>
                 ))}
              </div>
              <div className={`p-4 border-t flex gap-3 ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                <button 
                  onClick={startScanBatch} 
                  disabled={isScanning || fileQueue.every(i => i.status === 'completed')}
                  className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                    isScanning || fileQueue.every(i => i.status === 'completed')
                      ? 'opacity-80 cursor-not-allowed bg-indigo-600/50 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  }`}
                >
                  {isScanning ? (
                    <><Loader2 className="w-4 h-4 animate-spin"/> Đang xử lý hàng đợi...</>
                  ) : (
                    <><FileSearch className="w-4 h-4"/> Bắt đầu quét tất cả</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Column */}
        <div className={`h-full min-h-[400px] flex flex-col rounded-3xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-md'}`}>
          {!activeResult ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-50">
              <Activity className="w-12 h-12 mb-4 text-slate-400" />
              <p className="font-bold font-mono text-sm uppercase tracking-widest">DashBoard Phân Tích</p>
              <p className="text-xs font-medium mt-2">Tính năng sẽ hiển thị sau khi hoàn tất quét 1 tệp. Nhấp vào kết quả bất kỳ bên cột trái để xem chi tiết.</p>
            </div>
          ) : (
            <DashboardView result={activeResult} />
          )}
        </div>
      </div>
    </div>
  );
};

export default VirusTotalScanner;
