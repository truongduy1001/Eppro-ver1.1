
import React, { useState, useCallback } from 'react';
import { checkVietnameseSpelling, getContractDetails, evaluateContractLegality, compareDocuments } from './services/geminiService.ts';
import { CONTRACT_TYPES } from './constants.ts';
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult } from './types.ts';
import FileUpload from './components/FileUpload.tsx';
import FileDropzone from './components/FileDropzone.tsx';
import ResultsDisplay from './components/ResultsDisplay.tsx';
import Loader from './components/Loader.tsx';
import ContractTypeSelector from './components/ContractTypeSelector.tsx';
import ContractDetailsModal from './components/ContractDetailsModal.tsx';
import LegalEvaluationDisplay from './components/LegalEvaluationDisplay.tsx';
import ComparisonDisplay from './components/ComparisonDisplay.tsx';

type ActiveTab = 'analyze' | 'compare' | 'ocr';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('analyze');
  const [file, setFile] = useState<File | null>(null);
  
  // State cho So sánh
  const [compareFile1, setCompareFile1] = useState<File | null>(null);
  const [compareFile2, setCompareFile2] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

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
    if (msg.toLowerCase().includes("api_key")) {
      setter("Lỗi: Không tìm thấy API Key hoặc Key không hợp lệ. Vui lòng kiểm tra lại cấu hình.");
    } else {
      setter(`Lỗi hệ thống: ${msg}`);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setSpellCheckResult(null);
    setLegalResult(null);
    setError(null);
  };
  
  const handleCheckSpelling = useCallback(async () => {
    if (!file) { setError('Vui lòng chọn một tệp.'); return; }
    setIsLoading(true); setError(null);
    try {
      const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
      const result = await checkVietnameseSpelling(file, selectedContract?.name || 'Chung');
      setSpellCheckResult(result);
    } catch (err) { handleError(err, setError); } finally { setIsLoading(false); }
  }, [file, selectedContractId]);
  
  const handleEvaluateLegality = useCallback(async () => {
    if (!file) { setError('Vui lòng chọn một tệp.'); return; }
    setIsEvaluating(true); setError(null);
    try {
        const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
        const result = await evaluateContractLegality(file, selectedContract?.name || 'Chung');
        setLegalResult(result);
    } catch (err) { handleError(err, setError); } finally { setIsEvaluating(false); }
  }, [file, selectedContractId]);

  const handleStartComparison = useCallback(async () => {
    if (!compareFile1 || !compareFile2) { setError('Vui lòng chọn đủ 2 văn bản để so sánh.'); return; }
    setIsComparing(true); setError(null); setComparisonResult(null);
    try {
      const result = await compareDocuments(compareFile1, compareFile2);
      setComparisonResult(result);
    } catch (err) { handleError(err, setError); } finally { setIsComparing(false); }
  }, [compareFile1, compareFile2]);

  const handleViewDetails = useCallback(async () => {
    const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
    if (!selectedContract || selectedContract.id === 'general') return;
    setIsModalOpen(true); setIsModalLoading(true); setModalError(null);
    try {
      const details = await getContractDetails(selectedContract.name);
      setModalContent(details);
    } catch (err) { handleError(err, setModalError); } finally { setIsModalLoading(false); }
  }, [selectedContractId]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 sm:p-8">
      <div className="max-w-5xl mx-auto w-full">
        <header className="text-center mb-10">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-sky-400 uppercase bg-sky-900/30 rounded-full border border-sky-800">
            Legal AI Professional
          </div>
          <h1 className="text-5xl font-black text-white mb-3">Trợ lý Pháp lý AI</h1>
          <p className="text-slate-400 max-w-lg mx-auto font-medium">Đối soát rủi ro, so sánh văn bản và chuẩn hóa ngôn ngữ pháp lý thông minh.</p>
        </header>

        <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden mb-8 ring-1 ring-white/5">
          <div className="flex bg-slate-900/50 border-b border-slate-700 p-1">
            <button onClick={() => {setActiveTab('analyze'); setError(null);}} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${activeTab === 'analyze' ? 'text-sky-400 bg-slate-800 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Phân tích File</button>
            <button onClick={() => {setActiveTab('compare'); setError(null);}} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${activeTab === 'compare' ? 'text-sky-400 bg-slate-800 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>So sánh Văn bản</button>
            <button onClick={() => {setActiveTab('ocr'); setError(null);}} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${activeTab === 'ocr' ? 'text-sky-400 bg-slate-800 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>OCR</button>
          </div>

          <div className="p-8">
            {activeTab === 'analyze' && (
              <>
                <ContractTypeSelector selectedType={selectedContractId} onTypeChange={setSelectedContractId} contractTypes={CONTRACT_TYPES} onViewDetails={handleViewDetails} />
                <FileUpload file={file} onFileSelect={handleFileSelect} onCheck={handleCheckSpelling} onEvaluate={handleEvaluateLegality} isLoading={isLoading} isEvaluating={isEvaluating} />
                {error && <div className="mt-6 p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-200 text-center font-medium animate-pulse">{error}</div>}
                {(isLoading || isEvaluating) && <Loader message={isLoading ? "Đang rà soát ngôn ngữ..." : "Đang thẩm định pháp lý..."}/>}
                {spellCheckResult && !isLoading && <ResultsDisplay result={spellCheckResult} />}
                {legalResult && !isEvaluating && <LegalEvaluationDisplay result={legalResult} />}
              </>
            )}
            
            {activeTab === 'compare' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileDropzone title="Văn bản gốc (Bản 1)" file={compareFile1} onFileSelect={setCompareFile1} />
                  <FileDropzone title="Văn bản đối chiếu (Bản 2)" file={compareFile2} onFileSelect={setCompareFile2} />
                </div>
                
                <div className="flex justify-center">
                  <button 
                    onClick={handleStartComparison}
                    disabled={!compareFile1 || !compareFile2 || isComparing}
                    className="px-10 py-4 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-700 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/20 transition-all flex items-center space-x-2"
                  >
                    {isComparing ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Đang so sánh...</span></> : 'Bắt đầu So sánh Chuyên sâu'}
                  </button>
                </div>

                {error && <div className="p-4 bg-red-900/40 border border-red-700 rounded-xl text-red-200 text-center">{error}</div>}
                {isComparing && <Loader message="AI đang đối chiếu từng điều khoản và phân tích rủi ro..." />}
                {comparisonResult && !isComparing && <ComparisonDisplay result={comparisonResult} />}
              </div>
            )}

            {activeTab === 'ocr' && (
               <div className="text-center p-12 text-slate-400 italic bg-slate-900/20 rounded-xl border border-dashed border-slate-700">
                  Tính năng OCR tự động đã được tích hợp vào tab Phân tích và So sánh.
                  <br/>Hệ thống sẽ tự nhận diện nếu bạn tải lên ảnh hoặc PDF scan.
               </div>
            )}
          </div>
        </div>

        <footer className="text-center text-slate-500 text-xs py-10">
          <p className="mb-2">Phát triển bởi <span className="text-sky-500 font-bold">DI-IT</span></p>
          <p className="opacity-60">Dữ liệu được xử lý bởi Gemini 3.0 Flash Enterprise. Thông tin chỉ mang tính chất tham khảo.</p>
        </footer>
      </div>

      <ContractDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={CONTRACT_TYPES.find(c => c.id === selectedContractId)?.name || ''} content={modalContent} isLoading={isModalLoading} error={modalError} />
    </div>
  );
};

export default App;
