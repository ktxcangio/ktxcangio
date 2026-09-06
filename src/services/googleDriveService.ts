/**
 * Dịch vụ đồng bộ hóa và lưu trữ toàn bộ dữ liệu Ký túc xá trên Google Drive
 * Tích hợp Google Identity Services (GIS), Firebase Auth & Google Drive REST API v3
 */

import { Worker, Zone } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export interface GoogleDriveUserInfo {
  email?: string;
  name?: string;
  picture?: string;
  connectedAt?: string;
}

export interface DriveSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  folderId: string | null;
  folderUrl: string | null;
  fileId: string | null;
  backupFileCount: number;
  autoSyncEnabled: boolean;
  error: string | null;
  userInfo: GoogleDriveUserInfo | null;
}

export interface DriveDormitoryBackup {
  appName: string;
  version: string;
  exportedAt: string;
  totalWorkers: number;
  totalZones: number;
  zones: Zone[];
  workers: Worker[];
  metadata: {
    system: string;
    description: string;
  };
}

const STORAGE_KEY_DRIVE_TOKEN = 'dorm_gdrive_access_token';
const STORAGE_KEY_DRIVE_TOKEN_EXPIRY = 'dorm_gdrive_token_expiry';
const STORAGE_KEY_DRIVE_FOLDER_ID = 'dorm_gdrive_folder_id';
const STORAGE_KEY_DRIVE_LAST_SYNC = 'dorm_gdrive_last_sync';
const STORAGE_KEY_DRIVE_USER = 'dorm_gdrive_user_info';
const STORAGE_KEY_DRIVE_AUTOSYNC = 'dorm_gdrive_autosync_enabled';

const DRIVE_FOLDER_NAME = 'Quản Lý Công Nhân KTX - Dữ Liệu';
const DRIVE_DATA_FILENAME = 'Du_Lieu_KTX_Cong_Nhan.json';

class GoogleDriveService {
  private accessToken: string | null = null;
  private tokenClient: any = null;
  private isGsiInitialized = false;

  constructor() {
    this.loadPersistedToken();
  }

  private loadPersistedToken() {
    try {
      const token = localStorage.getItem(STORAGE_KEY_DRIVE_TOKEN);
      const expiry = localStorage.getItem(STORAGE_KEY_DRIVE_TOKEN_EXPIRY);
      if (token && expiry && Number(expiry) > Date.now()) {
        this.accessToken = token;
      } else {
        this.accessToken = null;
      }
    } catch {
      this.accessToken = null;
    }
  }

  public getAccessToken(): string | null {
    if (!this.accessToken) {
      this.loadPersistedToken();
    }
    return this.accessToken;
  }

  public isConnected(): boolean {
    return !!this.getAccessToken();
  }

