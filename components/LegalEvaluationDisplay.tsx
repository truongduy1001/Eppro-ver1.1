
import React from 'react';
import type { LegalEvaluationResult, LegalFeedbackItem } from '../types.ts';
import { SourcesDisplay } from './ResultsDisplay.tsx';

const ScoreDisplay: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-green-400';
    if (s >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const circumference = 2 * Math.PI * 45; // 2 * pi * r
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          className="text-slate-700"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        {/* Progress circle */}
        <circle
          className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
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
        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
};

const FeedbackCard: React.FC<{ item: LegalFeedbackItem }> = ({ item }) => {
    const typeStyles = {
        suggestion: {
            borderColor: 'border-sky-700',
            bgColor: 'bg-sky-900/30',
            titleColor: 'text-sky-400',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ),
        },
        warning: {
            borderColor: 'border-yellow-600',
            bgColor: 'bg-yellow-900/30',
            titleColor: 'text-yellow-400',
            icon: (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            ),
        },
        critical: {
            borderColor: 'border-red-600',
            bgColor: 'bg-red-900/30',
            titleColor: 'text-red-400',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            ),
        },
    };
    const styles = typeStyles[item.type];
    const typeText = { suggestion: 'Gợi ý', warning: 'Cảnh báo', critical: 'Nghiêm trọng' };

    return (
        <div className={`border-l-4 ${styles.borderColor} ${styles.bgColor} p-4 rounded-r-lg`}>
            <div className={`flex items-center text-lg font-semibold ${styles.titleColor} mb-2`}>
                {styles.icon}
                <span>{typeText[item.type]}: {item.clause}</span>
            </div>
            <div className="space-y-2 pl-7 text-slate-300 text-sm">
                <p><strong className="text-slate-400">Nhận xét:</strong> {item.comment}</p>
                <p><strong className="text-slate-400">Khuyến nghị:</strong> <span className="font-medium text-green-400">{item.recommendation}</span></p>
            </div>
        </div>
    );
};


const LegalEvaluationDisplay: React.FC<{ result: LegalEvaluationResult }> = ({ result }) => {
  const getScoreFeedback = (score: number): { text: string; className: string } => {
    if (score >= 90) {
      return { text: 'Tốt', className: 'text-green-400' };
    }
    if (score >= 80) {
      return { text: 'Tạm', className: 'text-yellow-400' };
    }
    if (score >= 50) {
      return { text: 'Chưa ổn', className: 'text-orange-400' };
    }
    return { text: 'Cực kỳ rủi ro', className: 'text-red-400' };
  };
  
  const scoreFeedback = getScoreFeedback(result.legalScore);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Điểm Pháp lý</h3>
        <ScoreDisplay score={result.legalScore} />
        <p className={`mt-4 text-xl font-bold ${scoreFeedback.className}`}>
          {scoreFeedback.text}
        </p>
        <div className="text-center text-sm text-red-400 mt-2 max-w-xs">
            <p>
                Điểm số này phản ánh mức độ chặt chẽ, đầy đủ và an toàn của hợp đồng dựa trên các quy định pháp lý hiện hành.
            </p>
            <p className="mt-2 font-semibold">
                Chỉ nên kiểm tra từ 1 tới 2 lần để bảo đảm tính chính xác tránh loãng thông tin.
            </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-100">Phản hồi chi tiết</h3>
        {result.feedback.length > 0 ? (
            result.feedback.map((item, index) => <FeedbackCard key={index} item={item} />)
        ) : (
            <p className="text-slate-400">Không có phản hồi cụ thể nào. Hợp đồng của bạn có vẻ tốt!</p>
        )}
      </div>
      
      <SourcesDisplay sources={result.sources} />
    </div>
  );
};

export default LegalEvaluationDisplay;