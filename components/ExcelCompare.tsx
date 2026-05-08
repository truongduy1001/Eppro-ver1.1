import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import FileDropzone from './FileDropzone';

interface ExcelCompareProps {
  theme: 'dark' | 'light';
  translations: any;
}

interface CellDiff {
  row: number;
  col: number;
  val1: string;
  val2: string;
  isDiff: boolean;
}

const ExcelCompare: React.FC<ExcelCompareProps> = ({ theme, translations: t }) => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [diffCount, setDiffCount] = useState<number | null>(null);
  const [gridData, setGridData] = useState<CellDiff[][] | null>(null);
  const [maxCols, setMaxCols] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getCellValue = (cell: ExcelJS.Cell) => {
    if (!cell || cell.value === null || cell.value === undefined) return '';
    if (typeof cell.value === 'object') {
      if ('richText' in cell.value) {
        return cell.value.richText.map(rt => rt.text).join('').trim();
      }
      if ('sharedFormula' in cell.value || 'formula' in cell.value) {
        return cell.result ? String(cell.result).trim() : '';
      }
      if (cell.value instanceof Date) {
        return cell.value.toISOString();
      }
    }
    return String(cell.value).trim();
  };

  const compareFiles = async () => {
    if (!file1 || !file2) {
      setError("Vui lòng chọn cả 2 file Excel.");
      return;
    }
    setIsComparing(true);
    setError(null);
    setDiffCount(null);
    setGridData(null);

    try {
      const wb1 = new ExcelJS.Workbook();
      const wb2 = new ExcelJS.Workbook();

      await wb1.xlsx.load(await file1.arrayBuffer());
      await wb2.xlsx.load(await file2.arrayBuffer());

      const ws1 = wb1.worksheets[0];
      const ws2 = wb2.worksheets[0];

      if (!ws1 || !ws2) {
        throw new Error("Không thể đọc sheet từ file Excel.");
      }

      const rowCount1 = ws1.rowCount;
      const rowCount2 = ws2.rowCount;
      const colCount1 = ws1.columnCount;
      const colCount2 = ws2.columnCount;

      const maxRow = Math.max(rowCount1, rowCount2, 1);
      const maxCol = Math.max(colCount1, colCount2, 1);

      let diffs = 0;
      const grid: CellDiff[][] = [];

      for (let r = 1; r <= maxRow; r++) {
        const rowCells: CellDiff[] = [];
        const row1 = ws1.getRow(r);
        const row2 = ws2.getRow(r);

        let rowHasData = false;

        for (let c = 1; c <= maxCol; c++) {
          const cell1 = row1.getCell(c);
          const cell2 = row2.getCell(c);

          const val1 = getCellValue(cell1);
          const val2 = getCellValue(cell2);

          const isDiff = val1.toLowerCase() !== val2.toLowerCase();
          
          if (isDiff) {
            diffs++;
            rowHasData = true;
          } else if (val1 !== '') {
            rowHasData = true;
          }

          rowCells.push({ row: r, col: c, val1, val2, isDiff });
        }
        grid.push(rowCells);
      }

      setMaxCols(maxCol);
      setDiffCount(diffs);
      setGridData(grid);
    } catch (err: any) {
      setError("Lỗi khi xử lý file: " + (err.message || String(err)));
    } finally {
      setIsComparing(false);
    }
  };

  const exportResult = async () => {
    if (!gridData) return;
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Ket_Qua_So_Sanh');

      gridData.forEach((rowCells, rIndex) => {
        const row = ws.getRow(rIndex + 1);
        rowCells.forEach((cellData, cIndex) => {
          const cell = row.getCell(cIndex + 1);
          if (cellData.isDiff) {
            cell.value = `File 1: ${cellData.val1} | File 2: ${cellData.val2}`;
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC7CE' } // Light red
            };
            cell.font = { color: { argb: 'FF9C0006' } }; // Dark red
          } else {
            cell.value = cellData.val1;
          }
        });
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      FileSaver.saveAs(blob, 'ket_qua_so_sanh.xlsx');
    } catch (err: any) {
      setError("Lỗi lưu file: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black mb-2">So sánh file Excel</h2>
        <p className="text-slate-500">Tải lên hai tệp Excel để đối chiếu dữ liệu từng ô, làm nổi bật sự khác biệt và xuất kết quả.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-700/50 text-red-400 text-sm font-bold text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest px-2">File 1 (Gốc)</h3>
          <FileDropzone 
            title="Tải lên file Excel 1" 
            file={file1} 
            onFileSelect={setFile1} 
            theme={theme} 
            translations={t}
            acceptedFormats="excel"
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest px-2">File 2 (So sánh)</h3>
          <FileDropzone 
            title="Tải lên file Excel 2" 
            file={file2} 
            onFileSelect={setFile2} 
            theme={theme} 
            translations={t}
            acceptedFormats="excel"
          />
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button 
          onClick={compareFiles}
          disabled={!file1 || !file2 || isComparing}
          className={`px-12 py-4 font-black uppercase text-sm tracking-[0.2em] rounded-2xl shadow-xl transition-all ${
            (!file1 || !file2 || isComparing) 
              ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400' 
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white hover:shadow-emerald-500/25 hover:-translate-y-1'
          }`}
        >
          {isComparing ? 'Đang so sánh...' : 'So Sánh Excel'}
        </button>
      </div>

      {gridData && diffCount !== null && (
        <div className={`mt-10 rounded-2xl border p-6 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Kết Quả So Sánh</h3>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${diffCount > 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
              Tổng số ô khác nhau: {diffCount}
            </span>
            <button 
              onClick={exportResult}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg"
            >
              Tải Xuống File Kết Quả
            </button>
          </div>

          <div className="overflow-auto max-h-[600px] border border-slate-700/50 rounded-xl relative">
            <table className="w-full text-sm text-left border-collapse min-w-max">
              <thead className="sticky top-0 z-10">
                <tr className={theme === 'dark' ? 'bg-slate-900 border-b border-slate-700' : 'bg-slate-100 border-b border-slate-300'}>
                  <th className="p-3 font-semibold text-center w-12 border-r border-slate-700">#</th>
                  {Array.from({ length: maxCols }).map((_, i) => (
                    <th key={i} className="p-3 font-semibold text-center border-r border-slate-700/50">
                      Cột {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridData.map((rowCells, rIndex) => {
                  // Skip empty rows to save rendering if no diffs and no content
                   if (rowCells.every(c => !c.val1 && !c.val2)) return null;

                   return (
                    <tr key={rIndex} className={`border-b ${theme === 'dark' ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <td className={`p-3 text-center border-r font-medium ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-100'}`}>
                        {rIndex + 1}
                      </td>
                      {rowCells.map((cell, cIndex) => (
                        <td key={cIndex} className={`p-3 border-r ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} ${cell.isDiff ? (theme === 'dark' ? 'bg-red-900/40 text-red-100' : 'bg-red-100 text-red-900') : ''}`}>
                          {cell.isDiff ? (
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs opacity-70">File 1: {cell.val1 || '(trống)'}</span>
                              <span className="text-xs opacity-70 border-t border-red-500/30 pt-1">File 2: {cell.val2 || '(trống)'}</span>
                            </div>
                          ) : (
                            <span className="truncate block max-w-xs">{cell.val1}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelCompare;
