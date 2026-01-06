
import React from 'react';
import type { OcrResult } from '../types.ts';
import { exportToDocx } from '../utils/docxExporter.ts';

interface OcrResultDisplayProps {
  result: OcrResult;
  translations: any;
  theme: 'dark' | 'light';
  originalFileName: string;
}

const OcrResultDisplay: React.FC<OcrResultDisplayProps> = ({ result, translations, theme, originalFileName }) => {
  const t = translations;

  const handleCopy = () => {
    navigator.clipboard.writeText(result.cleanText);
    alert(t.ocrCopied);
  };

  const handleDownload = async () => {
    try {
      await exportToDocx(result.cleanText, originalFileName);
    } catch (error) {
      console.error("Export error:", error);
      alert("Lỗi khi xuất file Word.");
    }
  };

  const getConfColor = (level: string) => {
    if (level === 'High') return 'text-green-400 bg-green-900/20 border-green-700';
    if (level === 'Medium') return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
    return 'text-red-400 bg-red-900/20 border-red-700';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overview & Quality */}
      <div className={`p-6 rounded-2xl border transition-all ${
        theme === 'dark' ? 'bg-slate-800 border-slate-700 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center">
            <div className="w-2 h-6 bg-sky-500 rounded-full mr-3"></div>
            <h3 className="text-xl font-bold uppercase tracking-tight">{t.ocrReport}</h3>
          </div>
          <div className={`px-4 py-1 rounded-full text-xs font-black border ${getConfColor(result.confidenceLevel)}`}>
            CONFIDENCE: {result.confidenceLevel}
          </div>
        </div>
        <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          {result.qualityReport}
        </p>
      </div>

      {/* Main Text Area */}
      <div className={`rounded-2xl border overflow-hidden ${
        theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-4 border-b flex flex-wrap justify-between items-center gap-4 ${
          theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'
        }`}>
          <h4 className="font-bold text-sky-400 text-sm uppercase">{t.ocrCleanText}</h4>
          <div className="flex gap-2">
            <button 
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
              {t.ocrCopy}
            </button>
            <button 
              onClick={handleDownload}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                theme === 'dark' ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-900/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              {t.ocrDownload}
            </button>
          </div>
        </div>
        <div className={`p-6 max-h-[600px] overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap ${
          theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
        }`}>
          {result.cleanText}
        </div>
      </div>

      {/* Issues & Corrections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border ${
          theme === 'dark' ? 'bg-green-900/10 border-green-800/50' : 'bg-green-50 border-green-200'
        }`}>
          <h4 className="text-green-400 font-bold text-sm uppercase mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {t.ocrFixedErrors}
          </h4>
          <ul className="space-y-2">
            {result.fixedErrors.map((err, i) => (
              <li key={i} className={`text-xs p-2 rounded ${theme === 'dark' ? 'bg-black/20 text-slate-300' : 'bg-white/50 text-slate-600'}`}>
                {err}
              </li>
            ))}
          </ul>
        </div>

        <div className={`p-6 rounded-2xl border ${
          theme === 'dark' ? 'bg-red-900/10 border-red-800/50' : 'bg-red-50 border-red-200'
        }`}>
          <h4 className="text-red-400 font-bold text-sm uppercase mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            {t.ocrManualCheck}
          </h4>
          <ul className="space-y-2">
            {result.checkRequired.map((item, i) => (
              <li key={i} className={`text-xs p-2 rounded border-l-2 border-red-500 ${theme === 'dark' ? 'bg-black/20 text-slate-300' : 'bg-white/50 text-slate-600'}`}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OcrResultDisplay;
