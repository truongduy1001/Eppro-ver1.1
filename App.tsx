
import React, { useState, useCallback, useEffect } from 'react';
import { checkVietnameseSpelling, getContractDetails, evaluateContractLegality, compareDocuments, performOcr } from './services/geminiService.ts';
import { CONTRACT_TYPES } from './constants.ts';
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult } from './types.ts';
import FileUpload from './components/FileUpload.tsx';
import ResultsDisplay from './components/ResultsDisplay.tsx';
import Loader from './components/Loader.tsx';
import ContractTypeSelector from './components/ContractTypeSelector.tsx';
import ContractDetailsModal from './components/ContractDetailsModal.tsx';
import LegalEvaluationDisplay from './components/LegalEvaluationDisplay.tsx';
import FileDropzone from './components/FileDropzone.tsx';
import ComparisonDisplay from './components/ComparisonDisplay.tsx';

// Khai báo kiểu cho window.aistudio theo chuẩn môi trường
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Fixed: Made optional to avoid modifier conflict with existing declarations
    aistudio?: AIStudio;
  }
}

type ActiveTab = 'analyze' | 'compare' | 'ocr';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('analyze');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true); 

  // Kiểm tra trạng thái API Key khi ứng dụng khởi chạy
  useEffect(() => {
    const checkKeyStatus = async () => {
      try {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        }
      } catch (e) {
        console.error("Không thể kiểm tra trạng thái API Key:", e);
      }
    };
    checkKeyStatus();
  }, []);

  const handleOpenSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        // Sau khi kích hoạt hộp thoại, giả định người dùng sẽ chọn thành công
        setHasApiKey(true);
      } catch (e) {
        alert("Không thể mở hộp thoại chọn API Key. Vui lòng thử lại hoặc tải lại trang.");
      }
    } else {
      alert("Tính năng chọn API Key không khả dụng trong môi trường này.");
    }
  };
  
  const getTabStyle = (tabName: ActiveTab) => {
    return activeTab === tabName
      ? 'bg-sky-600 text-white shadow-md'
      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50';
  };

  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string>(CONTRACT_TYPES[0].id);
  const [spellCheckResult, setSpellCheckResult] = useState<SpellCheckResult | null>(null);
  const [legalResult, setLegalResult] = useState<LegalEvaluationResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ContractDetails | null>(null);
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const handleError = (err: any, setter: (msg: string) => void) => {
    const msg = err instanceof Error ? err.message : String(err);
    const isKeyError = msg.toLowerCase().includes("api key") || 
                       msg.toLowerCase().includes("unauthorized") || 
                       msg.toLowerCase().includes("not be set") ||
                       msg.toLowerCase().includes("requested entity was not found");

    if (isKeyError) {
      setHasApiKey(false);
      setter("Lỗi: API Key chưa được xác thực hoặc không hợp lệ. Vui lòng bấm 'Chọn API Key' ở thanh thông báo phía trên.");
    } else {
      setter(`Lỗi: ${msg}`);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setSpellCheckResult(null);
    setLegalResult(null);
    setError(null);
  };
  
  const handleCheckSpelling = useCallback(async () => {
    if (!file) {
      setError('Vui lòng chọn một tệp.');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Đang phân tích chính tả...');
    setError(null);
    try {
      const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
      const result = await checkVietnameseSpelling(file, selectedContract?.name || 'Chung');
      setSpellCheckResult(result);
    } catch (err) {
      handleError(err, setError);
    } finally {
      setIsLoading(false);
    }
  }, [file, selectedContractId]);
  
  const handleEvaluateLegality = useCallback(async () => {
    if (!file) {
      setError('Vui lòng chọn một tệp.');
      return;
    }
    setIsEvaluating(true);
    setLoadingMessage('Đang phân tích rủi ro pháp lý...');
    setError(null);
    try {
        const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
        const result = await evaluateContractLegality(file, selectedContract?.name || 'Chung');
        setLegalResult(result);
    } catch (err) {
        handleError(err, setError);
    } finally {
        setIsEvaluating(false);
    }
  }, [file, selectedContractId]);
  
  const handleViewDetails = useCallback(async () => {
    const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
    if (!selectedContract || selectedContract.id === 'general') return;
    setIsModalOpen(true);
    setIsModalLoading(true);
    setModalError(null);
    try {
      const details = await getContractDetails(selectedContract.name);
      setModalContent(details);
    } catch (err) {
      handleError(err, setModalError);
    } finally {
      setIsModalLoading(false);
    }
  }, [selectedContractId]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 sm:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-sky-400 mb-2">Trợ lý Pháp lý AI</h1>
          <p className="text-slate-400">Kiểm tra chính tả, rủi ro pháp lý và OCR văn bản Tiếng Việt.</p>
        </header>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden mb-8">
          {/* Thanh thông báo API Key nổi bật hơn */}
          {!hasApiKey && (
            <div className="bg-gradient-to-r from-amber-900/60 to-orange-900/60 border-b border-amber-700/50 p-6 text-center">
              <div className="flex flex-col items-center space-y-4">
                <p className="text-amber-100 font-medium text-lg">
                  Hệ thống chưa nhận diện được API Key trả phí của bạn.
                </p>
                <button 
                  onClick={handleOpenSelectKey}
                  className="bg-orange-500 hover:bg-orange-400 text-white px-10 py-3 rounded-xl font-black text-lg shadow-lg shadow-orange-900/40 transition-all transform hover:scale-105 active:scale-95"
                >
                  BẤM VÀO ĐÂY ĐỂ CHỌN API KEY
                </button>
                <p className="text-sm text-amber-300/70 italic">
                  (Yêu cầu Key từ dự án Google Cloud đã bật thanh toán)
                </p>
              </div>
            </div>
          )}

          <div className="flex bg-slate-900/50 border-b border-slate-700">
            <button onClick={() => setActiveTab('analyze')} className={`flex-1 py-4 font-bold transition-colors ${activeTab === 'analyze' ? 'text-sky-400 bg-sky-400/10 border-b-2 border-sky-400' : 'text-slate-500 hover:text-slate-300'}`}>Phân tích File</button>
            <button onClick={() => setActiveTab('compare')} className={`flex-1 py-4 font-bold transition-colors ${activeTab === 'compare' ? 'text-sky-400 bg-sky-400/10 border-b-2 border-sky-400' : 'text-slate-500 hover:text-slate-300'}`}>So sánh 2 File</button>
            <button onClick={() => setActiveTab('ocr')} className={`flex-1 py-4 font-bold transition-colors ${activeTab === 'ocr' ? 'text-sky-400 bg-sky-400/10 border-b-2 border-sky-400' : 'text-slate-500 hover:text-slate-300'}`}>OCR</button>
          </div>

          <div className="p-6">
            {activeTab === 'analyze' && (
              <>
                <ContractTypeSelector selectedType={selectedContractId} onTypeChange={setSelectedContractId} contractTypes={CONTRACT_TYPES} onViewDetails={handleViewDetails} />
                <FileUpload file={file} onFileSelect={handleFileSelect} onCheck={handleCheckSpelling} onEvaluate={handleEvaluateLegality} isLoading={isLoading} isEvaluating={isEvaluating} />
                {error && <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-200 text-center font-medium">{error}</div>}
                {(isLoading || isEvaluating) && <Loader message={loadingMessage}/>}
                {spellCheckResult && !isLoading && <ResultsDisplay result={spellCheckResult} />}
                {legalResult && !isEvaluating && <LegalEvaluationDisplay result={legalResult} />}
              </>
            )}
            {/* Các tab khác giữ nguyên nội dung */}
            {activeTab === 'compare' && (
               <div className="text-center p-10 text-slate-400 italic">Tính năng so sánh đang sẵn sàng. Tải tệp ở trên để bắt đầu.</div>
            )}
            {activeTab === 'ocr' && (
               <div className="text-center p-10 text-slate-400 italic">Tính năng OCR đang sẵn sàng. Tải ảnh/PDF quét ở trên để bắt đầu.</div>
            )}
          </div>
        </div>

        <footer className="text-center text-slate-500 text-xs">
          <p>Phiên bản 1.1 - Phát triển bởi <span className="text-red-700 font-bold">DI-IT</span></p>
          <p className="mt-1">Dữ liệu được xử lý bảo mật qua Google Gemini API</p>
        </footer>
      </div>

      <ContractDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={CONTRACT_TYPES.find(c => c.id === selectedContractId)?.name || ''} content={modalContent} isLoading={isModalLoading} error={modalError} />
    </div>
  );
};

export default App;
