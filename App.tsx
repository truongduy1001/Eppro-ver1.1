import React, { useState, useCallback } from 'react';
import { checkVietnameseSpelling, getContractDetails, evaluateContractLegality } from './services/geminiService.ts';
import { CONTRACT_TYPES } from './constants.ts';
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult } from './types.ts';
import FileUpload from './components/FileUpload.tsx';
import ResultsDisplay from './components/ResultsDisplay.tsx';
import Loader from './components/Loader.tsx';
import ContractTypeSelector from './components/ContractTypeSelector.tsx';
import ContractDetailsModal from './components/ContractDetailsModal.tsx';
import LegalEvaluationDisplay from './components/LegalEvaluationDisplay.tsx';

// Khai báo kiểu cho window.aistudio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

type ActiveTab = 'analyze' | 'compare' | 'ocr';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('analyze');
  const [showKeyAlert, setShowKeyAlert] = useState<boolean>(false);
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

  const handleError = (err: any, setter: (msg: string) => void) => {
    const msg = err instanceof Error ? err.message : String(err);
    // Kiểm tra các lỗi liên quan đến API Key
    const isKeyError = msg.toLowerCase().includes("api key") || 
                       msg.toLowerCase().includes("unauthorized") || 
                       msg.toLowerCase().includes("not found") ||
                       msg.toLowerCase().includes("401") ||
                       msg.toLowerCase().includes("403");

    if (isKeyError) {
      setShowKeyAlert(true);
      setter("Lỗi: Không thể xác thực API Key. Nếu bạn đang dùng Vercel, hãy đảm bảo tên biến môi trường là API_KEY (không phải VITE_API_KEY).");
    } else {
      setter(`Lỗi: ${msg}`);
    }
  };

  const handleOpenSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setShowKeyAlert(false);
      setError(null);
    } else {
      alert("Tính năng chọn Key chỉ khả dụng trong môi trường Google AI Studio. Trên Vercel, vui lòng kiểm tra lại phần Environment Variables.");
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
          <p className="text-slate-400 font-medium">Kiểm tra chính tả, rủi ro pháp lý và OCR văn bản Tiếng Việt.</p>
        </header>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden mb-8">
          {showKeyAlert && (
            <div className="bg-red-900/60 border-b border-red-700 p-6 text-center">
              <p className="text-red-200 font-bold mb-4 italic">⚠️ LỖI XÁC THỰC: Hệ thống không đọc được API Key của bạn.</p>
              <button 
                onClick={handleOpenSelectKey}
                className="bg-white text-red-900 px-8 py-3 rounded-xl font-black hover:bg-slate-200 transition-all shadow-lg"
              >
                THỬ CHỌN LẠI API KEY
              </button>
            </div>
          )}

          <div className="flex bg-slate-900/50 border-b border-slate-700">
            <button onClick={() => setActiveTab('analyze')} className={`flex-1 py-4 font-bold transition-all ${activeTab === 'analyze' ? 'text-sky-400 bg-sky-400/10 border-b-4 border-sky-400' : 'text-slate-500 hover:text-slate-300'}`}>Phân tích File</button>
            <button onClick={() => setActiveTab('compare')} className={`flex-1 py-4 font-bold transition-all ${activeTab === 'compare' ? 'text-sky-400 bg-sky-400/10 border-b-4 border-sky-400' : 'text-slate-500 hover:text-slate-300'}`}>So sánh 2 File</button>
            <button onClick={() => setActiveTab('ocr')} className={`flex-1 py-4 font-bold transition-all ${activeTab === 'ocr' ? 'text-sky-400 bg-sky-400/10 border-b-4 border-sky-400' : 'text-slate-500 hover:text-slate-300'}`}>OCR</button>
          </div>

          <div className="p-6">
            {activeTab === 'analyze' && (
              <>
                <ContractTypeSelector selectedType={selectedContractId} onTypeChange={setSelectedContractId} contractTypes={CONTRACT_TYPES} onViewDetails={handleViewDetails} />
                <FileUpload file={file} onFileSelect={handleFileSelect} onCheck={handleCheckSpelling} onEvaluate={handleEvaluateLegality} isLoading={isLoading} isEvaluating={isEvaluating} />
                {error && <div className="mt-6 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-200 text-center font-medium animate-pulse">{error}</div>}
                {(isLoading || isEvaluating) && <Loader message={isLoading ? "Đang kiểm tra chính tả..." : "Đang phân tích pháp lý..."}/>}
                {spellCheckResult && !isLoading && <ResultsDisplay result={spellCheckResult} />}
                {legalResult && !isEvaluating && <LegalEvaluationDisplay result={legalResult} />}
              </>
            )}
            
            {(activeTab === 'compare' || activeTab === 'ocr') && (
               <div className="text-center p-12 text-slate-400 italic bg-slate-900/20 rounded-xl">Tính năng này đang được tối ưu hóa. Vui lòng quay lại sau.</div>
            )}
          </div>
        </div>

        <footer className="text-center text-slate-500 text-xs py-4">
          <p>Phiên bản 1.1 - Phát triển bởi <span className="text-red-700 font-bold">DI-IT</span></p>
          <p className="mt-1 opacity-60">Dữ liệu được xử lý bảo mật qua Google Gemini API</p>
        </footer>
      </div>

      <ContractDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={CONTRACT_TYPES.find(c => c.id === selectedContractId)?.name || ''} content={modalContent} isLoading={isModalLoading} error={modalError} />
    </div>
  );
};

export default App;