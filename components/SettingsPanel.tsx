
import React from 'react';

interface SettingsPanelProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  lang: 'vi' | 'en';
  setLang: (lang: 'vi' | 'en') => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ theme, setTheme, lang, setLang }) => {
  return (
    <div className={`fixed top-4 left-4 z-50 flex items-center gap-2 p-1.5 rounded-2xl border backdrop-blur-md shadow-lg transition-all ${
      theme === 'dark' 
        ? 'bg-slate-800/80 border-slate-700 text-white' 
        : 'bg-white/80 border-slate-200 text-slate-900'
    }`}>
      {/* Theme Toggle */}
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className={`p-2 rounded-xl transition-all ${
          theme === 'dark' ? 'hover:bg-slate-700 text-amber-400' : 'hover:bg-slate-100 text-indigo-600'
        }`}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707.707M7.757 6.343l.707-.707M14.243 12a2.243 2.243 0 11-4.486 0 2.243 2.243 0 014.486 0z"></path></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
        )}
      </button>

      <div className={`w-[1px] h-6 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

      {/* Language Toggle */}
      <div className="flex bg-black/10 p-0.5 rounded-lg">
        <button 
          onClick={() => setLang('vi')}
          className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all ${
            lang === 'vi' 
              ? (theme === 'dark' ? 'bg-sky-500 text-white' : 'bg-indigo-600 text-white shadow-sm')
              : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
          }`}
        >
          VN
        </button>
        <button 
          onClick={() => setLang('en')}
          className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all ${
            lang === 'en' 
              ? (theme === 'dark' ? 'bg-sky-500 text-white' : 'bg-indigo-600 text-white shadow-sm')
              : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
