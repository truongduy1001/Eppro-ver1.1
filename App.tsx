
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

// Khai báo kiểu cho window.aistudio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // FIX: Sử dụng readonly để tránh xung đột với các khai báo khác trong môi trường
    readonly aistudio: AIStudio;
  }
}

type ActiveTab = 'analyze' | 'compare' | 'ocr';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('analyze');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true); 

  // Kiểm tra API Key khi khởi chạy
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Giả định chọn key thành công theo hướng dẫn của SDK
      setHasApiKey(true);
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
    // FIX: Bổ sung kiểm tra "requested entity was not found" để yêu cầu người dùng chọn lại API Key
    const isKeyError = msg.toLowerCase().includes("api key") || 
                       msg.toLowerCase().includes("unauthorized") || 
                       msg.toLowerCase().includes("not be set") ||
                       msg.toLowerCase().includes("requested entity was not found");

    if (isKeyError) {
      setHasApiKey(false);
      setter("Lỗi: API Key không hợp lệ hoặc chưa được chọn. Vui lòng bấm 'Chọn API Key' để tiếp tục.");
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

  const handleCompare = useCallback(async () => {
      if (!file1 || !file2) return;
      setIsComparing(true);
      setLoadingMessage("Đang so sánh...");
      try {
        const result = await compareDocuments(file1, file2);
        setComparisonResult(result);
      } catch (err) {
        handleError(err, setComparisonError);
      } finally {
        setIsComparing(false);
      }
  }, [file1, file2]);

  const handlePerformOcr = useCallback(async () => {
      if (!ocrFile) return;
      setIsOcrLoading(true);
      try {
          const result = await performOcr(ocrFile);
          setOcrResult(result.text);
      } catch (err) {
          handleError(err, setOcrError);
      } finally {
          setIsOcrLoading(false);
      }
  }, [ocrFile]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 sm:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-sky-400 mb-2">Trợ lý Pháp lý AI</h1>
          <p className="text-slate-400">Hỗ trợ kiểm tra chính tả, rủi ro pháp lý và OCR văn bản Tiếng Việt.</p>
        </header>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden mb-8">
          {/* Cảnh báo API Key */}
          {!hasApiKey && (
            <div className="bg-amber-900/40 border-b border-amber-700 p-4 text-center">
              <p className="text-amber-200 mb-3">Vui lòng xác thực API Key trả phí của bạn để tiếp tục sử dụng. (Xem hướng dẫn: ai.google.dev/gemini-api/docs/billing)</p>
              <button 
                onClick={handleOpenSelectKey}
                className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Chọn API Key
              </button>
            </div>
          )}

          <div className="flex bg-slate-900/50 border-b border-slate-700">
            <button onClick={() => setActiveTab('analyze')} className={`flex-1 py-4 font-bold ${activeTab === 'analyze' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500'}`}>Phân tích File</button>
            <button onClick={() => setActiveTab('compare')} className={`flex-1 py-4 font-bold ${activeTab === 'compare' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500'}`}>So sánh 2 File</button>
            <button onClick={() => setActiveTab('ocr')} className={`flex-1 py-4 font-bold ${activeTab === 'ocr' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500'}`}>OCR</button>
          </div>

          <div className="p-6">
            {activeTab === 'analyze' && (
              <>
                <ContractTypeSelector selectedType={selectedContractId} onTypeChange={setSelectedContractId} contractTypes={CONTRACT_TYPES} onViewDetails={handleViewDetails} />
                <FileUpload file={file} onFileSelect={handleFileSelect} onCheck={handleCheckSpelling} onEvaluate={handleEvaluateLegality} isLoading={isLoading} isEvaluating={isEvaluating} />
                {error && <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-200 text-center">{error}</div>}
                {(isLoading || isEvaluating) && <Loader message={loadingMessage}/>}
                {spellCheckResult && !isLoading && <ResultsDisplay result={spellCheckResult} />}
                {legalResult && !isEvaluating && <LegalEvaluationDisplay result={legalResult} />}
              </>
            )}

            {activeTab === 'compare' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileDropzone file={file1} onFileSelect={setFile1} title="Tài liệu 1" />
                  <FileDropzone file={file2} onFileSelect={setFile2} title="Tài liệu 2" />
                </div>
                <button onClick={handleCompare} disabled={!file1 || !file2 || isComparing} className="w-full py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold disabled:opacity-50 transition-colors">Bắt đầu so sánh</button>
                {isComparing && <Loader message={loadingMessage}/>}
                {comparisonResult && <ComparisonDisplay result={comparisonResult}/>}
                {comparisonError && <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-200 text-center">{comparisonError}</div>}
              </div>
            )}

            {activeTab === 'ocr' && (
              <div className="space-y-6">
                <FileDropzone file={ocrFile} onFileSelect={setOcrFile} title="Tải ảnh/PDF quét" acceptedFormats="ocr" />
                <button onClick={handlePerformOcr} disabled={!ocrFile || isOcrLoading} className="w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-bold disabled:opacity-50 transition-colors">Trích xuất văn bản</button>
                {isOcrLoading && <Loader message="Đang nhận dạng văn bản..."/>}
                {ocrResult && <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl font-mono text-sm h-64 overflow-y-auto whitespace-pre-wrap">{ocrResult}</div>}
                {ocrError && <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-200 text-center">{ocrError}</div>}
              </div>
            )}
          </div>
        </div>

        <footer className="text-center text-slate-500 text-sm">
          <p>Cung cấp bởi AI <span className="text-red-700 font-bold">(DI-IT)</span>. Phân tích dựa trên các quy định pháp luật hiện hành.</p>
        </footer>
      </div>

      <ContractDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={CONTRACT_TYPES.find(c => c.id === selectedContractId)?.name || ''} content={modalContent} isLoading={isModalLoading} error={modalError} />
    </div>
  );
};

export default App;
