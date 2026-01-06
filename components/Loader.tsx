
import React from 'react';

interface LoaderProps {
  message?: string;
  theme?: 'dark' | 'light';
}

const Loader: React.FC<LoaderProps> = ({ message = 'AI is analyzing...', theme = 'dark' }) => {
  return (
    <div className="flex flex-col items-center justify-center my-8">
      <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${
        theme === 'dark' ? 'border-sky-400' : 'border-indigo-600'
      }`}></div>
      <p className={`mt-4 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{message}</p>
    </div>
  );
};

export default Loader;
