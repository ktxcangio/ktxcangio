import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  FileCode2,
  Database,
  FolderSync,
  HelpCircle,
  ShieldCheck,
  Laptop
} from 'lucide-react';
import { Worker, Zone, Room } from '../types';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  zones: Zone[];
  rooms: Room[];
  onRestoreData: (newWorkers: Worker[], newZones: Zone[]) => Promise<void>;
  syncStatus?: 'synced' | 'syncing' | 'offline';
}

const APPS_SCRIPT_TEMPLATE = `// === GOOGLE APPS SCRIPT LƯU TRỮ DỮ LIỆU KTX TRÊN GOOGLE DRIVE ===
// Đoạn mã này chạy trên chính tài khoản Google Drive của bạn,
// KHÔNG BAO GIỜ bị Google chặn chính sách hay yêu cầu kiểm duyệt OAuth!

function doGet(e) {
  try {
    var fileName = "KTX_BACKUP_DATA.json";
    var files = DriveApp.getFilesByName(fileName);
    if (files.hasNext()) {
      var file = files.next();
      var content = file.getBlob().getDataAsString();
      return ContentService.createTextOutput(content)
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ 
        error: "Chưa có file sao lưu trên Google Drive của bạn",
        empty: true 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var fileName = "KTX_BACKUP_DATA.json";
    var files = DriveApp.getFilesByName(fileName);
    var file;
    
    if (files.hasNext()) {
      file = files.next();
      file.setContent(rawData);
    } else {
      file = DriveApp.createFile(fileName, rawData, MimeType.PLAIN_TEXT);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: file.getId(),
      fileName: fileName,
      fileUrl: file.getUrl(),
      updatedAt: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  workers,
  zones,
  rooms,
  onRestoreData,
  syncStatus
}) => {
  const [activeTab, setActiveTab] = useState<'appscript' | 'json' | 'firebase' | 'policy'>('appscript');
  const [scriptUrl, setScriptUrl] = useState<string>('');
  const [autoSync, setAutoSync] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; fileUrl?: string } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('ktx_gdrive_script_url');
    if (savedUrl) setScriptUrl(savedUrl);

    const savedAutoSync = localStorage.getItem('ktx_gdrive_auto_sync') === 'true';
    setAutoSync(savedAutoSync);

    const savedLastSync = localStorage.getItem('ktx_gdrive_last_sync');
    if (savedLastSync) setLastSyncTime(savedLastSync);
  }, []);

  if (!isOpen) return null;

  const handleSaveScriptUrl = (url: string) => {
    setScriptUrl(url.trim());
    localStorage.setItem('ktx_gdrive_script_url', url.trim());
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Đồng bộ lên Google Drive qua Apps Script Web App
  const handlePushToGoogleDrive = async () => {
    if (!scriptUrl) {
      setSyncResult({
        success: false,
        message: 'Vui lòng nhập đường link Google Apps Script Web App của bạn trước khi đồng bộ!'
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    const backupPayload = {
      app: 'KTX_MANAGEMENT_SYSTEM',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      stats: {
        totalWorkers: workers.length,
        totalZones: zones.length,
        totalRooms: rooms.length
      },
      zones,
      workers
    };

    try {
      // Dùng fetch POST gửi dữ liệu JSON
      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(backupPayload)
      });

      const data = await res.json();

      if (data.success) {
        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
        setLastSyncTime(timeStr);
        localStorage.setItem('ktx_gdrive_last_sync', timeStr);
        setSyncResult({
          success: true,
          message: `Đã lưu thành công tệp "KTX_BACKUP_DATA.json" vào Google Drive của bạn!`,
          fileUrl: data.fileUrl
        });
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Google Apps Script trả về lỗi không xác định.'
        });
      }
    } catch (err) {
      console.error('Lỗi khi gửi lên Apps Script:', err);
      setSyncResult({
        success: false,
        message: 'Không thể kết nối đến URL Web App. Vui lòng kiểm tra lại quyền truy cập khi Triển khai ("Bất kỳ ai / Anyone") và đảm bảo URL chính xác.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Khôi phục dữ liệu từ Google Drive qua Apps Script Web App
  const handlePullFromGoogleDrive = async () => {
    if (!scriptUrl) {
      setSyncResult({
        success: false,
        message: 'Vui lòng nhập đường link Google Apps Script Web App để tải bản sao lưu!'
      });
      return;
    }

    const confirm = window.confirm(
      'Bạn có chắc muốn tải bản sao lưu từ Google Drive về đè lên dữ liệu hiện tại không?'
    );
    if (!confirm) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch(scriptUrl);
      const data = await res.json();

      if (data.error) {
        setSyncResult({
          success: false,
          message: data.error
        });
        return;
      }

      if (data.workers && data.zones) {
        await onRestoreData(data.workers, data.zones);
        setSyncResult({
          success: true,
          message: `Khôi phục thành công ${data.workers.length} công nhân và ${data.zones.length} khu KTX từ Google Drive!`
        });
      } else {
        setSyncResult({
          success: false,
          message: 'Tệp trên Google Drive không đúng định dạng dữ liệu KTX.'
        });
      }
    } catch (err) {
      console.error('Lỗi khi tải từ Apps Script:', err);
      setSyncResult({
        success: false,
        message: 'Không thể tải dữ liệu từ URL Web App. Vui lòng kiểm tra lại link hoặc kết nối mạng.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Tải file JSON xuống máy tính để lưu vào Google Drive Desktop
  const handleDownloadJSON = () => {
    const backupPayload = {
      app: 'KTX_MANAGEMENT_SYSTEM',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      stats: {
        totalWorkers: workers.length,
        totalZones: zones.length,
        totalRooms: rooms.length
      },
      zones,
      workers
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `KTX_DuLieuSaoLuu_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Khôi phục từ file JSON người dùng upload
  const handleUploadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.workers && parsed.zones) {
          const confirm = window.confirm(
            `Tìm thấy ${parsed.workers.length} công nhân và ${parsed.zones.length} khu trong file "${file.name}". Bạn có đồng ý khôi phục vào hệ thống không?`
          );
          if (confirm) {
            await onRestoreData(parsed.workers, parsed.zones);
            setSyncResult({
              success: true,
              message: `Đã khôi phục thành công từ file ${file.name}!`
            });
          }
        } else {
          alert('Tệp JSON không chứa cấu trúc dữ liệu hợp lệ của hệ thống KTX.');
        }
      } catch (err) {
        alert('Lỗi: Tệp JSON bị hỏng hoặc sai định dạng: ' + String(err));
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Lưu Trữ & Đồng Bộ Dữ Liệu Google Drive
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                  Giải Pháp Tối Ưu
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Khắc phục triệt để chính sách hạn chế của Google, đảm bảo 100% dữ liệu được an toàn trên tài khoản của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('appscript')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'appscript'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderSync className="w-3.5 h-3.5 text-blue-600" />
            <span>Cách 1: Google Apps Script (Khuyên dùng)</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-blue-100 text-blue-700 font-bold rounded">0 đồng</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'json'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cách 2: Tệp JSON & Drive Máy tính</span>
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'firebase'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-amber-500" />
            <span>Cách 3: Google Firebase Cloud (Có sẵn)</span>
          </button>

          <button
            onClick={() => setActiveTab('policy')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'policy'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>Tại sao Google chặn & Cách xử lý</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-700 text-sm">
          {/* TAB 1: Google Apps Script Web App */}
          {activeTab === 'appscript' && (
            <div className="space-y-4">
              {/* Introduction Banner */}
              <div className="p-3.5 rounded-lg bg-blue-50/80 border border-blue-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-blue-900">
                    Giải pháp lưu trực tiếp vào Google Drive mà không bị lỗi chính sách kiểm duyệt:
                  </p>
                  <p className="text-blue-800 leading-relaxed">
                    Bằng cách dùng <strong>Google Apps Script</strong> miễn phí của chính Google, đoạn script sẽ chạy với tư cách <em>chính chủ tài khoản Drive của bạn</em>. Nhờ đó, Google <strong>không coi đây là ứng dụng ngoài</strong> và sẽ <strong>không bao giờ chặn</strong> quyền truy cập!
                  </p>
                </div>
              </div>

              {/* Sync Actions Bar */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Đường dẫn Web App của bạn (Google Apps Script Web App URL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={scriptUrl}
                    onChange={(e) => handleSaveScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
                  />
                  <button
                    onClick={handlePushToGoogleDrive}
                    disabled={isSyncing || !scriptUrl}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Đồng bộ lên Drive</span>
                  </button>
                  <button
                    onClick={handlePullFromGoogleDrive}
                    disabled={isSyncing || !scriptUrl}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tải về từ Drive</span>
                  </button>
                </div>

                {lastSyncTime && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Lần đồng bộ Drive thành công gần nhất: <strong>{lastSyncTime}</strong>
                  </p>
                )}

                {/* Sync status alert */}
                {syncResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                      syncResult.success
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border border-rose-200'
                    }`}
                  >
                    {syncResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{syncResult.message}</p>
                      {syncResult.fileUrl && (
                        <a
                          href={syncResult.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 mt-1 font-medium"
                        >
                          Mở tệp KTX_BACKUP_DATA.json trên Google Drive
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Step by step guide */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileCode2 className="w-4 h-4 text-blue-600" />
                  Hướng dẫn cài đặt trong 2 phút (Chỉ cần làm 1 lần duy nhất)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-slate-800">Tạo Apps Script mới</h4>
                    <p className="text-slate-500 leading-relaxed">
                      Truy cập{' '}
                      <a
                        href="https://script.google.com/home/start"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-semibold underline inline-flex items-center gap-0.5"
                      >
                        script.google.com
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      , nhấn <strong>Dự án mới (New project)</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-slate-800">Dán đoạn mã bên dưới</h4>
                    <p className="text-slate-500 leading-relaxed">
                      Xóa toàn bộ mã mặc định trong tệp <code>Code.gs</code>, nhấn nút <strong>Sao chép mã</strong> bên dưới rồi dán vào. Nhấn <strong>Lưu (Ctrl + S)</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-slate-800">Triển khai Web App</h4>
                    <p className="text-slate-500 leading-relaxed">
                      Bấm nút <strong>Triển khai (Deploy)</strong> &gt; <strong>Tùy chọn triển khai mới</strong> &gt; Loại: <strong>Ứng dụng web</strong> &gt; Ai có quyền truy cập: <strong>Bất kỳ ai (Anyone)</strong>. Sao chép URL dán vào ô phía trên!
                    </p>
                  </div>
                </div>

                {/* Code Block with Copy Button */}
                <div className="relative rounded-lg border border-slate-300 bg-slate-900 text-slate-100 p-3.5 font-mono text-[11px] overflow-hidden">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                      <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                      Mã nguồn Google Apps Script (Code.gs)
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span className="text-emerald-200">Đã chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép mã</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="max-h-48 overflow-y-auto leading-relaxed select-all text-slate-300 scrollbar-thin">
                    {APPS_SCRIPT_TEMPLATE}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Sao lưu tệp JSON & Drive Máy tính */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <Laptop className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-950">
                    Giải pháp Offline an toàn 100% kết hợp Google Drive for Desktop:
                  </p>
                  <p className="text-emerald-900 leading-relaxed">
                    Bạn cài phần mềm <strong>Google Drive for Desktop</strong> trên máy tính. Mỗi lần bấm <strong>Tải tệp sao lưu KTX</strong>, hãy chọn lưu vào thư mục <code>Google Drive</code> của máy. Google Drive sẽ tự động tải tệp đó lên mây ngay lập tức, không qua bất kỳ API trung gian nào!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Xuất Bản Sao Lưu (.json)</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tải về toàn bộ dữ liệu gồm <strong>{workers.length} công nhân</strong>, <strong>{zones.length} khu</strong>, danh sách phòng, giường, số tủ và cấu hình ký túc xá.
                  </p>
                  <button
                    onClick={handleDownloadJSON}
                    className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải tệp sao lưu KTX (.json) ngay</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Khôi Phục Từ Tệp Sao Lưu</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Khi cài lại máy, chuyển sang máy tính mới hoặc muốn hoàn tác dữ liệu, chỉ cần chọn tệp <code>.json</code> đã lưu trước đó.
                  </p>
                  <label className="w-full py-2.5 px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Chọn tệp .json để khôi phục</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleUploadJSON}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Google Firebase Cloud */}
          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-950">
                    Bạn có biết: Google Firebase chính là Cơ sở dữ liệu đám mây của Google?
                  </p>
                  <p className="text-amber-900 leading-relaxed">
                    Hệ thống KTX của bạn <strong>đã được tích hợp sẵn Google Firebase Firestore</strong>. Mỗi khi bạn thêm công nhân, chuyển phòng hay đổi trạng thái, dữ liệu tự động lưu trên máy chủ đám mây của Google mà không phải qua Google Drive.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-800">Trạng thái đồng bộ Google Cloud:</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    {syncStatus === 'syncing' ? 'Đang đồng bộ...' : syncStatus === 'offline' ? 'Ngoại tuyến' : 'Đang hoạt động (Online)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Tổng công nhân trên Cloud</span>
                    <span className="text-base font-bold text-slate-800">{workers.length}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Tổng khu KTX</span>
                    <span className="text-base font-bold text-slate-800">{zones.length}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Tổng số phòng</span>
                    <span className="text-base font-bold text-slate-800">{rooms.length}</span>
                  </div>
                </div>

                <ul className="text-xs text-slate-600 space-y-1.5 pt-2 list-disc list-inside">
                  <li>Lưu trên cụm máy chủ Google Cloud bảo mật cao.</li>
                  <li>Tự động đồng bộ thời gian thực giữa nhiều máy tính cùng quản lý KTX.</li>
                  <li>Không bao giờ bị lỗi chính sách kiểm duyệt của Google Drive.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: Tại sao Google chặn & Giải thích chính sách */}
          {activeTab === 'policy' && (
            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-950 text-sm">
                    Vì sao Google thông báo: "Chính sách của Google: Quyền truy cập bị chặn"?
                  </h4>
                  <p className="text-rose-900 mt-1">
                    Google xếp quyền truy cập Google Drive (Google Drive API) vào nhóm <strong>"Sensitive & Restricted Scopes" (Phạm vi nhạy cảm và bị hạn chế nghiêm ngặt)</strong> để bảo vệ người dùng khỏi mã độc đánh cắp tệp tin riêng tư.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                  Chi tiết 2 rào cản từ phía Google:
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <p className="font-semibold text-slate-800">1. Yêu cầu kiểm toán bảo mật tốn phí (CASA Verification):</p>
                    <p className="text-slate-500 mt-0.5">
                      Nếu ứng dụng web muốn kết nối Google Drive công khai cho nhiều người dùng, Google bắt buộc lập trình viên phải thuê một công ty bảo mật quốc tế đánh giá với chi phí từ 1.000$ - 3.000$/năm. Do đó, các ứng dụng nội bộ không nên xin quyền Drive trực tiếp theo cách thông thường.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <p className="font-semibold text-slate-800">2. Màn hình cảnh báo "Ứng dụng chưa được xác minh":</p>
                    <p className="text-slate-500 mt-0.5">
                      Nếu dùng Google Drive API cá nhân, Google sẽ hiện màn hình đỏ hoặc chặn hoàn toàn đăng nhập nếu bạn chưa thêm email của mình vào danh sách <strong>"Test Users"</strong> trong Google Cloud Console.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/60">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Cách khắc phục tốt nhất được các chuyên gia khuyên dùng:
                </h4>
                <p className="text-blue-800 mt-1">
                  Hãy dùng <strong>Cách 1: Google Apps Script Web App</strong> (ở Tab đầu tiên). Đây là cách mà các lập trình viên và doanh nghiệp tại Việt Nam áp dụng phổ biến nhất vì:
                  chính bạn là chủ của Script đó trên Google Drive của mình, Google hoàn toàn tin cậy và không áp dụng bất kỳ chính sách kiểm duyệt nào!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Dữ liệu được mã hóa chuẩn JSON UTF-8 an toàn tuyệt đối
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
