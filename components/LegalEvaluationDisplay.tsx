import React from 'react';
import type { LegalEvaluationResult, LegalFeedbackItem } from '../types.ts';
import { SourcesDisplay } from './ResultsDisplay.tsx';

const ScoreDisplay: React.FC<{ score: number }> = ({ score }) => {
  const safeScore = isNaN(score) ? 0 : Math.min(100, Math.max(0, score));
  
  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-green-400';
    if (s >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const circumference = 2 * Math.PI * 45; // 2 * pi * r
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-slate-700"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
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
    // Fallback nếu AI trả về type lạ
    const type = (item.type || 'suggestion').toLowerCase();
    
    const typeStyles: Record<string, any> = {
        suggestion: {
            borderColor: 'border-sky-700',
            bgColor: 'bg-sky-900/30',
            titleColor: 'text-sky-400',
            label: 'Gợi ý',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ),
        },
        warning: {
            borderColor: 'border-yellow-600',
            bgColor: 'bg-yellow-900/30',
            titleColor: 'text-yellow-400',
            label: 'Cảnh báo',
            icon: (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            ),
        },
        critical: {
            borderColor: 'border-red-600',
            bgColor: 'bg-red-900/30',
            titleColor: 'text-red-400',
            label: 'Nghiêm trọng',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            ),
        },
    };

    // Nếu type không khớp 3 cái trên, dùng 'suggestion' làm mặc định để không bị crash
    const styles = typeStyles[type] || typeStyles.suggestion;

    return (
        <div className={`border-l-4 ${styles.borderColor} ${styles.bgColor} p-4 rounded-r-lg mb-4`}>
            <div className={`flex items-center text-lg font-semibold ${styles.titleColor} mb-2`}>
                {styles.icon}
                <span>{styles.label}: {item.clause || 'Điều khoản chưa xác định'}</span>
            </div>
            <div className="space-y-2 pl-7 text-slate-300 text-sm">
                <p><strong className="text-slate-400">Nhận xét:</strong> {item.comment || 'Không có nhận xét.'}</p>
                <p><strong className="text-slate-400">Khuyến nghị:</strong> <span className="font-medium text-green-400">{item.recommendation || 'Xem xét lại điều khoản này.'}</span></p>
            </div>
        </div>
    );
};


const LegalEvaluationDisplay: React.FC<{ result: LegalEvaluationResult }> = ({ result }) => {
  if (!result) return <div className="p-4 text-center text-slate-400 italic">Không có kết quả phân tích.</div>;

  const score = result.legalScore ?? 0;

  const getScoreFeedback = (s: number): { text: string; className: string } => {
    if (s >= 90) return { text: 'An toàn cao', className: 'text-green-400' };
    if (s >= 75) return { text: 'Khá ổn định', className: 'text-yellow-400' };
    if (s >= 50) return { text: 'Nhiều rủi ro', className: 'text-orange-400' };
    return { text: 'Rất nguy hiểm', className: 'text-red-400' };
  };
  
  const scoreFeedback = getScoreFeedback(score);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Điểm Tin cậy Pháp lý</h3>
        <ScoreDisplay score={score} />
        <p className={`mt-4 text-xl font-bold ${scoreFeedback.className}`}>
          {scoreFeedback.text}
        </p>
        <div className="text-center text-sm text-slate-400 mt-4 max-w-xs">
            <p>
                Điểm số dựa trên việc đối chiếu với Bộ luật Dân sự và các văn bản luật liên quan.
            </p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Chi tiết rà soát</h3>
        {result.feedback && result.feedback.length > 0 ? (
            result.feedback.map((item, index) => <FeedbackCard key={index} item={item} />)
        ) : (
            <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-lg text-center text-slate-400 italic">
                Hợp đồng có vẻ rất chặt chẽ, AI không tìm thấy lỗ hổng nào đáng kể.
            </div>
        )}
      </div>
      
      <SourcesDisplay sources={result.sources} />
    </div>
  );
};

export default LegalEvaluationDisplay;