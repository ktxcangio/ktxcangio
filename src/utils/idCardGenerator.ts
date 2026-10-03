/**
 * Helper to generate authentic Vietnamese CCCD (Căn cước công dân gắn chip)
 * SVG graphic cards when a worker does not have an uploaded physical photo yet.
 * Also handles exporting and downloading ID card pairs.
 */
import { Worker } from '../types';

export function getCleanDate(dateStr?: string): string {
  if (!dateStr) return '01/01/1995';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr || '';
  }
}

/**
 * Tạo SVG data URL cho Mặt trước CCCD chuẩn Việt Nam
 */
export function generateSvgIdCardFront(worker: Worker): string {
  const fullName = (worker.fullName || 'NGUYỄN VĂN A').toUpperCase();
  const citizenId = worker.citizenId || '038096001234';
  const birthDate = getCleanDate(worker.birthDate);
  const gender = worker.gender || 'Nam';
  const address = worker.address || 'Hà Nội, Việt Nam';
  
  // Calculate expiry date (+20 years or until age 25/40/60)
  const birthYear = parseInt((worker.birthDate || '1995').split('-')[0], 10) || 1995;
  const expiryYear = birthYear < 1985 ? birthYear + 60 : birthYear < 2000 ? birthYear + 40 : birthYear + 25;
  const expiryDate = `15/03/${Math.max(2028, expiryYear)}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <defs>
    <linearGradient id="bgFront" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="50%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#ecfeff"/>
    </linearGradient>
    <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
    <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M0 20 Q 20 0 40 20 T 80 20" fill="none" stroke="#cbd5e1" stroke-width="0.5" opacity="0.35"/>
      <path d="M20 0 Q 40 20 20 40 T 20 80" fill="none" stroke="#93c5fd" stroke-width="0.5" opacity="0.25"/>
    </pattern>
  </defs>

  <!-- Card Border & Background -->
  <rect x="2" y="2" width="852" height="536" rx="28" fill="url(#bgFront)" stroke="#94a3b8" stroke-width="3"/>
  <rect x="10" y="10" width="836" height="520" rx="22" fill="url(#guilloche)"/>

  <!-- National Header -->
  <g text-anchor="middle">
    <text x="490" y="44" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#dc2626" letter-spacing="1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</text>
    <text x="490" y="66" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Độc lập - Tự do - Hạnh phúc</text>
    <line x1="390" y1="74" x2="590" y2="74" stroke="#0f172a" stroke-width="1.5"/>

    <text x="490" y="110" font-family="Arial, sans-serif" font-size="21" font-weight="900" fill="#dc2626" letter-spacing="1.5">CĂN CƯỚC CÔNG DÂN</text>
    <text x="490" y="128" font-family="Arial, sans-serif" font-size="12" font-style="italic" fill="#475569">IDENTITY CARD</text>
  </g>

  <!-- Vietnam National Emblem (Stylized Badge) -->
  <g transform="translate(48, 28)">
    <circle cx="40" cy="40" r="38" fill="#dc2626" stroke="#fbbf24" stroke-width="3"/>
    <circle cx="40" cy="40" r="34" fill="none" stroke="#fbbf24" stroke-width="1" stroke-dasharray="3,3"/>
    <!-- Yellow 5-point star -->
    <polygon points="40,16 46,32 63,32 50,42 55,59 40,49 25,59 30,42 17,32 34,32" fill="#facc15"/>
    <!-- Cogwheel at bottom -->
    <path d="M 26 62 Q 40 70 54 62" fill="none" stroke="#fbbf24" stroke-width="4"/>
  </g>

  <!-- Photo Box (Left) -->
  <g transform="translate(46, 140)">
    <rect x="0" y="0" width="168" height="224" rx="8" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <!-- Silhouette / Portrait -->
    <rect x="2" y="2" width="164" height="220" rx="6" fill="#3b82f6" opacity="0.12"/>
    <circle cx="84" cy="80" r="42" fill="#94a3b8"/>
    <path d="M 28 200 C 35 145, 133 145, 140 200 Z" fill="#94a3b8"/>
    <text x="84" y="216" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#475569" text-anchor="middle">ẢNH CHÂN DUNG</text>
  </g>

  <!-- Expiry Date (Under Photo) -->
  <g transform="translate(46, 386)">
    <text x="0" y="14" font-family="Arial, sans-serif" font-size="11" fill="#475569">Có giá trị đến / Date of expiry:</text>
    <text x="0" y="34" font-family="monospace, Arial" font-size="15" font-weight="bold" fill="#0f172a">${expiryDate}</text>
  </g>

  <!-- Smart Chip Icon -->
  <g transform="translate(236, 142)">
    <rect x="0" y="0" width="76" height="58" rx="6" fill="url(#chipGrad)" stroke="#a16207" stroke-width="1.5"/>
    <line x1="26" y1="0" x2="26" y2="58" stroke="#a16207" stroke-width="1"/>
    <line x1="50" y1="0" x2="50" y2="58" stroke="#a16207" stroke-width="1"/>
    <line x1="0" y1="29" x2="76" y2="29" stroke="#a16207" stroke-width="1"/>
    <rect x="26" y="16" width="24" height="26" rx="3" fill="#fef08a" stroke="#a16207" stroke-width="1"/>
  </g>

  <!-- Card Number (Citizen ID) -->
  <g transform="translate(330, 168)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#334155">Số / No.:</text>
    <text x="80" y="2" font-family="monospace, Arial" font-size="24" font-weight="bold" fill="#dc2626" letter-spacing="2">${citizenId}</text>
  </g>

  <!-- Worker Details -->
  <g transform="translate(236, 230)" font-family="Arial, sans-serif">
    <!-- Full Name -->
    <text x="0" y="0" font-size="12" fill="#475569">Họ và tên / Full name:</text>
    <text x="0" y="24" font-size="18" font-weight="bold" fill="#0f172a" letter-spacing="0.5">${fullName}</text>

    <!-- Date of Birth & Gender -->
    <text x="0" y="58" font-size="12" fill="#475569">Ngày sinh / Date of birth:</text>
    <text x="175" y="58" font-size="14" font-weight="bold" fill="#0f172a">${birthDate}</text>

    <text x="310" y="58" font-size="12" fill="#475569">Giới tính / Sex:</text>
    <text x="420" y="58" font-size="14" font-weight="bold" fill="#0f172a">${gender}</text>

    <!-- Nationality -->
    <text x="0" y="92" font-size="12" fill="#475569">Quốc tịch / Nationality:</text>
    <text x="175" y="92" font-size="14" font-weight="bold" fill="#0f172a">Việt Nam</text>

    <!-- Place of Origin -->
    <text x="0" y="126" font-size="12" fill="#475569">Quê quán / Place of origin:</text>
    <text x="175" y="126" font-size="13" font-weight="bold" fill="#0f172a">${address.split(',').slice(-2).join(',').trim() || address}</text>

    <!-- Place of Residence -->
    <text x="0" y="160" font-size="12" fill="#475569">Nơi thường trú / Place of residence:</text>
    <text x="0" y="182" font-size="13" font-weight="bold" fill="#0f172a">${address}</text>
  </g>

  <!-- Watermark Flag -->
  <g opacity="0.08" transform="translate(680, 360)">
    <rect width="130" height="90" fill="#dc2626" rx="6"/>
    <polygon points="65,25 70,39 85,39 73,48 77,63 65,54 53,63 57,48 45,39 60,39" fill="#facc15"/>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Tạo SVG data URL cho Mặt sau CCCD chuẩn Việt Nam (có chip điện tử, mã QR & MRZ)
 */
export function generateSvgIdCardBack(worker: Worker): string {
  const citizenId = worker.citizenId || '038096001234';
  const birthYear = (worker.birthDate || '1995').split('-')[0]?.substring(2) || '95';
  const birthMonth = (worker.birthDate || '1995-01-01').split('-')[1] || '01';
  const birthDay = (worker.birthDate || '1995-01-01').split('-')[2] || '01';
  const sexCode = worker.gender === 'Nữ' ? 'F' : 'M';
  const cleanName = (worker.fullName || 'NGUYEN VAN A')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .trim()
    .replace(/\s+/g, '<');

  // ICAO Machine Readable Zone (MRZ) 3-lines standard
  const line1 = `IDVNM${citizenId.padEnd(12, '<')}8<<<<<<<<<<<`;
  const line2 = `${birthYear}${birthMonth}${birthDay}8${sexCode}3012314VNM<<<<<<<<<<<2`;
  const line3 = `${cleanName}<<<<<<<<<<<<<<<<<<<<<<<<<<<<`.substring(0, 30);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <defs>
    <linearGradient id="bgBack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="50%" stop-color="#eff6ff"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <pattern id="guillocheBack" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M0 20 Q 20 0 40 20 T 80 20" fill="none" stroke="#cbd5e1" stroke-width="0.5" opacity="0.3"/>
      <path d="M20 0 Q 40 20 20 40 T 20 80" fill="none" stroke="#93c5fd" stroke-width="0.5" opacity="0.2"/>
    </pattern>
  </defs>

  <!-- Card Border & Background -->
  <rect x="2" y="2" width="852" height="536" rx="28" fill="url(#bgBack)" stroke="#94a3b8" stroke-width="3"/>
  <rect x="10" y="10" width="836" height="520" rx="22" fill="url(#guillocheBack)"/>

  <!-- Left: Personal Identification -->
  <g transform="translate(46, 40)" font-family="Arial, sans-serif">
    <text x="0" y="0" font-size="13" font-weight="bold" fill="#334155">Đặc điểm nhân dạng / Personal identification:</text>
    <text x="0" y="24" font-size="13" fill="#0f172a">Nốt ruồi cách 1cm dưới sau đuôi lông mày trái</text>

    <text x="0" y="68" font-size="13" font-weight="bold" fill="#334155">Ngày, tháng, năm / Date, month, year:</text>
    <text x="260" y="68" font-size="13" font-weight="bold" fill="#0f172a">10/05/2021</text>

    <!-- Authority Title -->
    <text x="180" y="112" font-size="14" font-weight="bold" fill="#dc2626" text-anchor="middle">GIÁM ĐỐC TRUNG TÂM DỮ LIỆU QUỐC GIA</text>
    <text x="180" y="130" font-size="14" font-weight="bold" fill="#dc2626" text-anchor="middle">VỀ DÂN CƯ</text>
    
    <!-- Red Seal & Signature Box -->
    <g transform="translate(110, 142)">
      <circle cx="70" cy="40" r="36" fill="#dc2626" opacity="0.18" stroke="#dc2626" stroke-width="2"/>
      <circle cx="70" cy="40" r="30" fill="none" stroke="#dc2626" stroke-width="1" stroke-dasharray="2,2"/>
      <text x="70" y="36" font-size="9" font-weight="bold" fill="#dc2626" text-anchor="middle">BỘ CÔNG AN</text>
      <text x="70" y="48" font-size="8" fill="#dc2626" text-anchor="middle">CỤC C06</text>
      <!-- Signature line -->
      <path d="M 40 50 Q 70 20 100 50 T 130 40" fill="none" stroke="#1d4ed8" stroke-width="2"/>
    </g>
  </g>

  <!-- Right: Electronic Smart Chip & QR Code -->
  <g transform="translate(560, 40)">
    <!-- Electronic Smart Chip (Gold Contact Pad) -->
    <rect x="0" y="0" width="130" height="96" rx="8" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
    <!-- Chip Contact Lines -->
    <line x1="45" y1="0" x2="45" y2="96" stroke="#a16207" stroke-width="1.5"/>
    <line x1="85" y1="0" x2="85" y2="96" stroke="#a16207" stroke-width="1.5"/>
    <line x1="0" y1="48" x2="130" y2="48" stroke="#a16207" stroke-width="1.5"/>
    <rect x="45" y="26" width="40" height="44" rx="4" fill="#fef08a" stroke="#a16207" stroke-width="1.5"/>
    <text x="65" y="52" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#854d0e" text-anchor="middle">CHIP</text>

    <!-- QR Code (Authentic look) -->
    <g transform="translate(150, 0)">
      <rect x="0" y="0" width="96" height="96" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
      <!-- QR Marker Corners -->
      <rect x="6" y="6" width="24" height="24" fill="#0f172a"/>
      <rect x="10" y="10" width="16" height="16" fill="#ffffff"/>
      <rect x="13" y="13" width="10" height="10" fill="#0f172a"/>

      <rect x="66" y="6" width="24" height="24" fill="#0f172a"/>
      <rect x="70" y="10" width="16" height="16" fill="#ffffff"/>
      <rect x="73" y="13" width="10" height="10" fill="#0f172a"/>

      <rect x="6" y="66" width="24" height="24" fill="#0f172a"/>
      <rect x="10" y="70" width="16" height="16" fill="#ffffff"/>
      <rect x="13" y="73" width="10" height="10" fill="#0f172a"/>

      <!-- Random Data Dots pattern -->
      <rect x="36" y="12" width="6" height="6" fill="#0f172a"/>
      <rect x="48" y="18" width="6" height="6" fill="#0f172a"/>
      <rect x="42" y="32" width="6" height="6" fill="#0f172a"/>
      <rect x="54" y="44" width="6" height="6" fill="#0f172a"/>
      <rect x="18" y="42" width="6" height="6" fill="#0f172a"/>
      <rect x="72" y="42" width="6" height="6" fill="#0f172a"/>
      <rect x="36" y="58" width="6" height="6" fill="#0f172a"/>
      <rect x="48" y="72" width="6" height="6" fill="#0f172a"/>
      <rect x="60" y="66" width="6" height="6" fill="#0f172a"/>
      <rect x="78" y="78" width="6" height="6" fill="#0f172a"/>
    </g>

    <!-- Fingerprint Silhouette placeholder -->
    <g transform="translate(150, 114)">
      <rect x="0" y="0" width="96" height="120" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
      <path d="M 48 30 C 25 30 25 100 48 100 C 70 100 70 30 48 30" fill="none" stroke="#94a3b8" stroke-width="2"/>
      <path d="M 48 42 C 34 42 34 88 48 88 C 62 88 62 42 48 42" fill="none" stroke="#94a3b8" stroke-width="2"/>
      <path d="M 48 54 C 42 54 42 76 48 76 C 54 76 54 54 48 54" fill="none" stroke="#94a3b8" stroke-width="2"/>
      <text x="48" y="112" font-family="Arial, sans-serif" font-size="9" fill="#64748b" text-anchor="middle">VÂN TAY</text>
    </g>
  </g>

  <!-- Bottom: Machine Readable Zone (MRZ 3 lines) -->
  <g transform="translate(46, 390)">
    <rect x="0" y="0" width="764" height="120" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="382" y="34" font-family="'Courier New', Courier, monospace" font-size="21" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="3">${line1}</text>
    <text x="382" y="68" font-family="'Courier New', Courier, monospace" font-size="21" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="3">${line2}</text>
    <text x="382" y="102" font-family="'Courier New', Courier, monospace" font-size="21" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="3">${line3}</text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Returns either the real uploaded image or fallback SVG image for front side
 */
export function getWorkerFrontCard(worker: Worker): { url: string; isRealPhoto: boolean } {
  if (worker.idCardFrontUrl) {
    return { url: worker.idCardFrontUrl, isRealPhoto: true };
  }
  if (worker.idCardUrl) {
    return { url: worker.idCardUrl, isRealPhoto: true };
  }
  return { url: generateSvgIdCardFront(worker), isRealPhoto: false };
}

/**
 * Returns either the real uploaded image or fallback SVG image for back side
 */
export function getWorkerBackCard(worker: Worker): { url: string; isRealPhoto: boolean } {
  if (worker.idCardBackUrl) {
    return { url: worker.idCardBackUrl, isRealPhoto: true };
  }
  return { url: generateSvgIdCardBack(worker), isRealPhoto: false };
}

/**
 * Convert any image URL (data URL, SVG data URI, or blob) into a downloaded file
 */
export function triggerFileDownload(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Create a canvas and render 2-sided card on a single composite image
 */
export async function createCompositeCardImage(
  worker: Worker, 
  frontUrl: string, 
  backUrl: string,
  roomName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    // Canvas dimensions for A4 or clean landscape card pair (1800 x 1200)
    canvas.width = 1800;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header banner
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText(`KÝ TÚC XÁ - CĂN CƯỚC CÔNG DÂN 2 MẶT (${roomName.toUpperCase()})`, 60, 75);

    ctx.fillStyle = '#475569';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText(`Họ tên: ${worker.fullName} | CCCD: ${worker.citizenId} | Giường #${worker.bedNumber} | Ngày sinh: ${getCleanDate(worker.birthDate)}`, 60, 120);

    // Horizontal divider
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 145);
    ctx.lineTo(1740, 145);
    ctx.stroke();

    // Section Titles
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText('1. MẶT TRƯỚC (FRONT SIDE)', 60, 200);
    ctx.fillText('2. MẶT SAU (BACK SIDE)', 930, 200);

    const cardWidth = 810;
    const cardHeight = 510;
    const topY = 230;

    let loadedCount = 0;
    const imgFront = new Image();
    const imgBack = new Image();

    const finish = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Draw card borders with shadow
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;

        // Front
        ctx.drawImage(imgFront, 60, topY, cardWidth, cardHeight);
        ctx.strokeRect(60, topY, cardWidth, cardHeight);

        // Back
        ctx.drawImage(imgBack, 930, topY, cardWidth, cardHeight);
        ctx.strokeRect(930, topY, cardWidth, cardHeight);

        // Information footer
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(60, 770, 1680, 360);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(60, 770, 1680, 360);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.fillText('THÔNG TIN CHI TIẾT CÔNG NHÂN LƯU TRÚ', 90, 825);

        ctx.font = '22px Arial, sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText(`• Mã nhân viên: ${worker.code || 'N/A'}`, 90, 880);
        ctx.fillText(`• Giới tính: ${worker.gender}`, 90, 930);
        ctx.fillText(`• Nơi thường trú: ${worker.address || 'Chưa cập nhật'}`, 90, 980);
        ctx.fillText(`• Tổ trưởng quản lý: ${worker.teamLeaderName || 'Chưa có'} (${worker.teamLeaderPhone || 'N/A'})`, 90, 1030);

        ctx.fillText(`• Vị trí lưu trú: ${roomName} - Giường #${worker.bedNumber} - ${worker.lockerNumber || 1} tủ`, 930, 880);
        ctx.fillText(`• Ngày vào KTX: ${getCleanDate(worker.startDate)}`, 930, 930);
        ctx.fillText(`• Trạng thái: ${worker.status === 'active' ? 'Đang lưu trú' : 'Tạm vắng'}`, 930, 980);
        ctx.fillText(`• Thời gian xuất bản: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`, 930, 1030);

        try {
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(canvas.toDataURL());
        }
      }
    };

    imgFront.crossOrigin = 'anonymous';
    imgBack.crossOrigin = 'anonymous';

    imgFront.onload = finish;
    imgBack.onload = finish;
    imgFront.onerror = () => {
      // Fallback in case of image load error
      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(60, topY, cardWidth, cardHeight);
      finish();
    };
    imgBack.onerror = () => {
      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(930, topY, cardWidth, cardHeight);
      finish();
    };

    imgFront.src = frontUrl;
    imgBack.src = backUrl;
  });
}
