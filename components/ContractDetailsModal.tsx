
import React from 'react';
import type { ContractDetails } from '../types.ts';
import { SourcesDisplay } from './ResultsDisplay.tsx'; 

interface ContractDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ContractDetails | null;
  isLoading: boolean;
  error: string | null;
  theme: 'dark' | 'light';
}

// Helper function to parse inline markdown like **bold**, *italic*, and `code`
const parseInlineMarkdown = (line: string): React.ReactNode => {
    const parts = line.split(/(\*\*.*?\*\*|_.*?_|\*.*?\*|`.*?`)/g).filter(part => part);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('_') && part.endsWith('_')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-slate-700 text-amber-300 px-1.5 py-0.5 rounded-md text-sm font-mono">{part.slice(1, -1)}</code>;
      }
      return part;
    });
};

// Main function to render the full markdown text
const renderMarkdown = (text: string) => {
    const blocks = text.split('\n\n'); // Split by paragraphs
    
    const elements = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    
    const flushList = () => {
        if (listItems.length > 0 && listType) {
            if (listType === 'ul') {
                elements.push(
                    <ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-1 mb-4">
                        {listItems.map((item, i) => <li key={i}>{parseInlineMarkdown(item)}</li>)}
                    </ul>
                );
            } else { // ol
                 elements.push(
                    <ol key={`list-${elements.length}`} className="list-decimal pl-5 space-y-1 mb-4">
                        {listItems.map((item, i) => <li key={i}>{parseInlineMarkdown(item)}</li>)}
                    </ol>
                 );
            }
            listItems = [];
            listType = null;
        }
    };

    text.split('\n').forEach((line) => {
        line = line.trim();
        if (line.startsWith('# ')) {
            flushList();
            elements.push(<h1 key={`h1-${elements.length}`}>{parseInlineMarkdown(line.substring(2))}</h1>);
        } else if (line.startsWith('## ')) {
            flushList();
            elements.push(<h2 key={`h2-${elements.length}`}>{parseInlineMarkdown(line.substring(3))}</h2>);
        } else if (line.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={`h3-${elements.length}`}>{parseInlineMarkdown(line.substring(4))}</h3>);
        } else if (line.startsWith('* ') || line.startsWith('- ')) {
            if (listType !== 'ul') flushList();
            listType = 'ul';
            listItems.push(line.replace(/^[-*]\s*/, ''));
        } else if (/^\d+\.\s/.test(line)) {
            if (listType !== 'ol') flushList();
            listType = 'ol';
            listItems.push(line.replace(/^\d+\.\s*/, ''));
        } else if (line.length > 0) {
            flushList();
            elements.push(<p key={`p-${elements.length}`}>{parseInlineMarkdown(line)}</p>);
        } else {
             // Handle empty lines between paragraphs
            flushList();
        }
    });
    
    flushList(); // Flush any remaining list
    return elements;
};


const ContractDetailsModal: React.FC<ContractDetailsModalProps> = ({ isOpen, onClose, title, content, isLoading, error, theme }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`relative w-full max-w-3xl max-h-[90vh] border rounded-2xl shadow-2xl flex flex-col transition-colors ${
          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <header className={`flex items-center justify-between p-4 border-b sticky top-0 backdrop-blur-sm z-10 ${
          theme === 'dark' ? 'border-slate-700 bg-slate-800/80' : 'border-slate-200 bg-white/80'
        }`}>
          <h2 id="modal-title" className={`text-xl font-semibold ${theme === 'dark' ? 'text-sky-400' : 'text-indigo-600'}`}>{title}</h2>
          <button 
            onClick={onClose} 
            className={`${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors`}
            aria-label="Đóng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className={`overflow-y-auto p-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
          {isLoading && (
            <div className="flex flex-col items-center justify-center my-8">
              <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${
                theme === 'dark' ? 'border-sky-400' : 'border-indigo-600'
              }`}></div>
              <p className={`mt-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Đang tìm kiếm thông tin pháp lý...</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg text-center">
              {error}
            </div>
          )}
          {content && (
            <div className={`prose prose-sm sm:prose-base max-w-none space-y-4 ${theme === 'dark' ? 'prose-invert' : ''}`}>
              <style>{`
                .prose h1, .prose h2, .prose h3 { border-bottom: 1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}; padding-bottom: 0.3em; margin-bottom: 0.8em; }
                .prose h1 { font-size: 1.5em; color: ${theme === 'dark' ? '#38bdf8' : '#4f46e5'}; }
                .prose h2 { font-size: 1.25em; color: ${theme === 'dark' ? '#7dd3fc' : '#6366f1'}; }
                .prose h3 { font-size: 1.1em; color: ${theme === 'dark' ? '#a5f3fc' : '#818cf8'}; }
                .prose strong { color: ${theme === 'dark' ? '#f1f5f9' : '#111827'}; }
                .prose a { color: ${theme === 'dark' ? '#38bdf8' : '#4f46e5'}; text-decoration: none; }
                .prose a:hover { text-decoration: underline; }
                .prose ul > li::marker { color: ${theme === 'dark' ? '#38bdf8' : '#4f46e5'}; }
                .prose ol > li::marker { color: ${theme === 'dark' ? '#38bdf8' : '#4f46e5'}; }
                .prose p { margin-bottom: 0.5em; }
              `}</style>
              {renderMarkdown(content.details)}
              <SourcesDisplay sources={content.sources} theme={theme} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export const MemoizedContractDetailsModal = React.memo(ContractDetailsModal);
export default ContractDetailsModal;
