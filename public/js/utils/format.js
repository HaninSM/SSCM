/**
 * UI Utilities & Formatters
 */
const Format = {
  rupiah(number) {
    if (number === null || number === undefined || isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  },

  dateTime(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  },

  timeOnly(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  },

  statusBadge(status) {
    const map = {
      'BOOKED': { label: 'Terjadwal', cls: 'badge-booked', color: '#64748b', bg: '#f1f5f9' },
      'QUEUED': { label: 'Menunggu', cls: 'badge-queued', color: '#0284c7', bg: '#e0f2fe' },
      'IN_PROGRESS': { label: 'Dikerjakan', cls: 'badge-in-progress', color: '#b45309', bg: '#fef3c7' },
      'READY_TO_PAY': { label: 'Siap Bayar', cls: 'badge-ready', color: '#059669', bg: '#d1fae5' },
      'COMPLETED': { label: 'Lunas', cls: 'badge-completed', color: '#10b981', bg: '#ecfdf5' },
      'CANCELLED': { label: 'Batal', cls: 'badge-cancelled', color: '#dc2626', bg: '#fee2e2' }
    };

    const s = map[status] || { label: status, cls: 'badge-default', color: '#64748b', bg: '#f1f5f9' };
    return `<span class="badge ${s.cls}" style="background: ${s.bg}; color: ${s.color}; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.72rem;">${s.label}</span>`;
  },

  businessBadge(type) {
    if (type === 'WORKSHOP') {
      return `<span class="card-badge badge-workshop" style="background: #fef3c7; color: #b45309; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 9999px;">🔧 BENGKEL</span>`;
    } else if (type === 'SALON') {
      return `<span class="card-badge badge-salon" style="background: #fce7f3; color: #be185d; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 9999px;">✂️ SALON</span>`;
    }
    return `<span class="card-badge" style="background: #e2e8f0; color: #475569; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 9999px;">🌐 UMUM</span>`;
  }
};
