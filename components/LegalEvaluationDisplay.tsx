
import React from 'react';
import type { LegalEvaluationResult, LegalFeedbackItem } from '../types.ts';
import { SourcesDisplay } from './ResultsDisplay.tsx';

interface LegalEvaluationDisplayProps {
  result: LegalEvaluationResult;
  translations: any;
  theme: 'dark' | 'light';
}

const ScoreDisplay: React.FC<{ score: number, theme: 'dark' | 'light' }> = ({ score, theme }) => {
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
        <circle className={theme === 'dark' ? 'text-slate-700' : 'text-slate-200'} strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
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
        <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>/ 100</span>
      </div>
    </div>
  );
};

const FeedbackCard: React.FC<{ item: LegalFeedbackItem, theme: 'dark' | 'light' }> = ({ item, theme }) => {
    if (!item) return null;
    
    const type = String(item.type || 'suggestion').toLowerCase();
    
    const typeStyles: Record<string, any> = {
        suggestion: { 
          borderColor: theme === 'dark' ? 'border-sky-700' : 'border-sky-500', 
          bgColor: theme === 'dark' ? 'bg-sky-900/30' : 'bg-sky-50', 
          titleColor: theme === 'dark' ? 'text-sky-400' : 'text-sky-700', 
          label: 'Gợi ý' 
        },
        warning: { 
          borderColor: theme === 'dark' ? 'border-yellow-600' : 'border-yellow-500', 
          bgColor: theme === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-50', 
          titleColor: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700', 
          label: 'Cảnh báo' 
        },
        critical: { 
          borderColor: theme === 'dark' ? 'border-red-600' : 'border-red-500', 
          bgColor: theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50', 
          titleColor: theme === 'dark' ? 'text-red-400' : 'text-red-700', 
          label: 'Nghiêm trọng' 
        },
    };

    const styles = typeStyles[type] || typeStyles.suggestion;

    return (
        <div className={`border-l-4 ${styles.borderColor} ${styles.bgColor} p-4 rounded-r-lg mb-4 shadow-sm transition-colors`}>
            <div className={`flex items-center text-lg font-semibold ${styles.titleColor} mb-2`}>
                <span className="uppercase text-xs font-bold px-2 py-1 rounded bg-black/10 mr-2">{styles.label}</span>
                <span className="truncate">{item.clause || 'Điều khoản liên quan'}</span>
            </div>
            <div className={`space-y-2 pl-2 text-sm border-l ml-1 ${theme === 'dark' ? 'text-slate-300 border-white/5' : 'text-slate-700 border-black/5'}`}>
                <p><span className={`${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} font-medium`}>Nhận xét:</span> {item.comment || 'Không có nhận xét cụ thể.'}</p>
                {item.recommendation && (
                  <p><span className={`${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} font-medium`}>Khuyến nghị:</span> <span className="text-green-500 font-medium">{item.recommendation}</span></p>
                )}
            </div>
        </div>
    );
};

const LegalEvaluationDisplay: React.FC<LegalEvaluationDisplayProps> = ({ result, translations, theme }) => {
  if (!result) return null;

  const score = result.legalScore ?? 0;
  const feedbackList = Array.isArray(result.feedback) ? result.feedback : [];

  const getStatus = (s: number) => {
    if (s >= 90) return { text: 'Rất An Toàn', className: 'text-green-500' };
    if (s >= 70) return { text: 'Ổn Định', className: 'text-yellow-500' };
    if (s >= 50) return { text: 'Cần Cẩn Trọng', className: 'text-orange-500' };
    return { text: 'Rủi Ro Cao', className: 'text-red-500' };
  };
  
  const status = getStatus(score);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border shadow-xl transition-all ${
        theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <h3 className={`text-xl font-bold mb-6 uppercase tracking-wider ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Chỉ Số Tin Cậy Pháp Lý</h3>
        <ScoreDisplay score={score} theme={theme} />
        <p className={`mt-6 text-2xl font-black ${status.className} tracking-tight`}>
          {status.text}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className={`text-xl font-bold flex items-center ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
            <span className={`w-2 h-8 rounded-full mr-3 ${theme === 'dark' ? 'bg-sky-500' : 'bg-indigo-600'}`}></span>
            Chi Tiết Phân Tích
        </h3>
        {feedbackList.length > 0 ? (
            feedbackList.map((item, index) => <FeedbackCard key={index} item={item} theme={theme} />)
        ) : (
            <div className={`p-8 border rounded-xl text-center italic ${
              theme === 'dark' ? 'bg-slate-800/40 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
                Hệ thống không phát hiện lỗ hổng pháp lý nào đáng kể trong tài liệu này.
            </div>
        )}
      </div>
      
      {result.sources && result.sources.length > 0 && (
        <div className="mt-8">
            <SourcesDisplay sources={result.sources} theme={theme} />
        </div>
      )}
    </div>
  );
};

export default LegalEvaluationDisplay;
