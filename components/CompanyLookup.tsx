import React, { useState, useEffect, useCallback } from 'react';
import { Search, Building2, MapPin, Phone, Mail, FileText, Download, Printer, ExternalLink, Copy, Check, Users, Shield, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CompanyLookupProps {
  theme: 'dark' | 'light';
}

interface SearchResult {
  name: string;
  taxCode: string;
  representative: string;
  status: string;
}

interface Branch {
  name: string;
  taxCode: string;
  representative: string;
  address: string;
  status: string;
}

interface CompanyDetails {
  id: string;
  taxCode: string;
  name: string;
  internationName?: string;
  shortName?: string;
  status: string;
  representative: string;
  establishedDate?: string;
  address: string;
  phone?: string;
  email?: string;
  businessTypes?: string[];
  taxDepartment?: string;
  companyType?: string;
  branches?: Branch[];
  relatedCompanies?: Branch[];
}

const CompanyLookup: React.FC<CompanyLookupProps> = ({ theme }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 3) {
        performSearch(query);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (q: string) => {
    setIsSearching(true);
    setError(null);
    try {
      const res = await axios.get(`/api/companies/search?q=${encodeURIComponent(q)}`);
      if (res.data && res.data.data) {
        setSearchResults(res.data.data);
        setShowDropdown(true);
      }
    } catch (err: any) {
      console.error(err);
      setError("Không thể lấy dữ liệu tìm kiếm.");
    } finally {
      setIsSearching(false);
    }
  };

  const fetchCompanyDetails = async (taxCode: string) => {
    setShowDropdown(false);
    setIsLoadingDetails(true);
    setError(null);
    setSelectedCompany(null);
    
    try {
      const res = await axios.get(`/api/companies/${taxCode}`);
      if (res.data && res.data.data) {
        setSelectedCompany(res.data.data);
      } else {
        setError("Không tìm thấy thông tin chi tiết.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Có lỗi xảy ra khi tải thông tin chi tiết.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadExcel = () => {
    if (!selectedCompany) return;
    const data = [
      ["Tên Công Ty", selectedCompany.name],
      ["Mã Số Thuế", selectedCompany.taxCode],
      ["Người Đại Diện", selectedCompany.representative],
      ["Địa Chỉ", selectedCompany.address],
      ["Trạng Thái", selectedCompany.status],
      ["Loại Hình", selectedCompany.companyType || 'Chưa cập nhật']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ThongTinDoanhNghiep");
    XLSX.writeFile(wb, `DoanhNghiep_${selectedCompany.taxCode}.xlsx`);
  };

  const downloadPDF = () => {
    if (!selectedCompany) return;
    const doc = new jsPDF();
    doc.text(`Thông Tin Doanh Nghiệp: ${selectedCompany.name}`, 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Trường', 'Giá Trị']],
      body: [
        ['Tên Công Ty', selectedCompany.name],
        ['Mã Số Thuế', selectedCompany.taxCode],
        ['Người Đại Diện', selectedCompany.representative],
        ['Địa Chỉ', selectedCompany.address],
        ['Trạng Thái', selectedCompany.status],
      ],
      styles: { font: 'helvetica' } // Assuming no complex VN characters or just fallback
    });
    doc.save(`DoanhNghiep_${selectedCompany.taxCode}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('đang hoạt động')) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (s.includes('ngừng') || s.includes('giải thể')) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (s.includes('tạm')) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
  };

  const getStatusDot = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('đang hoạt động')) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    if (s.includes('ngừng') || s.includes('giải thể')) return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
    if (s.includes('tạm')) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    return 'bg-slate-500';
  };

  return (
    <div className={`w-full mx-auto space-y-8 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="text-center w-full max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-indigo-500/10 text-indigo-500">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black mb-3">Tra cứu Doanh nghiệp Quốc gia</h2>
        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Tra cứu nhanh xác thực mã số thuế. Dữ liệu được trích xuất từ Cổng dữ liệu quốc gia và VietQR.
        </p>
        <div className={`mt-4 mx-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold max-w-fit ${theme === 'dark' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
          <AlertCircle className="w-3.5 h-3.5" />
          Một số trường dữ liệu (Ví dụ: Người đại diện) không khả dụng do các giới hạn API mở công cộng.
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-3xl mx-auto z-20">
        <div className={`relative flex items-center p-2 rounded-2xl border transition-all duration-300 shadow-xl ${
            theme === 'dark' 
              ? 'bg-slate-900 border-slate-700 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20' 
              : 'bg-white border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100'
          }`}>
          <Search className={`w-6 h-6 ml-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
          <input 
            type="text" 
            placeholder="Nhập Mã số thuế, Tên công ty, hoặc CMND/CCCD Người đại diện..."
            className="w-full px-4 py-4 bg-transparent outline-none text-base font-medium placeholder:text-slate-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if(searchResults.length > 0) setShowDropdown(true); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (query.trim()) fetchCompanyDetails(query);
              }
            }}
          />
          {isSearching && (
            <div className="mr-4">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            </div>
          )}
          <button 
            onClick={() => { if (query.trim()) fetchCompanyDetails(query); }}
            className="px-8 py-4 mr-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
          >
            Tìm kiếm
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className={`absolute top-full left-0 right-0 mt-3 rounded-2xl border shadow-2xl overflow-hidden ${
            theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <ul className="max-h-[400px] overflow-y-auto p-2">
              {searchResults.map((res, idx) => (
                <li key={idx}>
                  <button 
                    className={`w-full text-left p-4 rounded-xl flex flex-col gap-2 transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => { setQuery(res.taxCode); fetchCompanyDetails(res.taxCode); }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-bold text-sm">{res.name}</span>
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border whitespace-nowrap ${getStatusColor(res.status)}`}>
                        {res.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> MST: {res.taxCode}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Đại diện: {res.representative}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-medium">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Skeleton Loading */}
      {isLoadingDetails && (
        <div className="w-full mx-auto space-y-6 animate-pulse">
          <div className={`h-48 rounded-3xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`h-64 rounded-3xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
            <div className={`h-64 rounded-3xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
          </div>
        </div>
      )}

      {/* Detail Results */}
      {selectedCompany && !isLoadingDetails && (
        <div className="w-full mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
            <button onClick={downloadExcel} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'}`}>
              <Download className="w-4 h-4"/> Excel
            </button>
            <button onClick={downloadPDF} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'}`}>
              <FileText className="w-4 h-4"/> PDF
            </button>
            <button onClick={handlePrint} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'}`}>
              <Printer className="w-4 h-4"/> In
            </button>
          </div>

          <div className={`rounded-3xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            {/* Header section */}
            <div className={`p-8 sm:p-10 border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="relative flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${getStatusDot(selectedCompany.status).split(' ')[0]}`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${getStatusDot(selectedCompany.status)}`}></span>
                    </span>
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg border ${getStatusColor(selectedCompany.status)}`}>
                      {selectedCompany.status}
                    </span>
                    {selectedCompany.companyType && (
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                        {selectedCompany.companyType}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black mb-2 leading-tight">{selectedCompany.name}</h1>
                  {selectedCompany.internationName && <p className="text-sm font-medium text-slate-500 mb-1">{selectedCompany.internationName}</p>}
                  {selectedCompany.shortName && <p className="text-sm font-medium text-slate-500">Tên viết tắt: {selectedCompany.shortName}</p>}
                </div>
                
                <div className={`p-6 rounded-2xl border min-w-[280px] shrink-0 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                  <p className="text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Mã Số Thuế</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-3xl font-black tabular-nums tracking-tight">{selectedCompany.taxCode}</span>
                    <button 
                      onClick={() => handleCopy(selectedCompany.taxCode, 'taxCode')}
                      className={`p-2.5 rounded-xl transition-all ${copied === 'taxCode' ? 'bg-emerald-500 text-white' : (theme === 'dark' ? 'bg-slate-900 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
                    >
                      {copied === 'taxCode' ? <Check className="w-5 h-5"/> : <Copy className="w-5 h-5"/>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 p-8 sm:p-10 gap-x-16 gap-y-10">
              
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase text-slate-500 tracking-wider mb-3">
                    <Users className="w-4 h-4"/> Người Đại Diện Pháp Luật
                  </div>
                  <p className="text-xl font-bold">{selectedCompany.representative}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">
                    <MapPin className="w-4 h-4"/> Địa chỉ trụ sở
                  </div>
                  <p className="font-medium leading-relaxed">{selectedCompany.address}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">
                    <Building2 className="w-4 h-4"/> Cơ quan thuế quản lý
                  </div>
                  <p className="font-medium">{selectedCompany.taxDepartment || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
                      Ngày thành lập
                    </div>
                    <p className="font-semibold">{selectedCompany.establishedDate || 'Chưa cập nhật'}</p>
                  </div>
                   <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
                      <Phone className="w-4 h-4"/> Điện thoại
                    </div>
                    <p className="font-semibold">{selectedCompany.phone || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
                      <Mail className="w-4 h-4"/> Email
                    </div>
                    <p className="font-semibold">{selectedCompany.email || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                {selectedCompany.businessTypes && selectedCompany.businessTypes.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">
                      Ngành nghề kinh doanh
                    </div>
                    <ul className="space-y-2">
                      {selectedCompany.businessTypes.map((type, idx) => (
                        <li key={idx} className="text-sm border-l-2 border-indigo-500 pl-3 py-1 font-medium bg-indigo-500/5 rounded-r-lg">
                          {type}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Relational Ecosystem */}
            {(selectedCompany.branches?.length || selectedCompany.relatedCompanies?.length) ? (
               <div className={`p-8 sm:p-10 border-t ${theme === 'dark' ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'}`}>
                  <h3 className="text-lg font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-indigo-500"/>
                    Hệ sinh thái liên quan
                  </h3>
                  
                  {selectedCompany.branches && selectedCompany.branches.length > 0 && (
                    <div className="mb-8">
                       <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Chi nhánh / Đơn vị trực thuộc</h4>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {selectedCompany.branches.map((branch, idx) => (
                            <div key={idx} className={`p-5 rounded-2xl border transition-colors cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-500'} group`} onClick={() => fetchCompanyDetails(branch.taxCode)}>
                              <div className="flex justify-between items-start gap-4 mb-3">
                                <h5 className="font-bold text-sm group-hover:text-indigo-500 transition-colors">{branch.name}</h5>
                                <span className={`shrink-0 px-2py-1 text-[10px] font-bold uppercase rounded ${getStatusColor(branch.status)}`}>{branch.status}</span>
                              </div>
                              <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                                <p><span className="font-bold text-slate-400 mr-2">MST:</span> {branch.taxCode}</p>
                                <p><span className="font-bold text-slate-400 mr-2">Đại diện:</span> {branch.representative}</p>
                                <p className="truncate"><span className="font-bold text-slate-400 mr-2">Địa chỉ:</span> {branch.address}</p>
                              </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {selectedCompany.relatedCompanies && selectedCompany.relatedCompanies.length > 0 && (
                    <div>
                       <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Cùng người đại diện ({selectedCompany.representative})</h4>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {selectedCompany.relatedCompanies.map((rel, idx) => (
                            <div key={idx} className={`p-5 rounded-2xl border transition-colors cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-500'} group`} onClick={() => fetchCompanyDetails(rel.taxCode)}>
                              <div className="flex justify-between items-start gap-4 mb-3">
                                <h5 className="font-bold text-sm group-hover:text-indigo-500 transition-colors">{rel.name}</h5>
                                <span className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase rounded ${getStatusColor(rel.status)}`}>{rel.status}</span>
                              </div>
                              <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                                <p><span className="font-bold text-slate-400 mr-2">MST:</span> {rel.taxCode}</p>
                                <p className="truncate"><span className="font-bold text-slate-400 mr-2">Địa chỉ:</span> {rel.address}</p>
                              </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            ) : null}

          </div>
        </div>
      )}

      {/* CSS For Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #root, #root * {
            visibility: visible;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          .w-full {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          header, nav, footer, button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CompanyLookup;
