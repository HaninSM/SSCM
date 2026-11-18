/**
 * UI Utilities & Formatters (Matching TokoJendral Style)
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
    switch (status) {
      case 'BOOKED':
        return '<span class="badge" style="background:#f1f5f9; color:#64748b;">TERJADWAL</span>';
      case 'QUEUED':
        return '<span class="badge badge-info">MENUNGGU</span>';
      case 'IN_PROGRESS':
        return '<span class="badge badge-warning">DIKERJAKAN</span>';
      case 'READY_TO_PAY':
        return '<span class="badge badge-success">SIAP BAYAR</span>';
      case 'COMPLETED':
        return '<span class="badge badge-success">LUNAS</span>';
      case 'CANCELLED':
        return '<span class="badge badge-danger">BATAL</span>';
      default:
        return `<span class="badge">${status}</span>`;
    }
  },

  businessBadge(type) {
    if (type === 'WORKSHOP') {
      return '<span class="badge" style="background:#fef3c7; color:#b45309;">🔧 BENGKEL</span>';
    } else if (type === 'SALON') {
      return '<span class="badge" style="background:#fce7f3; color:#be185d;">✂️ SALON</span>';
    }
    return '<span class="badge" style="background:#e2e8f0; color:#475569;">🌐 UMUM</span>';
  }
};
