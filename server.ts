import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
import axios from "axios";
import path from "path";
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = 3000;

// ----- CONFIGURATION -----
app.use(cors());
app.use(express.json());

// ----- MEMORY CACHE -----
// Standard cache for 24 hours
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 120 });

// ----- RATE LIMITING -----
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per `window` (here, per minute)
  message: { error: "Quá nhiều yêu cầu từ IP của bạn, vui lòng thử lại sau 1 phút." },
  standardHeaders: true, 
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ----- DEMO DATA FALLBACK -----
const getSampleCompanyData = (taxId: string) => {
  return {
    id: `co_${taxId}`,
    taxCode: taxId,
    name: "CÔNG TY DEMO (DỮ LIỆU MẪU)",
    internationName: "DEMO COMPANY LIMITED",
    shortName: "DEMO CO.,LTD",
    status: "Đang hoạt động",
    representative: "Nguyễn Văn Demo (Ví dụ)",
    establishedDate: "2020-01-01",
    address: "Tầng 1, Nhà Demo, Đường Ảo, Quận 1, TP Hồ Chí Minh",
    phone: "02873001234",
    email: "contact@demotech.vn",
    businessTypes: ["Dữ liệu mẫu - Không chính thức", "Công nghệ thông tin"],
    taxDepartment: "Chi cục Thuế Quận 1",
    companyType: "Công ty TNHH",
    branches: [],
    relatedCompanies: []
  };
};

const SAMPLE_SEARCH_RESULTS = [
  { name: "CÔNG TY TNHH PHÁT TRIỂN CÔNG NGHỆ DEMO", taxCode: "0316000001", representative: "Nguyễn Văn Demo", status: "Đang hoạt động" },
  { name: "CÔNG TY CỔ PHẦN CÔNG NGHỆ DEMO GROUP", taxCode: "0108000002", representative: "Trần Anh Đạt", status: "Đang hoạt động" }
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ----- API ENDPOINTS -----

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/companies/search", async (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: "Thiếu tham số tìm kiếm (q)" });
  }

  const cacheKey = `search_${q.toLowerCase()}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json({ source: 'cache', data: cachedData });
  }

  try {
    let results = [];
    
    // Nếu q là mã số thuế (toàn số hoặc có dấu gạch ngang), thử gọi VietQR
    const isTaxCode = /^\\d{10}(\\-\\d{3})?$/.test(q.trim());
    
    if (isTaxCode) {
      try {
        const response = await axios.get(`https://api.vietqr.io/v2/business/${q.trim()}`, { timeout: 3000 });
        if (response.data && response.data.code === '00' && response.data.data) {
          const d = response.data.data;
          results.push({
            name: d.name,
            taxCode: q.trim(),
            address: d.address,
            representative: 'Không được cấp bởi API định danh này',
            status: d.status || 'Đang hoạt động'
          });
        }
      } catch (e: any) {
        console.log('VietQR API fetch failed:', e.message);
      }
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "API VietQR chỉ hỗ trợ tra cứu trực tiếp theo đúng định dạng Mã Số Thuế." });
    }

    cache.set(cacheKey, results); 
    return res.json({ source: 'live', data: results });

  } catch (error) {
    console.error("Search API Error:", error);
    return res.status(500).json({ error: "Lỗi hệ thống khi tìm kiếm dữ liệu" });
  }
});

app.get("/api/companies/:taxCode", async (req, res) => {
  const { taxCode } = req.params;
  
  if (!taxCode || typeof taxCode !== 'string') {
    return res.status(400).json({ error: "Mã số thuế không hợp lệ" });
  }

  const cacheKey = `company_${taxCode}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return res.json({ source: 'cache', data: cachedData });
  }

  try {
    let realData = null;
    
    // Attempt VietQR
    try {
      const vqr = await axios.get(`https://api.vietqr.io/v2/business/${taxCode.trim()}`, { timeout: 3000 });
      if (vqr.data && vqr.data.code === '00' && vqr.data.data) {
        const d = vqr.data.data;
        realData = {
          id: d.id,
          taxCode: d.id,
          name: d.name,
          internationName: d.internationalName || "Chưa cập nhật",
          shortName: d.shortName || "Chưa cập nhật",
          status: d.status || "Chưa cập nhật",
          representative: "Không cung cấp bởi VietQR API",
          address: d.address || "Chưa cập nhật",
          establishedDate: "Không cung cấp bởi VietQR API",
          phone: "Không cung cấp bởi VietQR API",
          email: "Không cung cấp bởi VietQR API",
          businessTypes: ["Không cung cấp bởi VietQR API"],
          taxDepartment: "Không cung cấp bởi VietQR API",
          companyType: "Không cung cấp bởi VietQR API",
          branches: [],
          relatedCompanies: []
        };
      }
    } catch (e: any) {
      console.log('VietQR detail fetch failed:', e.message);
    }

    if (!realData) {
      return res.status(404).json({ error: "Không tìm thấy dữ liệu doanh nghiệp này trên Cổng VietQR API (hoặc MST không tồn tại)." });
    }

    cache.set(cacheKey, realData);
    return res.json({ source: 'live', data: realData });
  } catch (error) {
    console.error("Detail API Error:", error);
    return res.status(500).json({ error: "Lỗi hệ thống khi lấy chi tiết doanh nghiệp" });
  }
});


// ----- MULTER CONFIGURATION -----
const upload = multer({ dest: 'uploads/', limits: { fileSize: 32 * 1024 * 1024 } }); // 32MB max limit commonly supported by VT

// ----- SCAN HISTORY (IN-MEMORY) -----
let scanHistory: any[] = [];
let scanCounterId = 1;

