
import React from 'react';
import type { ComparisonResult, ComparisonDifference } from '../types.ts';
import { SourcesDisplay } from './ResultsDisplay.tsx';

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

const DiffRow: React.FC<{ diff: ComparisonDifference }> = ({ diff }) => {
  const getChangeStyles = () => {
    switch (diff.changeType) {
      case 'added': return { label: 'Thêm mới', color: 'text-green-400', bg: 'bg-green-900/10' };
      case 'removed': return { label: 'Đã xóa', color: 'text-red-400', bg: 'bg-red-900/10' };
      case 'modified': return { label: 'Sửa đổi', color: 'text-yellow-400', bg: 'bg-yellow-900/10' };
      default: return { label: 'Giữ nguyên', color: 'text-slate-500', bg: 'bg-transparent' };
    }
  };

  const styles = getChangeStyles();

  return (
    <div className={`border-b border-slate-700/50 ${styles.bg} transition-colors hover:bg-slate-700/30`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-2 p-4 border-r border-slate-700/30">
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-current ${styles.color} mb-2 inline-block`}>
            {styles.label}
          </span>
          <p className="text-sm font-bold text-slate-300 break-words">{diff.clause}</p>
        </div>
        <div className="lg:col-span-4 p-4 border-r border-slate-700/30 bg-red-900/5">
          <p className="text-xs text-slate-500 mb-1 font-mono uppercase">Văn bản 1</p>
          <div className="text-sm text-slate-400 italic line-through decoration-red-500/50">{diff.text1 || '(Trống)'}</div>
        </div>
        <div className="lg:col-span-4 p-4 border-r border-slate-700/30 bg-green-900/5">
          <p className="text-xs text-slate-500 mb-1 font-mono uppercase">Văn bản 2</p>
          <div className="text-sm text-slate-100 font-medium">{diff.text2 || '(Trống)'}</div>
        </div>
        <div className="lg:col-span-2 p-4 bg-sky-900/5">
          <p className="text-xs text-sky-500/50 mb-1 font-mono uppercase">Tác động</p>
          <p className="text-xs text-sky-200 leading-relaxed">{diff.legalImpact}</p>
        </div>
      </div>
    </div>
  );
};

const ComparisonDisplay: React.FC<{ result: ComparisonResult }> = ({ result }) => {
  const score = result.similarityScore ?? 0;
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-slate-500 text-xs font-bold uppercase mb-2">Tương đồng</span>
          <div className="text-4xl font-black text-sky-400">{score}%</div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-sky-400 h-full transition-all duration-1000" style={{ width: `${score}%` }}></div>
          </div>
        </div>
        
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 p-6 rounded-2xl">
          <span className="text-slate-500 text-xs font-bold uppercase mb-2">Tóm tắt sự khác biệt</span>
          <p className="text-slate-200 text-sm leading-relaxed mt-1">{result.summary}</p>
          <div className="mt-4 flex items-center">
            <span className="text-slate-400 text-xs mr-2">Khuyên dùng:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
              result.bestVersion === 'file1' ? 'bg-amber-900/20 border-amber-700 text-amber-400' : 
              result.bestVersion === 'file2' ? 'bg-green-900/20 border-green-700 text-green-400' : 
              'bg-slate-700 border-slate-600 text-slate-300'
            }`}>
              {result.bestVersion === 'file1' ? 'Văn bản 1 (An toàn hơn)' : 
               result.bestVersion === 'file2' ? 'Văn bản 2 (Cập nhật tốt hơn)' : 
               'Cả hai tương đương'}
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-900/80 p-4 border-b border-slate-700 flex items-center">
          <div className="w-2 h-6 bg-sky-500 rounded-full mr-3"></div>
          <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Bảng Đối Chiếu Chi Tiết</h3>
        </div>
        <div className="overflow-x-auto">
          {result.differences.length > 0 ? (
            result.differences.map((diff, idx) => <DiffRow key={idx} diff={diff} />)
          ) : (
            <div className="p-10 text-center text-slate-500 italic">Không phát hiện thay đổi đáng kể nào.</div>
          )}
        </div>
      </div>

      {/* Analysis Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
             Nhận xét Pháp lý
          </h3>
          <div className="text-sm text-slate-300 space-y-1">
            {renderSimpleMarkdown(result.legalRemarks)}
          </div>
        </section>

        <section className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
             Hình thức & Ngôn ngữ
          </h3>
          <div className="text-sm text-slate-300 space-y-1">
            {renderSimpleMarkdown(result.formalAssessment)}
          </div>
        </section>
      </div>

      <div className="bg-green-900/10 border border-green-800/50 p-6 rounded-2xl">
        <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center">
           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           Đề xuất Cải thiện
        </h3>
        <div className="text-sm text-slate-200">
           {renderSimpleMarkdown(result.recommendations)}
        </div>
      </div>

      <SourcesDisplay sources={result.sources} />
    </div>
  );
};

export default ComparisonDisplay;
