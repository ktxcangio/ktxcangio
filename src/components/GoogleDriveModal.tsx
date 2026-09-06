import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  CloudUpload, 
  CloudDownload, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  FolderCheck, 
  ShieldCheck, 
  Clock, 
  Database,
  Lock,
  LogOut,
  Sparkles,
  FileJson
} from 'lucide-react';
import { Worker, Zone } from '../types';
import { googleDriveService, GoogleDriveUserInfo } from '../services/googleDriveService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  zones: Zone[];
  onDataRestored?: (workers: Worker[], zones: Zone[]) => void;
  onSyncCompleted?: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  workers,
  zones,
  onDataRestored,
  onSyncCompleted
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<GoogleDriveUserInfo | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [folderUrl, setFolderUrl] = useState<string | null>(null);
  const [backups, setBackups] = useState<Array<{ id: string; name: string; modifiedTime: string; size?: string; webViewLink?: string }>>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      const connected = googleDriveService.isConnected();
      setIsConnected(connected);
      setUserInfo(googleDriveService.getSavedUserInfo());
      setAutoSync(googleDriveService.getAutoSyncSetting());
      setLastSyncTime(googleDriveService.getLastSyncTime());
      setFolderUrl(googleDriveService.getFolderUrl());
      setStatusMessage(null);

      // Initialize GIS client
      googleDriveService.initTokenClient().then((ready) => {
        if (connected) {
          loadBackupFiles();
        }
      });
    }
  }, [isOpen]);

  const loadBackupFiles = async () => {
    try {
      const list = await googleDriveService.listDriveBackups();
      setBackups(list);
      setFolderUrl(googleDriveService.getFolderUrl());
    } catch (e: any) {
      console.warn('Lỗi tải danh sách backup Drive:', e);
      if (
        e.message?.includes('chưa được cấp quyền') ||
        e.message?.includes('hết hạn') ||
        e.message?.includes('insufficient')
      ) {
        setIsConnected(false);
        setUserInfo(null);
        setStatusMessage({
          type: 'error',
          text: e.message || 'Phiên đăng nhập Drive cần được cấp quyền lại.',
        });
      }
    }
  };

  // Connect Google Account
  const handleConnect = async () => {
    try {
      setIsSyncing(true);
      setStatusMessage({ type: 'info', text: 'Đang mở cửa sổ đăng nhập Google...' });
      await googleDriveService.requestAuth();
      
      setIsConnected(true);
      setUserInfo(googleDriveService.getSavedUserInfo());
      setStatusMessage({ type: 'success', text: 'Kết nối và cấp quyền Google Drive thành công!' });
      
      // Auto initial sync
      await handleSyncNow(false);
      await loadBackupFiles();
    } catch (err: any) {
      console.error('Drive connection error:', err);
      setIsConnected(false);
      setUserInfo(null);
      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Không thể xác thực Google. Hãy đảm bảo bạn đã mở chặn popup trên trình duyệt và đồng ý cấp quyền Drive.' 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Disconnect
  const handleDisconnect = () => {
    if (window.confirm('Bạn có chắc muốn hủy liên kết Google Drive khỏi phiên làm việc này?')) {
      googleDriveService.disconnect();
      setIsConnected(false);
      setUserInfo(null);
      setFolderUrl(null);
      setBackups([]);
      setStatusMessage({ type: 'info', text: 'Đã ngắt kết nối Google Drive.' });
    }
  };

  // Manual Sync
  const handleSyncNow = async (createTimestampedBackup = false) => {
    try {
      setIsSyncing(true);
      setStatusMessage({ type: 'info', text: 'Đang lưu trữ dữ liệu lên Google Drive...' });

      const result = await googleDriveService.syncDataToDrive(workers, zones, createTimestampedBackup);
      
      setFolderUrl(result.folderUrl);
      setLastSyncTime(new Date().toISOString());
      setStatusMessage({ 
        type: 'success', 
        text: `Đã lưu toàn bộ ${workers.length} hồ sơ công nhân và ${zones.length} khu KTX lên Google Drive thành công!` 
      });

      await loadBackupFiles();
      if (onSyncCompleted) onSyncCompleted();
    } catch (err: any) {
      console.error('Lỗi sync Drive:', err);
      const isAuthIssue =
        err.message?.includes('chưa được cấp quyền') ||
        err.message?.includes('hết hạn') ||
        err.message?.includes('insufficient') ||
        err.message?.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT');

      if (isAuthIssue) {
        setIsConnected(false);
        setUserInfo(null);
      }

      setStatusMessage({ 
        type: 'error', 
        text: `Lỗi lưu trữ: ${err.message || 'Không thể đồng bộ lên Google Drive'}` 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Restore from Drive
  const handleRestore = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Bạn có chắc muốn khôi phục dữ liệu từ bản sao lưu "${fileName}" trên Google Drive? Dữ liệu hiện tại sẽ được cập nhật.`)) {
      return;
    }

    try {
      setIsRestoring(true);
      setStatusMessage({ type: 'info', text: 'Đang tải và giải nén dữ liệu từ Google Drive...' });

      const backup = await googleDriveService.restoreDataFromDrive(fileId);
      
      if (onDataRestored) {
        onDataRestored(backup.workers, backup.zones);
      }

      setStatusMessage({ 
        type: 'success', 
        text: `Khôi phục thành công ${backup.workers.length} công nhân từ bản sao lưu ${new Date(backup.exportedAt).toLocaleString('vi-VN')}!` 
      });
    } catch (err: any) {
      console.error('Lỗi khôi phục Drive:', err);
      setStatusMessage({ 
        type: 'error', 
        text: `Không thể khôi phục: ${err.message || 'Lỗi xử lý file'}` 
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    googleDriveService.setAutoSyncSetting(enabled);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        id="modal-google-drive"
        className="bg-white text-slate-900 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/90 flex items-center justify-center text-white shadow-md border border-blue-400/30">
              <HardDrive className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Lưu Trữ Google Drive</h3>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full font-semibold">
                  Tự động đồng bộ
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Toàn bộ dữ liệu hồ sơ công nhân, CCCD, ảnh và phòng KTX
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-900 border border-rose-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}>
              {statusMessage.type === 'success' && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />}
              <div className="flex-1 leading-relaxed">
                <div>{statusMessage.text}</div>
                {statusMessage.type === 'error' && (
                  <button
                    type="button"
                    onClick={handleConnect}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Cấp lại quyền Google Drive ngay</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Account Status Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            {isConnected ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {userInfo?.picture ? (
                    <img
                      src={userInfo.picture}
                      alt={userInfo.name || 'User'}
                      className="w-11 h-11 rounded-full border-2 border-emerald-500 shadow-xs"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base">
                      {userInfo?.name?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900">
                        {userInfo?.name || 'Tài khoản Google'}
                      </h4>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 text-emerald-600" /> Đã kết nối
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      {userInfo?.email || 'drive.file scope granted'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-xs text-slate-500 hover:text-rose-600 font-medium inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer self-end sm:self-auto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ngắt kết nối</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-3 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-inner">
                  <CloudUpload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Kết nối với tài khoản Google Drive của bạn
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Cho phép ứng dụng tự động lưu trữ dữ liệu KTX, ảnh chân dung và lịch sử biến động phòng an toàn trên Drive riêng của bạn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-4 h-4" />
                      <span>Đăng nhập & Bật lưu trữ Google Drive</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sync Stats & Quick Actions (Khi đã kết nối) */}
          {isConnected && (
            <div className="space-y-4">
              {/* Info Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Dữ liệu hiện tại</span>
                  <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                    {workers.length} Công nhân
                  </strong>
                  <span className="text-[10px] text-slate-400">{zones.length} Khu KTX</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Lần lưu gần nhất</span>
                  <strong className="text-xs font-bold text-slate-900 block mt-1 truncate">
                    {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString('vi-VN') : 'Chưa lưu'}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    {lastSyncTime ? new Date(lastSyncTime).toLocaleDateString('vi-VN') : '—'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 block">Thư mục Drive</span>
                  {folderUrl ? (
                    <a
                      href={folderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline mt-1"
                    >
                      <span>Mở thư mục</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 block mt-1">Đang tạo...</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSyncNow(false)}
                  disabled={isSyncing}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isSyncing ? 'Đang lưu lên Drive...' : 'Lưu trữ ngay (Ghi đè file chính)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSyncNow(true)}
                  disabled={isSyncing}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Tạo bản sao lưu mốc thời gian</span>
                </button>
              </div>

              {/* Tùy chọn tự động sao lưu */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    Tự động đồng bộ khi thay đổi dữ liệu
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Tự động cập nhật file KTX lên Google Drive mỗi khi thêm, sửa hoặc điều chuyển công nhân.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => handleToggleAutoSync(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Danh sách các bản sao lưu trên Drive */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileJson className="w-3.5 h-3.5 text-blue-600" />
                    Các tệp sao lưu trên Google Drive ({backups.length})
                  </h4>
                  <button
                    type="button"
                    onClick={loadBackupFiles}
                    className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Làm mới
                  </button>
                </div>

                {backups.length === 0 ? (
                  <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                    Chưa có tệp sao lưu nào. Bấm "Lưu trữ ngay" để tạo bản đầu tiên.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {backups.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-semibold text-slate-900 truncate">
                            {file.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(file.modifiedTime).toLocaleString('vi-VN')}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                              title="Xem trên Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRestore(file.id, file.name)}
                            disabled={isRestoring}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                          >
                            <CloudDownload className="w-3 h-3" />
                            <span>Khôi phục</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Architecture Benefits Note */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1.5">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Lưu trữ kép bảo mật (Dual-Cloud Resilience)
            </div>
            <p className="leading-relaxed text-slate-600">
              Hệ thống kết hợp đồng thời <strong>Google Cloud Firestore</strong> (lưu trữ thời gian thực, quét QR, tìm kiếm siêu tốc) và <strong>Google Drive</strong> (sao lưu tệp JSON độc lập, không sợ mất dữ liệu, có thể tải về hoặc nhập khẩu bất kỳ lúc nào).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Google Drive REST API v3
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