  public getSavedUserInfo(): GoogleDriveUserInfo | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DRIVE_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public getAutoSyncSetting(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DRIVE_AUTOSYNC);
      return raw !== null ? JSON.parse(raw) : true;
    } catch {
      return true;
    }
  }

  public setAutoSyncSetting(enabled: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY_DRIVE_AUTOSYNC, JSON.stringify(enabled));
    } catch {}
  }

  public getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_DRIVE_LAST_SYNC);
    } catch {
      return null;
    }
  }

  public getFolderId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_DRIVE_FOLDER_ID);
    } catch {
      return null;
    }
  }

  public getFolderUrl(): string | null {
    const folderId = this.getFolderId();
    return folderId ? `https://drive.google.com/drive/folders/${folderId}` : null;
  }

  /**
   * Kiểm tra lỗi phản hồi từ Google Drive API (401 Unauthorized hoặc 403 Insufficient Scopes)
   */
  private handleApiError(status: number, errorText: string) {
    if (
      status === 401 ||
      (status === 403 &&
        (errorText.includes('insufficient') ||
          errorText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
          errorText.includes('PERMISSION_DENIED') ||
          errorText.includes('insufficientPermissions')))
    ) {
      // Xóa token bị thiếu quyền khỏi bộ nhớ và localStorage
      this.disconnect();
      throw new Error(
        'Tài khoản Google chưa được cấp quyền quản lý tệp trên Drive hoặc quyền đã hết hạn. Vui lòng bấm "Kết nối lại Drive" và tích chọn đồng ý cấp quyền truy cập Drive.'
      );
    }
  }

  /**
   * Khởi tạo Google Identity Services Token Client
   */
  public initTokenClient(clientId?: string): Promise<boolean> {
    return new Promise((resolve) => {
      const checkGsi = () => {
        if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
          try {
            const effectiveClientId =
              clientId ||
              firebaseConfig.oAuthClientId ||
              (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
              '';

            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: effectiveClientId,
              scope:
                'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
              callback: async (tokenResponse: any) => {
                if (tokenResponse.error) {
                  console.error('Google OAuth token error:', tokenResponse.error);
                  return;
                }
                if (tokenResponse.access_token) {
                  this.accessToken = tokenResponse.access_token;
                  const expiresIn = Number(tokenResponse.expires_in || 3600) * 1000;
                  const expiryTimestamp = Date.now() + expiresIn - 60000;

                  localStorage.setItem(STORAGE_KEY_DRIVE_TOKEN, tokenResponse.access_token);
                  localStorage.setItem(STORAGE_KEY_DRIVE_TOKEN_EXPIRY, String(expiryTimestamp));

                  await this.fetchAndSaveUserProfile();
                }
              },
            });
            this.isGsiInitialized = true;
            resolve(true);
          } catch (e) {
            console.warn('Lỗi init GIS token client:', e);
            resolve(false);
          }
        } else {
          setTimeout(checkGsi, 100);
        }
      };

      checkGsi();
    });
  }

  /**
   * Lấy thông tin tài khoản Google đã kết nối
   */
  public async fetchAndSaveUserProfile(): Promise<GoogleDriveUserInfo | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const userInfo: GoogleDriveUserInfo = {
          email: data.email,
          name: data.name,
          picture: data.picture,
          connectedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY_DRIVE_USER, JSON.stringify(userInfo));
        return userInfo;
      }
    } catch (e) {
      console.warn('Không thể lấy thông tin userinfo Google:', e);
    }
    return null;
  }

  /**
   * Đăng nhập qua Firebase Auth popup (phương án bổ trợ chuẩn xác thực)
   */
  public async signInWithFirebaseAuth(): Promise<string> {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.setCustomParameters({ prompt: 'consent' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không thể lấy mã truy cập Google Drive từ Firebase Auth.');
    }

    this.accessToken = credential.accessToken;
    const expiryTimestamp = Date.now() + 3600 * 1000 - 60000;
    localStorage.setItem(STORAGE_KEY_DRIVE_TOKEN, credential.accessToken);
    localStorage.setItem(STORAGE_KEY_DRIVE_TOKEN_EXPIRY, String(expiryTimestamp));

    const userInfo: GoogleDriveUserInfo = {
      email: result.user.email || undefined,
      name: result.user.displayName || undefined,
      picture: result.user.photoURL || undefined,
      connectedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_DRIVE_USER, JSON.stringify(userInfo));

    return credential.accessToken;
  }

  /**
   * Kích hoạt hộp thoại đăng nhập OAuth Google Drive
   * Buộc hiển thị bảng xác thực quyền Drive (prompt: consent)
   */
  public async requestAuth(): Promise<string> {
    // Luôn dọn dẹp token cũ có thể bị thiếu scope trước khi yêu cầu mới
    this.disconnect();

    try {
      return await this.requestGsiAuth();
    } catch (gsiErr: any) {
      console.warn('Google Identity Services popup error, trying Firebase Auth popup:', gsiErr);
      try {
        return await this.signInWithFirebaseAuth();
      } catch (fbErr: any) {
        throw new Error(gsiErr.message || fbErr.message || 'Không thể xác thực quyền Google Drive.');
      }
    }
  }

  private requestGsiAuth(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        this.initTokenClient().then(() => {
          if (!this.tokenClient) {
            reject(new Error('Thư viện Google Identity chưa sẵn sàng. Vui lòng thử lại.'));
            return;
          }
          this.triggerGsiPopup(resolve, reject);
        });
      } else {
        this.triggerGsiPopup(resolve, reject);
      }
    });
  }

  private triggerGsiPopup(resolve: (token: string) => void, reject: (err: any) => void) {
    try {
      this.tokenClient.callback = async (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }
        if (tokenResponse.access_token) {
          // Kiểm tra xem người dùng đã thực sự cấp quyền Drive chưa
          if (typeof window !== 'undefined' && window.google?.accounts?.oauth2?.hasGrantedAnyScope) {
            const hasDriveScope = window.google.accounts.oauth2.hasGrantedAnyScope(
              tokenResponse,
              'https://www.googleapis.com/auth/drive.file',
              'https://www.googleapis.com/auth/drive'
            );
            if (!hasDriveScope) {
              this.disconnect();
              reject(
                new Error(
                  'Bạn chưa tích chọn quyền Google Drive trên màn hình đăng nhập Google. Vui lòng thử lại và chọn Cho phép truy cập Drive.'
                )
              );
              return;
            }
          }

          this.accessToken = tokenResponse.access_token;
          const expiresIn = Number(tokenResponse.expires_in || 3600) * 1000;
          const expiryTimestamp = Date.now() + expiresIn - 60000;

          localStorage.setItem(STORAGE_KEY_DRIVE_TOKEN, tokenResponse.access_token);
          localStorage.setItem(STORAGE_KEY_DRIVE_TOKEN_EXPIRY, String(expiryTimestamp));

          await this.fetchAndSaveUserProfile();
          resolve(tokenResponse.access_token);
        } else {
          reject(new Error('Không nhận được mã xác thực từ Google.'));
        }
      };

      // prompt: 'consent' bắt buộc Google hiển thị màn hình cấp quyền Drive rõ ràng
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  }

  /**
   * Đăng xuất / Hủy kết nối Google Drive
   */
  public disconnect() {
    const token = this.accessToken;
    if (token && typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(token, () => {});
      } catch {}
    }
    this.accessToken = null;
    localStorage.removeItem(STORAGE_KEY_DRIVE_TOKEN);
    localStorage.removeItem(STORAGE_KEY_DRIVE_TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEY_DRIVE_USER);
  }

  /**
   * Tạo hoặc tìm kiếm thư mục Quản lý KTX trên Google Drive của người dùng
   */
  public async getOrCreateAppFolder(): Promise<string> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Chưa đăng nhập Google Drive.');

    const cachedFolderId = this.getFolderId();
    if (cachedFolderId) {
      try {
        const checkRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${cachedFolderId}?fields=id,name,trashed`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (checkRes.ok) {
          const folderData = await checkRes.json();
          if (!folderData.trashed) {
            return cachedFolderId;
          }
        } else {
          const errText = await checkRes.text();
          this.handleApiError(checkRes.status, errText);
        }
      } catch (e: any) {
        if (e.message?.includes('chưa được cấp quyền') || e.message?.includes('hết hạn')) {
          throw e;
        }
      }
    }

    // Tìm kiếm thư mục theo tên
    const query = encodeURIComponent(
      `name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const folderId = data.files[0].id;
        localStorage.setItem(STORAGE_KEY_DRIVE_FOLDER_ID, folderId);
        return folderId;
      }
    } else {
      const errText = await searchRes.text();
      this.handleApiError(searchRes.status, errText);
    }

    // Tạo mới thư mục nếu chưa có
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Thư mục lưu trữ tự động dữ liệu công nhân và ký túc xá',
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      this.handleApiError(createRes.status, errText);
      throw new Error(`Không thể tạo thư mục trên Google Drive: ${errText}`);
    }

    const newFolder = await createRes.json();
    localStorage.setItem(STORAGE_KEY_DRIVE_FOLDER_ID, newFolder.id);
    return newFolder.id;
  }

  /**
   * Lưu trữ toàn bộ dữ liệu Công nhân & Ký túc xá lên Google Drive
   */
  public async syncDataToDrive(
    workers: Worker[],
    zones: Zone[],
    createTimestampedBackup = false
  ): Promise<{ fileId: string; fileName: string; folderUrl: string }> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Chưa đăng nhập Google Drive.');

    const folderId = await this.getOrCreateAppFolder();

    const payload: DriveDormitoryBackup = {
      appName: 'Hệ Thống Quản Lý Công Nhân Ký Túc Xá',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      totalWorkers: workers.length,
      totalZones: zones.length,
      zones,
      workers,
      metadata: {
        system: 'Google AI Studio & Drive Integration',
        description:
          'Dữ liệu phân cấp Khu - Dãy - Phòng (20 người/phòng, 15 phòng/dãy), CCCD, ảnh chân dung',
      },
    };

    const fileName = createTimestampedBackup
      ? `Sao_Luu_KTX_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      : DRIVE_DATA_FILENAME;

    // Tìm file chính nếu không phải timestamped backup
    let existingFileId: string | null = null;
    if (!createTimestampedBackup) {
      const q = encodeURIComponent(
        `name = '${DRIVE_DATA_FILENAME}' and '${folderId}' in parents and trashed = false`
      );
      const findRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (findRes.ok) {
        const findData = await findRes.json();
        if (findData.files && findData.files.length > 0) {
          existingFileId = findData.files[0].id;
        }
      } else {
        const errText = await findRes.text();
        this.handleApiError(findRes.status, errText);
      }
    }

    const fileContent = JSON.stringify(payload, null, 2);
    let resultFileId = '';

    if (existingFileId) {
      // Cập nhật nội dung file chính đã có (PATCH media)
      const uploadRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: fileContent,
        }
      );

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        this.handleApiError(uploadRes.status, errText);
        throw new Error(`Lỗi cập nhật tệp trên Google Drive: ${errText}`);
      }
      resultFileId = existingFileId;
    } else {
      // Tạo tệp mới bằng Multipart Upload
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId],
        description: `Dữ liệu lưu trữ ngày ${new Date().toLocaleString('vi-VN')}`,
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        this.handleApiError(uploadRes.status, errText);
        throw new Error(`Lỗi tạo tệp mới trên Google Drive: ${errText}`);
      }

      const createdFile = await uploadRes.json();
      resultFileId = createdFile.id;
    }

    // Cập nhật mốc thời gian lưu
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_DRIVE_LAST_SYNC, now);

    return {
      fileId: resultFileId,
      fileName,
      folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
    };
  }

  /**
   * Đọc danh sách các tệp sao lưu dữ liệu KTX hiện có trên Google Drive
   */
  public async listDriveBackups(): Promise<
    Array<{ id: string; name: string; modifiedTime: string; size?: string; webViewLink?: string }>
  > {
    const token = this.getAccessToken();
    if (!token) return [];

    try {
      const folderId = await this.getOrCreateAppFolder();
      const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,size,webViewLink)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        return data.files || [];
      } else {
        const errText = await res.text();
        this.handleApiError(res.status, errText);
      }
    } catch (e: any) {
      if (e.message?.includes('chưa được cấp quyền') || e.message?.includes('hết hạn')) {
        throw e;
      }
      console.warn('Lỗi lấy danh sách tệp Google Drive:', e);
    }
    return [];
  }

  /**
   * Tải về và khôi phục dữ liệu từ một tệp sao lưu trên Google Drive
   */
  public async restoreDataFromDrive(fileId: string): Promise<DriveDormitoryBackup> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Chưa đăng nhập Google Drive.');

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      this.handleApiError(res.status, errText);
      throw new Error('Không thể tải tệp dữ liệu từ Google Drive.');
    }

    const data: DriveDormitoryBackup = await res.json();
    if (!data.workers || !Array.isArray(data.workers)) {
      throw new Error('Tệp không đúng định dạng dữ liệu KTX.');
    }

    return data;
  }
}

export const googleDriveService = new GoogleDriveService();
