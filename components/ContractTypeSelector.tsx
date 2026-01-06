
import React from 'react';
import type { ContractType } from '../types.ts';

// Add missing translations and theme to props interface
interface ContractTypeSelectorProps {
  selectedType: string;
  onTypeChange: (typeId: string) => void;
  contractTypes: ContractType[];
  onViewDetails: () => void;
  translations: any;
  theme: 'dark' | 'light';
}

const ContractTypeSelector: React.FC<ContractTypeSelectorProps> = ({ 
  selectedType, 
  onTypeChange, 
  contractTypes, 
  onViewDetails,
  translations,
  theme
}) => {
  const isDetailsButtonDisabled = selectedType === 'general';
  const t = translations;

  return (
    <div className="mb-6 w-full">
      <label htmlFor="contract-type-selector" className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
        {t.selectorLabel}
      </label>
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <select
          id="contract-type-selector"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className={`border text-sm rounded-lg block w-full p-2.5 transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-700 border-slate-600 text-slate-200 focus:ring-sky-500 focus:border-sky-500' 
              : 'bg-white border-slate-300 text-slate-900 focus:ring-indigo-500 focus:border-indigo-500'
          }`}
          aria-label="Chọn loại hợp đồng"
        >
          {contractTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        <button
          onClick={onViewDetails}
          disabled={isDetailsButtonDisabled}
          className={`w-full sm:w-auto px-4 py-2.5 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors border ${
            theme === 'dark'
              ? 'text-sky-300 bg-slate-700/50 border-slate-600 hover:bg-slate-700'
              : 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
          }`}
          title={isDetailsButtonDisabled ? (translations.lang === 'vi' ? "Không có chi tiết cho loại chung" : "No details for general type") : t.viewDetails}
        >
          {t.viewDetails}
        </button>
      </div>
    </div>
  );
};

export default ContractTypeSelector;
