
import React from 'react';
import type { ComparisonResult } from '../types.ts';

const SimilarityScore: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (s: number) => {
    if (s >= 85) return 'bg-green-500';
    if (s >= 50) return 'bg-yellow-500';
    return 'bg-sky-500';
  };

  return (
    <div className="w-full bg-slate-700 rounded-full h-8 border border-slate-600">
      <div
        className={`${getScoreColor(score)} h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-1000 ease-out`}
        style={{ width: `${score}%` }}
      >
       {score > 10 && `${score}%`} 
      </div>
       {score <= 10 && <span className="absolute w-full text-center left-0 top-1.5 text-white font-bold text-sm">{score}%</span>}
    </div>
  );
};


const ComparisonDisplay: React.FC<{ result: ComparisonResult }> = ({ result }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Mức độ Tương đồng</h3>
        <SimilarityScore score={result.similarityScore} />
        <p className="text-center text-sm text-slate-400 mt-4 max-w-md">
            Điểm số này thể hiện phần trăm nội dung giống nhau giữa hai tài liệu.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-100">Các đoạn văn bản giống nhau</h3>
        {result.matches.length > 0 ? (
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
             <div className="grid grid-cols-2">
                <div className="p-3 font-semibold text-slate-300 bg-slate-800/70 border-b border-r border-slate-700">Tài liệu 1</div>
                <div className="p-3 font-semibold text-slate-300 bg-slate-800/70 border-b border-slate-700">Tài liệu 2</div>
             </div>
             {result.matches.map((match, index) => (
                <div key={index} className="grid grid-cols-2 text-sm">
                    <div className="p-4 border-r border-slate-700 text-slate-300">{match.textFromFile1}</div>
                    <div className="p-4 text-slate-300">{match.textFromFile2}</div>
                </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-400">Không tìm thấy đoạn văn bản nào giống nhau giữa hai tài liệu.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonDisplay;