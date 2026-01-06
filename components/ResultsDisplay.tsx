
import React from 'react';
import type { SpellCheckResult, SpellCheckError, FormatError } from '../types.ts';

// Add missing translations and theme to props interface
interface ResultsDisplayProps {
  result: SpellCheckResult;
  translations: any;
  theme: 'dark' | 'light';
}

const highlightError = (context: string, incorrectWord: string): React.ReactNode => {
  if (!context || !incorrectWord) return context;
  
  const regex = new RegExp(`\\b(${incorrectWord})\\b`, 'gi');
  const parts = context.split(regex);
  
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-red-500/50 text-red-100 px-1 rounded mx-[-1px]">
        {part}
      </mark>
    ) : (
      part
    )
  );
};


const ErrorCard: React.FC<{ error: SpellCheckError, theme: 'dark' | 'light' }> = ({ error, theme }) => {
  return (
    <div className={`p-5 rounded-lg border transform transition-transform duration-300 hover:scale-[1.02] ${
      theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-sky-600' : 'bg-white border-slate-200 hover:border-indigo-600 shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
        <div className="text-center sm:text-left mb-3 sm:mb-0">
          <p className="text-lg font-semibold text-red-400">{error.incorrectWord}</p>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto sm:mx-0 my-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
          <p className="text-lg font-semibold text-green-400">{error.correctedWord}</p>
        </div>
        <div className={`flex-1 p-3 rounded-md ${theme === 'dark' ? 'bg-slate-900/50 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
          <span className="text-slate-400 text-sm">Ngữ cảnh: </span>
          <p className="italic">"{highlightError(error.context, error.incorrectWord)}"</p>
        </div>
      </div>
    </div>
  );
};

const FormatErrorCard: React.FC<{ error: FormatError, theme: 'dark' | 'light' }> = ({ error, theme }) => {
  return (
    <div className={`p-5 rounded-lg border transform transition-transform duration-300 hover:scale-[1.02] ${
      theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-amber-600' : 'bg-white border-slate-200 hover:border-amber-500 shadow-sm'
    }`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 pt-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-amber-400">{error.errorType}</p>
          <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}><strong className="text-slate-400">Mô tả:</strong> {error.description}</p>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}><strong className="text-slate-400">Đề xuất:</strong> <span className="text-green-400">{error.recommendation}</span></p>
        </div>
      </div>
    </div>
  );
};

export const SourcesDisplay: React.FC<{ sources: SpellCheckResult['sources'], theme?: 'dark' | 'light' }> = ({ sources, theme = 'dark' }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className={`mt-8 pt-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
      <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Nguồn tham khảo:</h3>
      <ul className="list-disc list-inside space-y-2">
        {sources.map((source, index) => (
          <li key={index} className="text-sm">
            <a
              href={source.web.uri}
              target="_blank"
              rel="noopener noreferrer"
              className={`${theme === 'dark' ? 'text-sky-400 hover:text-sky-300' : 'text-indigo-600 hover:text-indigo-500'} hover:underline`}
              title={source.web.title}
            >
              {source.web.title || source.web.uri}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, translations, theme }) => {
  const hasSpellingErrors = result.errors && result.errors.length > 0;
  const hasFormatErrors = result.formatErrors && result.formatErrors.length > 0;
  const t = translations;

  if (!hasSpellingErrors && !hasFormatErrors) {
    return (
      <>
        <div className={`p-6 border rounded-lg text-center flex items-center justify-center space-x-3 ${
          theme === 'dark' ? 'bg-green-900/50 text-green-200 border-green-700' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-lg font-semibold">Tuyệt vời! Không tìm thấy lỗi chính tả hoặc thể thức nào.</span>
        </div>
        <SourcesDisplay sources={result.sources} theme={theme} />
      </>
    );
  }

  const totalErrors = (result.errors?.length || 0) + (result.formatErrors?.length || 0);

  return (
    <div>
      <div className={`mb-6 p-4 border rounded-lg ${
        theme === 'dark' ? 'bg-yellow-900/40 text-yellow-200 border-yellow-700' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
      }`}>
        <p className="font-semibold">Đã tìm thấy tổng cộng {totalErrors} vấn đề. Vui lòng xem lại các đề xuất dưới đây.</p>
      </div>

      {hasSpellingErrors && (
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-red-400 flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Lỗi Chính tả ({result.errors.length})
          </h3>
          <div className="space-y-4">
            {result.errors.map((error, index) => (
              <ErrorCard key={`spell-${index}`} error={error} theme={theme} />
            ))}
          </div>
        </section>
      )}

      {hasFormatErrors && (
        <section>
           <h3 className="text-xl font-semibold mb-3 text-amber-400 flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Lỗi Thể thức Văn bản ({result.formatErrors.length})
          </h3>
          <div className="space-y-4">
            {result.formatErrors.map((error, index) => (
              <FormatErrorCard key={`format-${index}`} error={error} theme={theme} />
            ))}
          </div>
        </section>
      )}
      
      <SourcesDisplay sources={result.sources} theme={theme} />
    </div>
  );
};

export default ResultsDisplay;
