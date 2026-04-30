function num(value, digits = 2) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: n % 1 === 0 ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(n);
}
function integer(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value ?? 0));
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]+/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] || ch));
}
function normalizeText(value) {
  return String(value ?? '').toLowerCase().trim();
}
function placeholderImage(seed = 'item') {
  const text = String(seed).slice(0, 18) || 'item';
  const safeText = text.replace(/[<>&"]/g, '');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
      <rect width="640" height="640" fill="#FAF9F6"/>
      <rect x="24" y="24" width="592" height="592" rx="54" fill="#FAF9F6" stroke="#D4AF37" stroke-width="12"/>
      <circle cx="320" cy="262" r="132" fill="#D4AF37" opacity=".18"/>
      <text x="320" y="350" text-anchor="middle" font-size="64" font-family="Arial, sans-serif" font-weight="900" fill="#000000">${safeText}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
function sanitizeToastMessage(message) {
  return String(message ?? '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function randomDelay() {
  return 25000 + Math.floor(Math.random() * 15000);
}

const INVOICE_COUNTER_STORAGE = 'b2b_invoice_counter';
function isNumericLike(value) {
  return /^\d+$/.test(String(value ?? '').trim());
}
function compareNatural(a, b) {
  return String(a ?? '').trim().localeCompare(String(b ?? '').trim(), 'en', { numeric: true, sensitivity: 'base' });
}
function sortCompanies(rows = []) {
  return [...rows].sort((a, b) => compareNatural(a.company_id ?? a.id ?? '', b.company_id ?? b.id ?? ''));
}
function sortProducts(rows = []) {
  return [...rows].sort((a, b) => compareNatural(a.product_name ?? '', b.product_name ?? ''));
}
function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}
function countdownTo(value) {
  const target = new Date(value).getTime();
  if (!Number.isFinite(target)) return '';
  let diff = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}ي ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const STATUS_MAP = {
  draft: 'مسودة',
  pending: 'تحت المراجعة',
  confirmed: 'تم الموافقة',
  processing: 'تحت التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم الاستلام',
  paid: 'تم الدفع',
  submitted: 'تم الإرسال',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  rejected: 'مرفوض',
};
function getStatusLabel(status) {
  return STATUS_MAP[String(status || '').trim()] || String(status || 'غير معروف');
}
function arabicStatus(status) {
  return getStatusLabel(status);
}
