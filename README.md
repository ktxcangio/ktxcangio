# Hệ Thống Quản Lý Công Nhân Ký Túc Xá (KTX)

Phần mềm quản lý ký túc xá công nhân tập trung theo cấu trúc phân cấp **Khu › Dãy › Phòng › Giường & Tủ đồ**.
Tích hợp đồng bộ dữ liệu thời gian thực **Google Cloud Firestore**, quét mã QR Căn cước công dân (CCCD), chụp ảnh thẻ CCCD 2 mặt HD và tìm kiếm tiếng Việt không dấu.

---

## 🚀 Hướng Dẫn Deploy (Chỉ cần Deploy là Dùng)

### Cách 1: Deploy lên GitHub Pages (Tự động 100%)
Dự án đã tích hợp sẵn GitHub Actions workflow tại `.github/workflows/deploy.yml`:
1. Tạo một repository mới trên GitHub của bạn (ví dụ: `quan-ly-ktx`).
2. Đẩy toàn bộ code lên nhánh `main`:
   ```bash
   git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/TÊN_REPO.git
   git branch -M main
   git push -u origin main
   ```
3. Trên GitHub, vào mục **Settings** › **Pages**:
   - Tại mục **Build and deployment** › **Source**: Chọn **GitHub Actions**.
4. GitHub Actions sẽ tự động build và deploy trang web. Sau 1-2 phút, bạn sẽ nhận được link web trực tuyến dạng: `https://TÊN_GITHUB_CỦA_BẠN.github.io/TÊN_REPO/`

---

### Cách 2: Deploy lên Vercel (Khuyên dùng - Nhanh nhất 30 giây)
1. Đăng nhập [vercel.com](https://vercel.com) bằng tài khoản GitHub.
2. Bấm **Add New...** › **Project**.
3. Chọn kho chứa GitHub của dự án vừa đẩy lên.
4. Bấm **Deploy**. Vercel sẽ tự động build và cấp tên miền miễn phí (VD: `https://quan-ly-ktx.vercel.app`).

---

### Cách 3: Chạy Trên Máy Tính Cá Nhân (Local)
1. Cài đặt [Node.js](https://nodejs.org) (phiên bản 18 hoặc 20+).
2. Mở thư mục dự án trong Terminal/CMD:
   ```bash
   # Cài đặt thư viện
   npm install

   # Chạy máy chủ phát triển
   npm run dev
   ```
3. Mở trình duyệt tại địa chỉ: `http://localhost:3000` hoặc `http://localhost:5173`.

---

## 🛠 Tính Năng Chính
- **Quản lý phân cấp**: Khu (Zone), Dãy (Block), Phòng (Room), Giường (Bed) và Tổng số lượng tủ cá nhân.
- **Thêm/sửa công nhân chuẩn 8 trường dữ liệu**: Mã nhân viên, Họ tên, Giới tính, Ngày sinh, Địa chỉ, Số CCCD, Tên & SĐT Tổ trưởng.
- **Quét mã QR thẻ CCCD**: Tự động nhận diện và điền nhanh thông tin công nhân từ camera hoặc ảnh tải lên.
- **Chụp ảnh thẻ CCCD HD 2 mặt**: Hỗ trợ xem phóng to hoặc tải ảnh sắc nét.
- **Đồng bộ đám mây Cloud Firestore**: Lưu trữ thời gian thực và tự động lưu offline dự phòng vào LocalStorage.
- **Xuất báo cáo**: Xuất danh sách công nhân ra file Excel/CSV tiếng Việt chuẩn UTF-8 BOM.
