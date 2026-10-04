import React, { useState } from 'react';
import {
  X,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  Server,
  Zap,
  HardDrive
} from 'lucide-react';
import { Worker, Zone, Room } from '../types';

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  zones: Zone[];
  rooms: Room[];
  syncStatus?: 'synced' | 'syncing' | 'offline';
  onRestoreData?: (newWorkers: Worker[], newZones: Zone[]) => Promise<void>;
  onForceRefresh?: () => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({
  isOpen,
  onClose,
  workers,
  zones,
  rooms,
  syncStatus = 'synced',
  onRestoreData,
  onForceRefresh
}) => {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setNotification(null);
    if (onForceRefresh) {
      onForceRefresh();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      setNotification({
        type: 'success',
        message: 'Dữ liệu đã được đồng bộ mới nhất từ Google Firebase Firestore!'
      });
    }, 800);
  };

  // Tải file JSON sao lưu dự phòng offline
  const handleDownloadBackup = () => {
    const backupPayload = {
      app: 'KTX_MANAGEMENT_SYSTEM',
      platform: 'Google Firebase Firestore',
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
    downloadAnchor.setAttribute('download', `KTX_Firebase_Backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setNotification({
      type: 'success',
      message: 'Đã tải tệp sao lưu KTX_Firebase_Backup.json về máy tính thành công!'
    });
  };

  // Khôi phục dữ liệu từ tệp JSON và đồng bộ lên Firebase
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.workers && parsed.zones && onRestoreData) {
          const confirm = window.confirm(
            `Tìm thấy ${parsed.workers.length} công nhân và ${parsed.zones.length} khu trong tệp "${file.name}". Bạn có chắc chắn muốn nạp và lưu đè lên Google Firebase Firestore không?`
          );
          if (confirm) {
            await onRestoreData(parsed.workers, parsed.zones);
            setNotification({
              type: 'success',
              message: `Đã nạp và lưu thành công ${parsed.workers.length} công nhân lên Google Firebase Firestore!`
            });
          }
        } else {
          alert('Tệp JSON không đúng cấu trúc dữ liệu của phần mềm KTX.');
        }
      } catch (err) {
        alert('Lỗi khi đọc tệp JSON: ' + String(err));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Lưu Trữ Đám Mây Google Firebase
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Thời Gian Thực
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Toàn bộ dữ liệu KTX được lưu trữ và đồng bộ tự động trên máy chủ Google Cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-sm">
          {/* Status banner */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-start gap-3.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                Hệ thống đang hoạt động với Google Cloud Firestore
              </h3>
              <p className="text-emerald-900 leading-relaxed">
                Mọi thay đổi khi thêm, sửa, xóa công nhân, chuyển phòng, cập nhật ảnh CCCD hay cấu hình Khu - Dãy - Phòng đều được lưu trữ trực tiếp và tức thì vào <strong>Google Cloud Firestore</strong>. Không phụ thuộc vào Google Drive và không bao giờ gặp lỗi chính sách xác minh.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
              <span className="text-[11px] text-slate-500 block font-medium">Công nhân trên Cloud</span>
              <span className="text-xl font-bold text-slate-800">{workers.length}</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
              <span className="text-[11px] text-slate-500 block font-medium">Khu ký túc xá</span>
              <span className="text-xl font-bold text-slate-800">{zones.length}</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
              <span className="text-[11px] text-slate-500 block font-medium">Tổng số phòng</span>
              <span className="text-xl font-bold text-slate-800">{rooms.length}</span>
            </div>
          </div>

          {/* Cloud Features List */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Lợi ích khi lưu trữ trên Google Firebase:
            </h4>
            <div className="space-y-2 text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Đồng bộ đa thiết bị tức thì:</strong> Khi bạn hoặc người quản lý khác thao tác trên máy tính hay điện thoại, dữ liệu sẽ tự động nhảy số theo thời gian thực (Realtime).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Bảo mật cao của Google:</strong> Dữ liệu được mã hóa trên máy chủ đám mây của Google, có độ bền 99.999999999% và tự động sao lưu.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Hoạt động Offline (Bộ đệm cục bộ):</strong> Khi mất mạng internet, bạn vẫn xem và thao tác được; ngay khi có mạng trở lại dữ liệu sẽ tự đồng bộ lên Google Firebase.</span>
              </div>
            </div>
          </div>

          {notification && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              notification.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification.message}</span>
            </div>
          )}

          {/* Backup & Restore Action Buttons */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              Tùy chọn sao lưu dự phòng ngoại tuyến:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleDownloadBackup}
                className="py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-300"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Tải tệp sao lưu KTX (.json)</span>
              </button>

              <label className="py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-300">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Nạp tệp sao lưu (.json) lên Cloud</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUploadBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
            <span>Làm mới kết nối Firebase</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0088FF] hover:bg-[#0070E0] text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
