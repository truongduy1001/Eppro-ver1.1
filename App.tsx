
import React, { useState, useCallback, useEffect } from 'react';
import { checkVietnameseSpelling, getContractDetails, evaluateContractLegality, compareDocuments } from './services/geminiService.ts';
import { CONTRACT_TYPES } from './constants.ts';
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult } from './types.ts';
import { translations } from './translations.ts';
import FileUpload from './components/FileUpload.tsx';
import FileDropzone from './components/FileDropzone.tsx';
import ResultsDisplay from './components/ResultsDisplay.tsx';
import Loader from './components/Loader.tsx';
import ContractTypeSelector from './components/ContractTypeSelector.tsx';
import ContractDetailsModal from './components/ContractDetailsModal.tsx';
import LegalEvaluationDisplay from './components/LegalEvaluationDisplay.tsx';
import ComparisonDisplay from './components/ComparisonDisplay.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';

type ActiveTab = 'analyze' | 'compare' | 'ocr';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const t = translations[lang];

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
      setter(lang === 'vi' ? "Lỗi: Không tìm thấy API Key hoặc Key không hợp lệ." : "Error: API Key not found or invalid.");
    } else {
      setter(`${lang === 'vi' ? 'Lỗi hệ thống' : 'System error'}: ${msg}`);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setSpellCheckResult(null);
    setLegalResult(null);
    setError(null);
  };
  
  const handleCheckSpelling = useCallback(async () => {
    if (!file) { setError(t.errorNoFile); return; }
    setIsLoading(true); setError(null);
    try {
      const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
      const result = await checkVietnameseSpelling(file, selectedContract?.name || 'Chung', lang);
      setSpellCheckResult(result);
    } catch (err) { handleError(err, setError); } finally { setIsLoading(false); }
  }, [file, selectedContractId, lang]);
  
  const handleEvaluateLegality = useCallback(async () => {
    if (!file) { setError(t.errorNoFile); return; }
    setIsEvaluating(true); setError(null);
    try {
        const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
        const result = await evaluateContractLegality(file, selectedContract?.name || 'Chung', lang);
        setLegalResult(result);
    } catch (err) { handleError(err, setError); } finally { setIsEvaluating(false); }
  }, [file, selectedContractId, lang]);

  const handleStartComparison = useCallback(async () => {
    if (!compareFile1 || !compareFile2) { setError(t.errorNoFiles); return; }
    setIsComparing(true); setError(null); setComparisonResult(null);
    try {
      const result = await compareDocuments(compareFile1, compareFile2, lang);
      setComparisonResult(result);
    } catch (err) { handleError(err, setError); } finally { setIsComparing(false); }
  }, [compareFile1, compareFile2, lang]);

  const handleViewDetails = useCallback(async () => {
    const selectedContract = CONTRACT_TYPES.find(c => c.id === selectedContractId);
    if (!selectedContract || selectedContract.id === 'general') return;
    setIsModalOpen(true); setIsModalLoading(true); setModalError(null);
    try {
      const details = await getContractDetails(selectedContract.name, lang);
      setModalContent(details);
    } catch (err) { handleError(err, setModalError); } finally { setIsModalLoading(false); }
  }, [selectedContractId, lang]);

  return (
    <div className={`min-h-screen transition-colors duration-500 flex flex-col p-4 sm:p-8 ${
      theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <SettingsPanel theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} />

      <div className="max-w-5xl mx-auto w-full pt-12 sm:pt-0">
        <header className="text-center mb-10">
          <div className={`inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest uppercase rounded-full border transition-all ${
            theme === 'dark' ? 'text-sky-400 bg-sky-900/30 border-sky-800' : 'text-indigo-600 bg-indigo-50 border-indigo-200'
          }`}>
            {t.tagline}
          </div>
          <h1 className={`text-5xl font-black mb-3 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t.appTitle}
          </h1>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} max-w-lg mx-auto font-medium`}>
            {t.appSubtitle}
          </p>
        </header>

        <div className={`rounded-3xl border shadow-2xl overflow-hidden mb-8 ring-1 transition-all ${
          theme === 'dark' ? 'bg-slate-800 border-slate-700 ring-white/5' : 'bg-white border-slate-200 ring-black/5'
        }`}>
          <div className={`flex p-1 border-b transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <button onClick={() => {setActiveTab('analyze'); setError(null);}} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${
              activeTab === 'analyze' 
                ? (theme === 'dark' ? 'text-sky-400 bg-slate-800 shadow-lg' : 'text-indigo-600 bg-white shadow-md') 
                : (theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
            }`}>
              {t.tabAnalyze}
            </button>
            <button onClick={() => {setActiveTab('compare'); setError(null);}} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${
              activeTab === 'compare' 
                ? (theme === 'dark' ? 'text-sky-400 bg-slate-800 shadow-lg' : 'text-indigo-600 bg-white shadow-md') 
                : (theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
            }`}>
              {t.tabCompare}
            </button>
            <button onClick={() => {setActiveTab('ocr'); setError(null);}} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${
              activeTab === 'ocr' 
                ? (theme === 'dark' ? 'text-sky-400 bg-slate-800 shadow-lg' : 'text-indigo-600 bg-white shadow-md') 
                : (theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
            }`}>
              {t.tabOcr}
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'analyze' && (
              <>
                <ContractTypeSelector 
                  selectedType={selectedContractId} 
                  onTypeChange={setSelectedContractId} 
                  contractTypes={CONTRACT_TYPES} 
                  onViewDetails={handleViewDetails}
                  translations={t}
                  theme={theme}
                />
                <FileUpload 
                  file={file} 
                  onFileSelect={handleFileSelect} 
                  onCheck={handleCheckSpelling} 
                  onEvaluate={handleEvaluateLegality} 
                  isLoading={isLoading} 
                  isEvaluating={isEvaluating}
                  translations={t}
                  theme={theme}
                />
                {error && <div className={`mt-6 p-4 border rounded-xl text-center font-medium animate-pulse ${
                  theme === 'dark' ? 'bg-red-900/40 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-600'
                }`}>{error}</div>}
                {(isLoading || isEvaluating) && <Loader message={isLoading ? t.loadingSpelling : t.loadingLegality} theme={theme} />}
                {spellCheckResult && !isLoading && <ResultsDisplay result={spellCheckResult} translations={t} theme={theme} />}
                {legalResult && !isEvaluating && <LegalEvaluationDisplay result={legalResult} translations={t} theme={theme} />}
              </>
            )}
            
            {activeTab === 'compare' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileDropzone title={t.file1Label} file={compareFile1} onFileSelect={setCompareFile1} theme={theme} translations={t} />
                  <FileDropzone title={t.file2Label} file={compareFile2} onFileSelect={setCompareFile2} theme={theme} translations={t} />
                </div>
                
                <div className="flex justify-center">
                  <button 
                    onClick={handleStartComparison}
                    disabled={!compareFile1 || !compareFile2 || isComparing}
                    className={`px-10 py-4 font-bold rounded-2xl shadow-xl transition-all flex items-center space-x-2 ${
                      isComparing 
                        ? 'bg-slate-700 text-slate-400' 
                        : (theme === 'dark' ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20')
                    }`}
                  >
                    {isComparing ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>{t.comparingFiles}</span></> : t.btnCompare}
                  </button>
                </div>

                {error && <div className={`p-4 border rounded-xl text-center ${theme === 'dark' ? 'bg-red-900/40 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-600'}`}>{error}</div>}
                {isComparing && <Loader message={t.loadingComparing} theme={theme} />}
                {comparisonResult && !isComparing && <ComparisonDisplay result={comparisonResult} translations={t} theme={theme} />}
              </div>
            )}

            {activeTab === 'ocr' && (
               <div className={`text-center p-12 italic rounded-xl border border-dashed transition-all ${
                 theme === 'dark' ? 'text-slate-400 bg-slate-900/20 border-slate-700' : 'text-slate-500 bg-slate-50 border-slate-300'
               }`}>
                  {t.ocrInfo}
               </div>
            )}
          </div>
        </div>

        <footer className={`text-center text-xs py-10 transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          <p className="mb-2">{t.footerDev} <span className={theme === 'dark' ? 'text-sky-500 font-bold' : 'text-indigo-600 font-bold'}>DI-IT</span></p>
          <p className="text-red-600 font-bold mb-2">Big upgrade database 06/01/2026 Ver 1.2</p>
          <p className="opacity-60">{t.footerDisclaimer}</p>
        </footer>
      </div>

      <ContractDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={CONTRACT_TYPES.find(c => c.id === selectedContractId)?.name || ''} 
        content={modalContent} 
        isLoading={isModalLoading} 
        error={modalError} 
        theme={theme}
      />
    </div>
  );
};

export default App;
