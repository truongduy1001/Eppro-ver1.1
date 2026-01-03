
import React from 'react';
import type { LegalEvaluationResult, LegalFeedbackItem } from '../types.ts';
import { SourcesDisplay } from './ResultsDisplay.tsx';

const ScoreDisplay: React.FC<{ score: number }> = ({ score }) => {
  const safeScore = typeof score === 'number' && !isNaN(score) ? Math.min(100, Math.max(0, score)) : 0;
  
  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-green-400';
    if (s >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle className="text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
        <circle
          className={`${getScoreColor(safeScore)} transition-all duration-1000 ease-out`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${getScoreColor(safeScore)}`}>{safeScore}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
};

const FeedbackCard: React.FC<{ item: LegalFeedbackItem }> = ({ item }) => {
    if (!item) return null;
    
    const type = String(item.type || 'suggestion').toLowerCase();
    
    const typeStyles: Record<string, any> = {
        suggestion: { borderColor: 'border-sky-700', bgColor: 'bg-sky-900/30', titleColor: 'text-sky-400', label: 'Gợi ý' },
        warning: { borderColor: 'border-yellow-600', bgColor: 'bg-yellow-900/30', titleColor: 'text-yellow-400', label: 'Cảnh báo' },
        critical: { borderColor: 'border-red-600', bgColor: 'bg-red-900/30', titleColor: 'text-red-400', label: 'Nghiêm trọng' },
    };

    const styles = typeStyles[type] || typeStyles.suggestion;

    return (
        <div className={`border-l-4 ${styles.borderColor} ${styles.bgColor} p-4 rounded-r-lg mb-4 shadow-sm`}>
            <div className={`flex items-center text-lg font-semibold ${styles.titleColor} mb-2`}>
                <span className="uppercase text-xs font-bold px-2 py-1 rounded bg-black/20 mr-2">{styles.label}</span>
                <span className="truncate">{item.clause || 'Điều khoản liên quan'}</span>
            </div>
            <div className="space-y-2 pl-2 text-slate-300 text-sm border-l border-white/5 ml-1">
                <p><span className="text-slate-500 font-medium">Nhận xét:</span> {item.comment || 'Không có nhận xét cụ thể.'}</p>
                {item.recommendation && (
                  <p><span className="text-slate-500 font-medium">Khuyến nghị:</span> <span className="text-green-400">{item.recommendation}</span></p>
                )}
            </div>
        </div>
    );
};

const LegalEvaluationDisplay: React.FC<{ result: LegalEvaluationResult }> = ({ result }) => {
  if (!result) return null;

  const score = result.legalScore ?? 0;
  const feedbackList = Array.isArray(result.feedback) ? result.feedback : [];

  const getStatus = (s: number) => {
    if (s >= 90) return { text: 'Rất An Toàn', className: 'text-green-400' };
    if (s >= 70) return { text: 'Ổn Định', className: 'text-yellow-400' };
    if (s >= 50) return { text: 'Cần Cẩn Trọng', className: 'text-orange-400' };
    return { text: 'Rủi Ro Cao', className: 'text-red-400' };
  };
  
  const status = getStatus(score);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center justify-center bg-slate-800/80 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <h3 className="text-xl font-bold text-slate-100 mb-6 uppercase tracking-wider">Chỉ Số Tin Cậy Pháp Lý</h3>
        <ScoreDisplay score={score} />
        <p className={`mt-6 text-2xl font-black ${status.className} tracking-tight`}>
          {status.text}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-100 flex items-center">
            <span className="w-2 h-8 bg-sky-500 rounded-full mr-3"></span>
            Chi Tiết Phân Tích
        </h3>
        {feedbackList.length > 0 ? (
            feedbackList.map((item, index) => <FeedbackCard key={index} item={item} />)
        ) : (
            <div className="p-8 bg-slate-800/40 border border-slate-700 rounded-xl text-center text-slate-400 italic">
                Hệ thống không phát hiện lỗ hổng pháp lý nào đáng kể trong tài liệu này.
            </div>
        )}
      </div>
      
      {result.sources && result.sources.length > 0 && (
        <div className="mt-8">
            <SourcesDisplay sources={result.sources} />
        </div>
      )}
    </div>
  );
};

export default LegalEvaluationDisplay;
