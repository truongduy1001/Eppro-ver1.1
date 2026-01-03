
import React, { useState, useCallback } from 'react';
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

type ActiveTab = 'analyze' | 'compare' | 'ocr';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('analyze');
  
  // === TABS STYLES ===
  const getTabStyle = (tabName: ActiveTab) => {
    return activeTab === tabName
      ? 'bg-sky-600 text-white shadow-md'
      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50';
  };

  // === SINGLE FILE ANALYSIS STATE ===
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
  
  // === DOCUMENT COMPARISON STATE ===
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // === OCR STATE ===
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);


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
    setLoadingMessage('Đang tải tệp lên và phân tích...');
    setError(null);
    setSpellCheckResult(null);
    setLegalResult(null);

    try {
      const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
      const contractName = selectedContract ? selectedContract.name : CONTRACT_TYPES[0].name;
      
      const result = await checkVietnameseSpelling(file, contractName);
      setSpellCheckResult(result);
    } catch (err) {
      console.error('Error during spell check process:', err);
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
      setError(`Lỗi: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [file, selectedContractId]);
  
  const handleEvaluateLegality = useCallback(async () => {
    if (!file) {
      setError('Vui lòng chọn một tệp.');
      return;
    }
    setIsEvaluating(true);
    setLoadingMessage('Đang tải tệp lên và phân tích...');
    setError(null);
    setSpellCheckResult(null);
    setLegalResult(null);

    try {
        const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
        const contractName = selectedContract ? selectedContract.name : CONTRACT_TYPES[0].name;
        
        const result = await evaluateContractLegality(file, contractName);
        setLegalResult(result);
    } catch (err) {
        console.error('Error during legal evaluation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
        setError(`Lỗi phân tích: ${errorMessage}`);
    } finally {
        setIsEvaluating(false);
        setLoadingMessage('');
    }
  }, [file, selectedContractId]);
  
  const handleViewDetails = useCallback(async () => {
    const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
    if (!selectedContract || selectedContract.id === 'general') return;

    setIsModalOpen(true);
    setIsModalLoading(true);
    setModalError(null);
    setModalContent(null);

    try {
      const details = await getContractDetails(selectedContract.name);
      setModalContent(details);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
      setModalError(`Không thể tải chi tiết hợp đồng: ${errorMessage}`);
    } finally {
      setIsModalLoading(false);
    }
  }, [selectedContractId]);

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const handleCompare = useCallback(async () => {
      if (!file1 || !file2) {
        setComparisonError("Vui lòng tải lên cả hai tệp để so sánh.");
        return;
      }
      setComparisonError(null);
      setComparisonResult(null);
      setIsComparing(true);
      setLoadingMessage("Đang tải tệp lên và so sánh...");
      
      try {
        const result = await compareDocuments(file1, file2);
        setComparisonResult(result);
      } catch (err) {
        console.error('Error during comparison:', err);
        const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
        setComparisonError(`Lỗi so sánh: ${errorMessage}`);
      } finally {
        setIsComparing(false);
        setLoadingMessage('');
      }
  }, [file1, file2]);

  const handlePerformOcr = useCallback(async () => {
      if (!ocrFile) {
          setOcrError("Vui lòng chọn một tệp ảnh hoặc PDF.");
          return;
      }
      setOcrError(null);
      setOcrResult(null);
      setIsOcrLoading(true);
      setLoadingMessage('Đang tải tệp lên và nhận dạng ký tự...');

      try {
          const result = await performOcr(ocrFile);
          setOcrResult(result.text);
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
          setOcrError(`Lỗi OCR: ${errorMessage}`);
      } finally {
          setIsOcrLoading(false);
          setLoadingMessage('');
      }
  }, [ocrFile]);


  const selectedContractName = CONTRACT_TYPES.find(c => c.id === selectedContractId)?.name || 'Chi tiết Hợp đồng';

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
        <div className="w-full max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
              Trợ lý Pháp lý AI
            </h1>
            <p className="mt-3 text-lg text-slate-400">
              Phân tích, đánh giá, so sánh hợp đồng và các tài liệu pháp lý.
            </p>
          </header>

          <main className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-700">
             <div className="flex p-2 bg-slate-900/40 rounded-t-2xl border-b border-slate-700">
                <button onClick={() => setActiveTab('analyze')} className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${getTabStyle('analyze')}`}>
                  Phân tích File Đơn
                </button>
                <button onClick={() => setActiveTab('compare')} className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${getTabStyle('compare')}`}>
                  So sánh 2 File
                </button>
                <button onClick={() => setActiveTab('ocr')} className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${getTabStyle('ocr')}`}>
                  Nhận dạng ký tự (OCR)
                </button>
             </div>

            {activeTab === 'analyze' && (
              <div className="p-6 sm:p-8">
                <ContractTypeSelector
                  selectedType={selectedContractId}
                  onTypeChange={setSelectedContractId}
                  contractTypes={CONTRACT_TYPES}
                  onViewDetails={handleViewDetails}
                />
                <FileUpload
                  file={file}
                  onFileSelect={handleFileSelect}
                  onCheck={handleCheckSpelling}
                  onEvaluate={handleEvaluateLegality}
                  isLoading={isLoading}
                  isEvaluating={isEvaluating}
                />
                {error && (
                  <div className="mt-6 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg text-center">
                    {error}
                  </div>
                )}
                {(isLoading || isEvaluating) && <Loader message={loadingMessage}/>}
                {spellCheckResult && !isLoading && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-100 border-b border-slate-700 pb-2">Kết quả phân tích Chính tả & Thể thức</h2>
                    <ResultsDisplay result={spellCheckResult} />
                  </div>
                )}
                {legalResult && !isEvaluating && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-100 border-b border-slate-700 pb-2">Kết quả Phân tích Lỗ hổng Pháp lý</h2>
                    <LegalEvaluationDisplay result={legalResult} />
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'compare' && (
               <div className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <FileDropzone file={file1} onFileSelect={setFile1} title="Tài liệu 1" acceptedFormats="documents" />
                    <FileDropzone file={file2} onFileSelect={setFile2} title="Tài liệu 2" acceptedFormats="documents" />
                  </div>
                   <div className="flex justify-center">
                      <button
                        onClick={handleCompare}
                        disabled={!file1 || !file2 || isComparing}
                        className="w-full sm:w-auto px-10 py-3 text-base font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-300"
                      >
                        {isComparing ? 'Đang so sánh...' : 'So sánh'}
                      </button>
                   </div>
                   {comparisonError && (
                      <div className="mt-6 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg text-center">
                          {comparisonError}
                      </div>
                   )}
                   {isComparing && <Loader message={loadingMessage}/>}
                   {comparisonResult && !isComparing && (
                      <div className="mt-8">
                        <h2 className="text-2xl font-semibold mb-4 text-slate-100 border-b border-slate-700 pb-2">Kết quả So sánh</h2>
                        <ComparisonDisplay result={comparisonResult}/>
                      </div>
                   )}
               </div>
            )}

            {activeTab === 'ocr' && (
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-semibold mb-4 text-center text-slate-100">Trích xuất văn bản từ Ảnh &amp; PDF được quét (OCR)</h2>
                <p className="text-center text-slate-400 mb-6 max-w-2xl mx-auto">
                  Công cụ này sử dụng công nghệ Nhận dạng Ký tự Quang học (OCR) để "đọc" và trích xuất văn bản từ các tệp ảnh (PNG, JPG) hoặc các tệp PDF không thể sao chép văn bản (tài liệu được quét). Hoàn hảo để số hóa tài liệu giấy.
                </p>
                <div className="max-w-xl mx-auto">
                    <FileDropzone file={ocrFile} onFileSelect={setOcrFile} title="Tải ảnh hoặc PDF lên" acceptedFormats="ocr" />
                </div>
                <div className="flex justify-center mt-6">
                    <button
                        onClick={handlePerformOcr}
                        disabled={!ocrFile || isOcrLoading}
                        className="w-full sm:w-auto px-10 py-3 text-base font-semibold text-white bg-teal-600 rounded-lg shadow-md hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-300"
                    >
                        {isOcrLoading ? 'Đang nhận dạng...' : 'Trích xuất văn bản'}
                    </button>
                </div>
                {ocrError && (
                    <div className="mt-6 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg text-center">
                        {ocrError}
                    </div>
                )}
                {isOcrLoading && <Loader message={loadingMessage} />}
                {ocrResult && !isOcrLoading && (
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4 text-slate-100">Văn bản đã nhận dạng:</h3>
                        <div className="relative">
                            <textarea
                                readOnly
                                value={ocrResult}
                                className="w-full h-64 p-4 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:ring-sky-500 focus:border-sky-500 font-mono"
                                aria-label="Văn bản đã nhận dạng"
                            />
                            <button
                                onClick={() => navigator.clipboard.writeText(ocrResult)}
                                className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold text-sky-200 bg-sky-800/70 rounded-md hover:bg-sky-700 transition-colors"
                                title="Sao chép vào clipboard"
                            >
                                Sao chép
                            </button>
                        </div>
                    </div>
                )}
              </div>
            )}
          </main>

          <footer className="text-center mt-8 text-slate-500 text-sm">
            <p>
              Cung cấp bởi AI <span className="text-red-700 font-bold">(DI-IT)</span>. Phân tích AI lấy từ nguồn API cổng thông tin Quốc Gia.
            </p>
          </footer>
        </div>
      </div>
      <ContractDetailsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedContractName}
        content={modalContent}
        isLoading={isModalLoading}
        error={modalError}
      />
    </>
  );
};

export default App;