app.get('/api/security/history', (req, res) => {
  // Trả về lịch sử mới nhất trước
  res.json({ data: [...scanHistory].reverse() });
});

app.post('/api/security/history', (req, res) => {
  const { file_name, file_size, sha256, scan_status, malicious_count, suspicious_count, harmless_count, undetected_count, total_engine, virus_total_analysis_id, virus_total_link } = req.body;
  
  const historyRecord = {
    id: scanCounterId++,
    file_name,
    file_size,
    sha256,
    scan_status,
    malicious_count: malicious_count || 0,
    suspicious_count: suspicious_count || 0,
    harmless_count: harmless_count || 0,
    undetected_count: undetected_count || 0,
    total_engine: total_engine || 0,
    virus_total_analysis_id,
    virus_total_link,
    created_at: new Date().toISOString(),
    user_id: 'admin' // Demo only
  };
  
  scanHistory.push(historyRecord);
  res.json({ success: true, data: historyRecord });
});

app.delete('/api/security/history/:id', (req, res) => {
  const idStr = req.params.id;
  const id = parseInt(idStr, 10);
  scanHistory = scanHistory.filter(record => record.id !== id);
  res.json({ success: true });
});

// ----- SERVER TOOLING: VBA UNLOCKER -----
import AdmZip from 'adm-zip';

app.post('/api/tools/vba-unlock', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Chưa chọn file để tải lên." });
  const filePath = req.file.path;
  const originalName = req.file.originalname;

  try {
    let buffer = fs.readFileSync(filePath);
    
    const replaceDPB = (buf: Buffer) => {
      const target = Buffer.from('DPB=');
      const replacement = Buffer.from('DPx=');
      let idx = buf.indexOf(target);
      if (idx === -1) return null;
      
      const newBuf = Buffer.alloc(buf.length);
      buf.copy(newBuf);
      
      let offset = 0;
      while (true) {
        let i = newBuf.indexOf(target, offset);
        if (i === -1) break;
        replacement.copy(newBuf, i);
        offset = i + 4;
      }
      return newBuf;
    };

    if (buffer.length > 2 && buffer[0] === 0x50 && buffer[1] === 0x4B) { // 'P', 'K'
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();
      
      const vbaNames = ['xl/vbaProject.bin', 'word/vbaProject.bin', 'ppt/vbaProject.bin'];
      let found = false;
      let modified = false;

      for (const entry of zipEntries) {
        if (vbaNames.includes(entry.entryName)) {
          found = true;
          let entryData = entry.getData();
          let newEntryData = replaceDPB(entryData);
          if (newEntryData) {
            const name = entry.entryName;
            zip.deleteFile(name);
            zip.addFile(name, newEntryData);
            modified = true;
            break;
          } else {
             fs.unlinkSync(filePath);
             return res.status(400).json({ error: "Tìm thấy mã VBA nhưng không có mật khẩu (chưa được bảo vệ)." });
          }
        }
      }

      if (!found) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "Không tìm thấy mã VBA nào hoặc file bị mã hóa toàn bộ." });
      }

      if (modified) {
        const outBuffer = zip.toBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="unlocked_${originalName}"`);
        return res.send(outBuffer);
      }

    } else {
      let newBuffer = replaceDPB(buffer);
      if (newBuffer) {
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename="unlocked_${originalName}"`);
        return res.send(newBuffer);
      } else {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "Không tìm thấy mã VBA hoặc dữ liệu chưa được bảo vệ." });
      }
    }
  } catch (err: any) {
    console.error("VBA Unlock Error:", err);
    res.status(500).json({ error: "Lỗi xử lý file. Có thể file bị hỏng hoặc định dạng không đúng." });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// ----- VIRUSTOTAL API ENDPOINTS -----
app.get('/api/security/hash/:sha256', async (req, res) => {
  const { sha256 } = req.params;
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình VIRUSTOTAL_API_KEY. Vui lòng thêm vào cài đặt môi trường." });

  try {
    const response = await axios.get(`https://www.virustotal.com/api/v3/files/${sha256}`, {
      headers: { 'x-apikey': apiKey }
    });
    res.json(response.data);
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "File not found" });
    }
    console.error("VT Hash Error:", error.response?.data || error.message);
    res.status(500).json({ error: `Lỗi VT: ${error.response?.data?.error?.message || "Không thể xác thực API Key"}` });
  }
});

app.post('/api/security/scan-file', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  const filePath = req.file.path;
  
  if (!apiKey) {
    fs.unlinkSync(filePath);
    return res.status(500).json({ error: "Chưa cấu hình VIRUSTOTAL_API_KEY. Vui lòng thêm vào cài đặt môi trường." });
  }

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), req.file.originalname);

    const response = await axios.post('https://www.virustotal.com/api/v3/files', form, {
      headers: {
        'x-apikey': apiKey,
        ...form.getHeaders()
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error("VT Upload Error:", error?.response?.data || error.message);
    res.status(500).json({ error: `Lỗi VT: ${error?.response?.data?.error?.message || "Lỗi upload file lên VirusTotal"}` });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Always clean up uploaded file
    }
  }
});

app.get('/api/security/scan-result/:analysisId', async (req, res) => {
  const { analysisId } = req.params;
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing VIRUSTOTAL_API_KEY configuration." });

  try {
    const response = await axios.get(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
      headers: { 'x-apikey': apiKey }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error("VT Analysis Error:", error.response?.data || error.message);
    res.status(500).json({ error: `Lỗi VT: ${error.response?.data?.error?.message || "Lỗi kết nối tới VirusTotal để lấy kết quả"}` });
  }
});


// ----- VITE MIDDLEWARE SETUP -----
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production configuration
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
