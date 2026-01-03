
import React from 'react';
import type { ContractType } from '../types.ts';

interface ContractTypeSelectorProps {
  selectedType: string;
  onTypeChange: (typeId: string) => void;
  contractTypes: ContractType[];
  onViewDetails: () => void;
}

const ContractTypeSelector: React.FC<ContractTypeSelectorProps> = ({ selectedType, onTypeChange, contractTypes, onViewDetails }) => {
  const isDetailsButtonDisabled = selectedType === 'general';

  return (
    <div className="mb-6 w-full">
      <label htmlFor="contract-type-selector" className="block mb-2 text-sm font-medium text-slate-300">
        Chọn loại hợp đồng để tăng độ chính xác
      </label>
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <select
          id="contract-type-selector"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
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
          className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-sky-300 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
          title={isDetailsButtonDisabled ? "Không có chi tiết cho loại chung" : "Xem điều khoản và phụ lục tham khảo"}
        >
          Xem Chi tiết
        </button>
      </div>
    </div>
  );
};

export default ContractTypeSelector;