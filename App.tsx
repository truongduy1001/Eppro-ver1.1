
import React, { useState, useCallback } from 'react';
import { checkVietnameseSpelling, getContractDetails, evaluateContractLegality, compareDocuments, performAdvancedOcr } from './services/geminiService.ts';
import { CONTRACT_TYPES } from './constants.ts';
import type { SpellCheckResult, ContractDetails, LegalEvaluationResult, ComparisonResult, OcrResult } from './types.ts';
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
import OcrResultDisplay from './components/OcrResultDisplay.tsx';
import ExcelCompare from './components/ExcelCompare.tsx';
import CompanyLookup from './components/CompanyLookup.tsx';
import VirusTotalScanner from './components/VirusTotalScanner.tsx';
import VbaUnlocker from './components/VbaUnlocker.tsx';

type ActiveTab = 'analyze' | 'compare' | 'ocr' | 'excel' | 'lookup' | 'scanner' | 'vba';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<ActiveTab>('analyze');
  const [file, setFile] = useState<File | null>(null);
  
  // State cho So sánh văn bản (Tách biệt 2 file)
  const [compareFile1, setCompareFile1] = useState<File | null>(null);
  const [compareFile2, setCompareFile2] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  // State cho OCR
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

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
    setter(`Lỗi: ${msg}`);
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setSpellCheckResult(null);
    setLegalResult(null);
    setError(null);
  };

  const handleStartComparison = useCallback(async () => {
    if (!compareFile1 || !compareFile2) { 
      setError(lang === 'vi' ? "Vui lòng chọn đủ 2 văn bản để so sánh." : "Please select both documents to compare."); 
      return; 
    }
    setIsComparing(true); setError(null); setComparisonResult(null);
    try {
      const result = await compareDocuments([compareFile1, compareFile2], lang);
      setComparisonResult(result);
    } catch (err) { handleError(err, setError); } finally { setIsComparing(false); }
  }, [compareFile1, compareFile2, lang]);

  const handleStartOcr = useCallback(async () => {
    if (!ocrFile) { setError(t.errorNoFile); return; }
    setIsOcrLoading(true); setError(null); setOcrResult(null);
    try {
      const result = await performAdvancedOcr(ocrFile, lang);
      setOcrResult(result);
    } catch (err) { handleError(err, setError); } finally { setIsOcrLoading(false); }
  }, [ocrFile, lang, t.errorNoFile]);

  const handleCheckSpelling = async () => {
    if (!file) return;
    setIsLoading(true); setError(null); setSpellCheckResult(null);
    try {
      const res = await checkVietnameseSpelling(file, selectedContractId, lang);
      setSpellCheckResult(res);
    } catch (err) { handleError(err, setError); } finally { setIsLoading(false); }
  };

  const handleEvaluateLegality = async () => {
    if (!file) return;
    setIsEvaluating(true); setError(null); setLegalResult(null);
    try {
      const res = await evaluateContractLegality(file, selectedContractId, lang);
      setLegalResult(res);
    } catch (err) { handleError(err, setError); } finally { setIsLoading(false); }
  };

  const handleViewDetails = async () => {
    const type = CONTRACT_TYPES.find(t => t.id === selectedContractId);
    if (!type || type.id === 'general') return;
    setIsModalOpen(true); setIsModalLoading(true); setModalContent(null); setModalError(null);
    try {
      const details = await getContractDetails(type.name, lang);
      setModalContent(details);
    } catch (err) { handleError(err, setModalError); } finally { setIsModalLoading(false); }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 flex flex-col p-4 sm:p-8 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <SettingsPanel theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} />

      <div className="max-w-7xl w-full mx-auto pt-12">
        <header className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] uppercase rounded-full border border-sky-500/30 text-sky-400 bg-sky-900/20">
            {t.tagline}
          </div>
          <h1 className="text-6xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-sky-400 to-indigo-400 pb-2 leading-tight">
            {t.appTitle}
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
            {t.appSubtitle}
          </p>
        </header>

        <nav className={`flex flex-wrap p-1 rounded-3xl mb-10 border transition-all ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
          {(['analyze', 'compare', 'ocr', 'excel', 'lookup', 'scanner', 'vba'] as ActiveTab[]).map(tab => (
            <button 
              key={tab} 
              onClick={() => {setActiveTab(tab); setError(null);}} 
              className={`flex-1 min-w-[120px] py-4 px-2 sm:px-6 rounded-2xl font-bold uppercase text-[10px] sm:text-xs tracking-widest transition-all ${
                activeTab === tab 
                  ? (theme === 'dark' ? 'text-white bg-sky-600 shadow-xl shadow-sky-900/40' : 'text-white bg-indigo-600 shadow-lg') 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'analyze' ? t.tabAnalyze : tab === 'compare' ? t.tabCompare : tab === 'ocr' ? t.tabOcr : tab === 'excel' ? t.tabExcel : tab === 'lookup' ? t.tabLookup : tab === 'vba' ? t.tabVba : t.tabScanner}
            </button>
          ))}
        </nav>

        <main className={`rounded-[2.5rem] border shadow-2xl p-8 sm:p-12 mb-12 transition-all ${
          theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-indigo-100'
        }`}>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-700/50 text-red-400 text-sm font-bold text-center">
              {error}
            </div>
          )}

          {activeTab === 'analyze' && (
            <div className="space-y-8">
              <ContractTypeSelector 
                selectedType={selectedContractId} 
                onTypeChange={setSelectedContractId} 
                contractTypes={CONTRACT_TYPES} 
                onViewDetails={handleViewDetails}
                translations={t}
                theme={theme}
              />
              <FileUpload file={file} onFileSelect={handleFileSelect} onCheck={handleCheckSpelling} onEvaluate={handleEvaluateLegality} isLoading={isLoading} isEvaluating={isEvaluating} translations={t} theme={theme} />
              {spellCheckResult && <ResultsDisplay result={spellCheckResult} translations={t} theme={theme} />}
              {legalResult && <LegalEvaluationDisplay result={legalResult} translations={t} theme={theme} />}
            </div>
          )}
          
          {activeTab === 'compare' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest px-2">{t.file1Label}</h3>
                  <FileDropzone 
                    title={t.uploadTitle} 
                    file={compareFile1} 
                    onFileSelect={(f) => { setCompareFile1(f); setComparisonResult(null); }} 
                    theme={theme} 
                    translations={t} 
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest px-2">{t.file2Label}</h3>
                  <FileDropzone 
                    title={t.uploadTitle} 
                    file={compareFile2} 
                    onFileSelect={(f) => { setCompareFile2(f); setComparisonResult(null); }} 
                    theme={theme} 
                    translations={t} 
                  />
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <button 
                  onClick={handleStartComparison}
                  disabled={!compareFile1 || !compareFile2 || isComparing}
                  className={`px-12 py-5 font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl transition-all ${
                    isComparing ? 'bg-slate-800 text-slate-500' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-900/40'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isComparing ? t.comparingFiles : t.btnCompare}
                </button>
              </div>

              {isComparing && <Loader message={t.loadingComparing} theme={theme} />}
              {comparisonResult && <ComparisonDisplay result={comparisonResult} translations={t} theme={theme} />}
            </div>
          )}

          {activeTab === 'ocr' && (
            <div className="space-y-10">
              <FileDropzone title="Tải ảnh hoặc PDF Scan" file={ocrFile} onFileSelect={setOcrFile} theme={theme} translations={t} acceptedFormats="ocr" />
              <div className="flex justify-center">
                <button onClick={handleStartOcr} disabled={!ocrFile || isOcrLoading} className="px-12 py-5 font-black uppercase text-xs tracking-[0.2em] rounded-2xl bg-sky-600 hover:bg-sky-500 text-white">
                   {isOcrLoading ? 'Đang trích xuất...' : t.btnStartOcr}
                </button>
              </div>
              {isOcrLoading && <Loader message={t.ocrProcessing} theme={theme} />}
              {ocrResult && <OcrResultDisplay result={ocrResult} translations={t} theme={theme} originalFileName={ocrFile?.name || 'ocr'} />}
            </div>
          )}

          {activeTab === 'excel' && (
            <ExcelCompare theme={theme} translations={t} />
          )}

          {activeTab === 'lookup' && (
            <CompanyLookup theme={theme} />
          )}

          {activeTab === 'scanner' && (
            <VirusTotalScanner theme={theme} />
          )}

          {activeTab === 'vba' && (
            <VbaUnlocker theme={theme} />
          )}
        </main>

        <footer className="text-center pb-12">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mb-3">
            Develop by <span className="text-red-500">DI-IT</span> Department
          </p>
          <p className="text-red-500 text-[10px] font-bold uppercase tracking-[0.1em] mb-3 animate-pulse">
            Big upgrade database , metadata 08/01/2026
          </p>
          <p className="text-slate-600 text-[10px] uppercase opacity-50">{t.footerDisclaimer}</p>
        </footer>
      </div>

      <ContractDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={CONTRACT_TYPES.find(t => t.id === selectedContractId)?.name || ''} 
        content={modalContent} 
        isLoading={isModalLoading} 
        error={modalError} 
        theme={theme} 
      />
    </div>
  );
};

export default App;
