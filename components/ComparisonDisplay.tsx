
import React from 'react';
import type { ComparisonResult, ComparisonDifference } from '../types.ts';
import { SourcesDisplay } from './ResultsDisplay.tsx';

interface ComparisonDisplayProps {
  result: ComparisonResult;
  translations: any;
  theme: 'dark' | 'light';
}

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
    return <p key={i} className="mb-2 leading-relaxed">{line}</p>;
  });
};

const DiffRow: React.FC<{ diff: ComparisonDifference, theme: 'dark' | 'light' }> = ({ diff, theme }) => {
  const getStyles = () => {
    switch (diff.changeType) {
      case 'added': return { label: 'THÊM MỚI', color: 'text-green-400', bg: 'bg-green-900/10' };
      case 'removed': return { label: 'LƯỢC BỎ', color: 'text-red-400', bg: 'bg-red-900/10' };
      case 'modified': return { label: 'CHỈNH SỬA', color: 'text-yellow-400', bg: 'bg-yellow-900/10' };
      default: return { label: 'GIỮ NGUYÊN', color: 'text-slate-500', bg: 'bg-transparent' };
    }
  };

  const s = getStyles();

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 border-b transition-colors ${theme === 'dark' ? 'border-slate-700/50 hover:bg-slate-800' : 'border-slate-100 hover:bg-slate-50'} ${s.bg}`}>
      <div className="lg:col-span-3 p-4 border-r border-slate-700/30">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${s.color} border-current mb-2 inline-block`}>
          {s.label}
        </span>
        <p className="font-bold text-sm text-slate-200">{diff.clause}</p>
      </div>
      <div className="lg:col-span-6 p-4 border-r border-slate-700/30">
        <p className="text-sm text-slate-300">{diff.description}</p>
      </div>
      <div className="lg:col-span-3 p-4 bg-sky-900/5">
        <p className="text-xs font-bold text-sky-500 mb-1 uppercase tracking-tighter">Tác động pháp lý</p>
        <p className="text-xs text-sky-200 leading-normal italic">{diff.impact}</p>
      </div>
    </div>
  );
};

const ComparisonDisplay: React.FC<ComparisonDisplayProps> = ({ result, translations, theme }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* I. Tóm tắt nhanh */}
      <section className={`p-8 rounded-3xl border shadow-2xl ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center mb-6">
          <div className="w-1.5 h-8 bg-sky-500 rounded-full mr-4 shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-white">I. Tóm tắt nhanh sự khác biệt chính</h3>
        </div>
        <div className={`text-base leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
          {result.summary}
        </div>
      </section>

      {/* II. Bảng so sánh chi tiết */}
      <section className={`rounded-3xl border overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className={`p-5 border-b flex items-center ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
           <h3 className="text-lg font-black uppercase text-sky-400">II. Bảng so sánh chi tiết</h3>
        </div>
        <div className="overflow-x-auto">
          {result.detailedTable.length > 0 ? (
            result.detailedTable.map((diff, idx) => <DiffRow key={idx} diff={diff} theme={theme} />)
          ) : (
            <div className="p-20 text-center text-slate-500 italic">Không có khác biệt đáng kể nào được phát hiện.</div>
          )}
        </div>
      </section>

      {/* III. Nhận xét pháp lý & IV. Đề xuất */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className={`p-8 rounded-3xl border shadow-xl ${theme === 'dark' ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
          <h3 className="text-xl font-black text-red-400 mb-4 uppercase">III. Nhận xét pháp lý</h3>
          <div className={`text-sm space-y-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            {renderSimpleMarkdown(result.legalRemarks)}
          </div>
        </section>

        <section className={`p-8 rounded-3xl border shadow-xl ${theme === 'dark' ? 'bg-green-900/10 border-green-900/30' : 'bg-green-50 border-green-100'}`}>
          <h3 className="text-xl font-black text-green-400 mb-4 uppercase">IV. Đề xuất & Lưu ý quan trọng</h3>
          <div className={`text-sm space-y-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            {renderSimpleMarkdown(result.recommendations)}
          </div>
        </section>
      </div>

      {result.sources && <SourcesDisplay sources={result.sources} theme={theme} />}
    </div>
  );
};

export default ComparisonDisplay;
