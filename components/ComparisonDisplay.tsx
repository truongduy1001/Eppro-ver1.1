
import React from 'react';
import type { ComparisonResult, ComparisonDifference } from '../types.ts';
import { SourcesDisplay } from './ResultsDisplay.tsx';

interface ComparisonDisplayProps {
  result: ComparisonResult;
  translations: any;
  theme: 'dark' | 'light';
}

// Hàm parse markdown đơn giản để hiển thị nhận xét
const renderSimpleMarkdown = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      return <li key={i} className="ml-4 mb-1">{line.substring(2)}</li>;
    }
    if (trimmedLine.startsWith('### ')) {
      return <h4 key={i} className="text-sky-400 font-bold mt-4 mb-2">{line.substring(4)}</h4>;
    }
    if (trimmedLine === '') return <br key={i} />;
    return <p key={i} className="mb-2">{line}</p>;
  });
};

const DiffRow: React.FC<{ diff: ComparisonDifference, theme: 'dark' | 'light' }> = ({ diff, theme }) => {
  const getChangeStyles = () => {
    switch (diff.changeType) {
      case 'added': return { label: 'Thêm mới', color: 'text-green-400', bg: theme === 'dark' ? 'bg-green-900/10' : 'bg-green-50' };
      case 'removed': return { label: 'Đã xóa', color: 'text-red-400', bg: theme === 'dark' ? 'bg-red-900/10' : 'bg-red-50' };
      case 'modified': return { label: 'Sửa đổi', color: 'text-yellow-400', bg: theme === 'dark' ? 'bg-yellow-900/10' : 'bg-yellow-50' };
      default: return { label: 'Giữ nguyên', color: 'text-slate-500', bg: 'bg-transparent' };
    }
  };

  const styles = getChangeStyles();

  return (
    <div className={`border-b transition-colors hover:bg-slate-700/30 ${styles.bg} ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className={`lg:col-span-2 p-4 border-r ${theme === 'dark' ? 'border-slate-700/30' : 'border-slate-200'}`}>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-current ${styles.color} mb-2 inline-block`}>
            {styles.label}
          </span>
          <p className={`text-sm font-bold break-words ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{diff.clause}</p>
        </div>
        <div className={`lg:col-span-4 p-4 border-r ${theme === 'dark' ? 'border-slate-700/30 bg-red-900/5' : 'border-slate-200 bg-red-50/30'}`}>
          <p className="text-xs text-slate-500 mb-1 font-mono uppercase">Văn bản 1</p>
          <div className="text-sm text-slate-400 italic line-through decoration-red-500/50">{diff.text1 || '(Trống)'}</div>
        </div>
        <div className={`lg:col-span-4 p-4 border-r ${theme === 'dark' ? 'border-slate-700/30 bg-green-900/5' : 'border-slate-200 bg-green-50/30'}`}>
          <p className="text-xs text-slate-500 mb-1 font-mono uppercase">Văn bản 2</p>
          <div className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{diff.text2 || '(Trống)'}</div>
        </div>
        <div className={`lg:col-span-2 p-4 ${theme === 'dark' ? 'bg-sky-900/5' : 'bg-sky-50/30'}`}>
          <p className="text-xs text-sky-500/50 mb-1 font-mono uppercase">Tác động</p>
          <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-sky-200' : 'text-sky-800'}`}>{diff.legalImpact}</p>
        </div>
      </div>
    </div>
  );
};

const ComparisonDisplay: React.FC<ComparisonDisplayProps> = ({ result, translations, theme }) => {
  const score = result.similarityScore ?? 0;
  const t = translations;
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`border p-6 rounded-2xl flex flex-col items-center justify-center transition-colors ${
          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className="text-slate-500 text-xs font-bold uppercase mb-2">{t.similarity || 'Tương đồng'}</span>
          <div className={`text-4xl font-black ${theme === 'dark' ? 'text-sky-400' : 'text-indigo-600'}`}>{score}%</div>
          <div className={`w-full h-1.5 rounded-full mt-4 overflow-hidden ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
            <div className={`h-full transition-all duration-1000 ${theme === 'dark' ? 'bg-sky-400' : 'bg-indigo-600'}`} style={{ width: `${score}%` }}></div>
          </div>
        </div>
        
        <div className={`md:col-span-2 border p-6 rounded-2xl transition-colors ${
          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className="text-slate-500 text-xs font-bold uppercase mb-2">{t.summaryDiff || 'Tóm tắt sự khác biệt'}</span>
          <p className={`text-sm leading-relaxed mt-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{result.summary}</p>
          <div className="mt-4 flex items-center">
            <span className="text-slate-400 text-xs mr-2">{t.bestVersion || 'Khuyên dùng'}:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
              result.bestVersion === 'file1' ? 'bg-amber-900/20 border-amber-700 text-amber-400' : 
              result.bestVersion === 'file2' ? 'bg-green-900/20 border-green-700 text-green-400' : 
              'bg-slate-700 border-slate-600 text-slate-300'
            }`}>
              {result.bestVersion === 'file1' ? (t.lang === 'en' ? 'Document 1' : 'Văn bản 1 (An toàn hơn)') : 
               result.bestVersion === 'file2' ? (t.lang === 'en' ? 'Document 2' : 'Văn bản 2 (Cập nhật tốt hơn)') : 
               (t.lang === 'en' ? 'Both equal' : 'Cả hai tương đương')}
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors ${
        theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-4 border-b flex items-center ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`w-2 h-6 rounded-full mr-3 ${theme === 'dark' ? 'bg-sky-500' : 'bg-indigo-600'}`}></div>
          <h3 className={`text-lg font-bold uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.tableTitle || 'Bảng Đối Chiếu Chi Tiết'}</h3>
        </div>
        <div className="overflow-x-auto">
          {result.differences.length > 0 ? (
            result.differences.map((diff, idx) => <DiffRow key={idx} diff={diff} theme={theme} />)
          ) : (
            <div className="p-10 text-center text-slate-500 italic">Không phát hiện thay đổi đáng kể nào.</div>
          )}
        </div>
      </div>

      {/* Analysis Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className={`border p-6 rounded-2xl transition-colors ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
             {t.legalRemarks || 'Nhận xét Pháp lý'}
          </h3>
          <div className={`text-sm space-y-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            {renderSimpleMarkdown(result.legalRemarks)}
          </div>
        </section>

        <section className={`border p-6 rounded-2xl transition-colors ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
             {t.formalAssessment || 'Hình thức & Ngôn ngữ'}
          </h3>
          <div className={`text-sm space-y-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            {renderSimpleMarkdown(result.formalAssessment)}
          </div>
        </section>
      </div>

      <div className={`border p-6 rounded-2xl transition-colors ${theme === 'dark' ? 'bg-green-900/10 border-green-800/50' : 'bg-green-50 border-green-200'}`}>
        <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center">
           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           {t.recommendations || 'Đề xuất Cải thiện'}
        </h3>
        <div className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
           {renderSimpleMarkdown(result.recommendations)}
        </div>
      </div>

      <SourcesDisplay sources={result.sources} theme={theme} />
    </div>
  );
};

export default ComparisonDisplay;
