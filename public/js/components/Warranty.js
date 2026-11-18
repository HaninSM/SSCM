/**
 * Warranty & Asset History Component (Klaim Garansi & Riwayat Servis Lengkap)
 * Follows TokoJendral Design System (.invoices-card, .table-container, .stats-grid, etc.)
 */
const Warranty = {
  currentTab: 'claims', // 'claims' or 'assets'
  claims: [],
  selectedStatusFilter: 'ALL',
  assets: [],
  searchQuery: '',
  resources: [],
  staffList: [],
  itemsCatalog: [],

  async render() {
    const content = document.getElementById('contentArea');
    if (!content) return;

    content.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">Memuat modul Aset & Klaim Garansi...</div>';

    try {
      await this.loadInitialData();
      this.renderView();
    } catch (err) {
      content.innerHTML = `
        <div class="error-message" style="display:block; padding:16px;">
          <b>Gagal memuat data garansi:</b> ${err.message}
        </div>
      `;
    }
  },

  async loadInitialData() {
    const [claimsRes, resourcesRes, staffRes, itemsRes] = await Promise.all([
      API.get('/warranties/claims'),
      API.get('/services/resources').catch(() => ({ resources: [] })),
      API.get('/services/staff').catch(() => ({ staff: [] })),
      API.get('/items').catch(() => ({ items: [] }))
    ]);

    this.claims = claimsRes.claims || [];
    this.resources = resourcesRes.resources || [];
    this.staffList = staffRes.staff || [];
    this.itemsCatalog = itemsRes.items || [];
  },

  renderView() {
    const content = document.getElementById('contentArea');
    if (!content) return;

    // Calculate metrics
    const totalClaims = this.claims.length;
    const pendingClaims = this.claims.filter(c => c.status === 'SUBMITTED' || c.status === 'INSPECTING').length;
    const approvedClaims = this.claims.filter(c => c.status === 'APPROVED' || c.status === 'RESOLVED').length;
    const totalExpense = this.claims.reduce((acc, c) => acc + (Number(c.total_claim_cost) || 0), 0);

    content.innerHTML = `
      <div class="warranty-module-container" style="display: flex; flex-direction: column; gap: 20px;">
        <!-- Top Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(26, 98, 255, 0.1); color: var(--primary);">🛡️</div>
            <div class="stat-info">
              <span class="stat-label">Total Klaim Terdaftar</span>
              <h3 class="stat-value">${totalClaims}</h3>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">⏳</div>
            <div class="stat-info">
              <span class="stat-label">Menunggu Tindakan / QC</span>
              <h3 class="stat-value" style="color: var(--warning);">${pendingClaims}</h3>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">✅</div>
            <div class="stat-info">
              <span class="stat-label">Klaim Disetujui (SPK Rp 0)</span>
              <h3 class="stat-value" style="color: var(--success);">${approvedClaims}</h3>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: var(--danger);">🏷️</div>
            <div class="stat-info">
              <span class="stat-label">Beban Biaya Mutu (QA Cost)</span>
              <h3 class="stat-value" style="color: var(--danger); font-size: 1.3rem;">${Format.rupiah(totalExpense)}</h3>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs between Claims & Asset History -->
        <div style="display: flex; gap: 12px; border-bottom: 2px solid var(--border-subtle); padding-bottom: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm ${this.currentTab === 'claims' ? 'btn-primary' : 'btn-secondary'}" onclick="Warranty.switchTab('claims')">
              🛡️ Papan Klaim Garansi (${this.claims.length})
            </button>
            <button class="btn btn-sm ${this.currentTab === 'assets' ? 'btn-primary' : 'btn-secondary'}" onclick="Warranty.switchTab('assets')">
              🚗 Riwayat Servis Aset & Pelanggan
            </button>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="Warranty.render()">🔄 Refresh</button>
            <button class="btn btn-primary btn-sm" onclick="Warranty.openSubmitClaimModal()">➕ Ajukan Klaim Garansi</button>
          </div>
        </div>

        <!-- Tab Content -->
        <div id="warrantyTabContent">
          ${this.currentTab === 'claims' ? this.renderClaimsTabHtml() : this.renderAssetsTabHtml()}
        </div>
      </div>
    `;

    if (this.currentTab === 'assets' && this.searchQuery) {
      this.performAssetSearch();
    }
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  /* =========================================================================
   * TAB 1: CLAIMS LIST & ACTIONS
   * ========================================================================= */
  renderClaimsTabHtml() {
    const filteredClaims = this.selectedStatusFilter === 'ALL'
      ? this.claims
      : this.claims.filter(c => c.status === this.selectedStatusFilter);

    return `
      <div class="invoices-card">
        <div class="invoices-header" style="flex-wrap: wrap; gap: 12px;">
          <div>
            <h3>Daftar Pengajuan Klaim Garansi</h3>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              Pengerjaan ulang tidak memotong komisi mekanik/terapis asli secara sepihak dan dibukukan sebagai Beban Mutu (QA Expense).
            </p>
          </div>
          <!-- Status Filter -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${['ALL', 'SUBMITTED', 'INSPECTING', 'APPROVED', 'REJECTED', 'RESOLVED'].map(st => `
              <button class="btn btn-sm ${this.selectedStatusFilter === st ? 'btn-primary' : 'btn-secondary'}" onclick="Warranty.filterStatus('${st}')" style="font-size: 12px; padding: 4px 10px;">
                ${this.getStatusLabel(st)}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>No. Klaim / Tgl</th>
                <th>SPK Asal</th>
                <th>Aset & Pelanggan</th>
                <th>Keluhan Pelanggan</th>
                <th>Hasil QC / Root Cause</th>
                <th style="text-align: right;">Beban Mutu</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: center;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${filteredClaims.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; padding: 32px; color: var(--text-muted);">
                    Tidak ada klaim garansi pada kategori ini.
                  </td>
                </tr>
              ` : filteredClaims.map(c => `
                <tr>
                  <td>
                    <div style="font-weight: 700; color: var(--primary);">${c.claim_number}</div>
                    <div style="font-size: 11.5px; color: var(--text-muted);">${Format.dateTime(c.claim_date)}</div>
                  </td>
                  <td>
                    <div style="font-weight: 600;">${c.original_order_number || ('SPK #' + c.original_service_order_id)}</div>
                    <div style="font-size: 11.5px; color: var(--text-muted);">${Format.businessBadge(c.business_type || 'WORKSHOP')}</div>
                  </td>
                  <td>
                    <div style="font-weight: 700;">${c.asset_identifier || '-'}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${c.customer_name || '-'}</div>
                    ${c.claim_odometer ? `<div style="font-size: 11px; color: #64748b;">Km: ${c.claim_odometer.toLocaleString('id-ID')}</div>` : ''}
                  </td>
                  <td>
                    <div style="max-width: 200px; font-size: 12.5px; line-height: 1.4; color: var(--text-main);" title="${c.complaint_reason}">
                      ${c.complaint_reason || '-'}
                    </div>
                  </td>
                  <td>
                    ${c.root_cause ? `
                      <span class="badge badge-warning" style="font-size: 11px;">${c.root_cause}</span>
                      <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">${c.inspection_result || ''}</div>
                    ` : '<span style="font-size: 11.5px; color: var(--text-light); font-style: italic;">Belum diinspeksi</span>'}
                  </td>
                  <td style="text-align: right; font-weight: 700; color: ${Number(c.total_claim_cost) > 0 ? 'var(--danger)' : 'var(--text-muted)'};">
                    ${Format.rupiah(c.total_claim_cost || 0)}
                  </td>
                  <td style="text-align: center;">
                    ${this.renderClaimStatusBadge(c.status)}
                  </td>
                  <td style="text-align: center;">
                    <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
                      <button class="btn btn-secondary btn-sm" onclick="Warranty.openDetailModal(${c.id})" title="Rincian Klaim" style="padding: 4px 8px; font-size: 12px;">
                        👁️
                      </button>
                      ${c.status === 'SUBMITTED' ? `
                        <button class="btn btn-secondary btn-sm" onclick="Warranty.openInspectModal(${c.id})" title="Inspeksi QC" style="padding: 4px 8px; font-size: 12px; color: #d97706; border-color: #f59e0b;">
                          🔍 QC
                        </button>
                      ` : ''}
                      ${(c.status === 'SUBMITTED' || c.status === 'INSPECTING') ? `
                        <button class="btn btn-primary btn-sm" onclick="Warranty.openApproveModal(${c.id})" title="Setujui & Terbitkan SPK Rp 0" style="padding: 4px 8px; font-size: 12px; background: #059669; border-color: #059669;">
                          ✅ Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="Warranty.openRejectModal(${c.id})" title="Tolak Klaim" style="padding: 4px 8px; font-size: 12px;">
                          ❌
                        </button>
                      ` : ''}
                      ${c.rework_service_order_id ? `
                        <button class="btn btn-sm" onclick="Warranty.viewReworkOrder(${c.rework_service_order_id})" title="Buka SPK Rework Rp 0" style="padding: 4px 8px; font-size: 11px; background: #eff6ff; color: #1a62ff; border: 1px solid #bfdbfe;">
                          SPK Rp 0 ➔
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  filterStatus(st) {
    this.selectedStatusFilter = st;
    const tabContent = document.getElementById('warrantyTabContent');
    if (tabContent) {
      tabContent.innerHTML = this.renderClaimsTabHtml();
    }
  },

  getStatusLabel(st) {
    switch (st) {
      case 'ALL': return 'Semua';
      case 'SUBMITTED': return 'Diajukan';
      case 'INSPECTING': return 'Inspeksi QC';
      case 'APPROVED': return 'Disetujui (SPK Rp 0)';
      case 'REJECTED': return 'Ditolak';
      case 'RESOLVED': return 'Selesai';
      default: return st;
    }
  },

  renderClaimStatusBadge(st) {
    switch (st) {
      case 'SUBMITTED':
        return '<span class="badge badge-info" style="font-size: 11px;">DIAJUKAN</span>';
      case 'INSPECTING':
        return '<span class="badge badge-warning" style="font-size: 11px;">INSPEKSI QC</span>';
      case 'APPROVED':
        return '<span class="badge badge-success" style="font-size: 11px;">DISETUJUI</span>';
      case 'REJECTED':
        return '<span class="badge badge-danger" style="font-size: 11px;">DITOLAK</span>';
      case 'RESOLVED':
        return '<span class="badge" style="background:#f1f5f9; color:#475569; font-size: 11px;">SELESAI</span>';
      default:
        return `<span class="badge">${st}</span>`;
    }
  },

  /* =========================================================================
   * TAB 2: ASSET HISTORY & SEARCH
   * ========================================================================= */
  renderAssetsTabHtml() {
    return `
      <div class="invoices-card">
        <div class="invoices-header" style="flex-wrap: wrap; gap: 12px;">
          <div>
            <h3>Cari Riwayat Servis Aset & Pelanggan</h3>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              Pencarian lintas waktu untuk melihat riwayat perawatan berkala, suku cadang terpasang, serta catatan riwayat alergi pelanggan.
            </p>
          </div>
          <!-- Search input box -->
          <div style="display: flex; gap: 8px; width: 100%; max-width: 420px;">
            <input type="text" id="assetSearchInput" class="form-control" placeholder="Ketik Plat No (B 4128 SZZ) atau Nama/No HP..." value="${this.searchQuery}" onkeyup="if(event.key==='Enter') Warranty.handleAssetSearch()" style="font-size: 13px;" />
            <button class="btn btn-primary btn-sm" onclick="Warranty.handleAssetSearch()">🔍 Cari</button>
          </div>
        </div>

        <div id="assetSearchResults">
          <div style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 13.5px;">
            Silakan masukkan nomor plat kendaraan, nama pelanggan, atau nomor telepon untuk melihat rekam servis lengkap.
          </div>
        </div>
      </div>
    `;
  },

  async handleAssetSearch() {
    const input = document.getElementById('assetSearchInput');
    if (!input) return;
    this.searchQuery = input.value.trim();
    if (!this.searchQuery) {
      App.toast('Silakan masukkan kata kunci pencarian', 'info');
      return;
    }
    await this.performAssetSearch();
  },

  async performAssetSearch() {
    const container = document.getElementById('assetSearchResults');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">Mencari database aset & riwayat SPK...</div>';

    try {
      const res = await API.get('/assets/search', { q: this.searchQuery });
      const assets = res.assets || [];

      if (assets.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            Tidak ditemukan aset atau pelanggan dengan kata kunci: <b>"${this.searchQuery}"</b>.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; padding: 8px 0;">
          ${assets.map(a => this.renderAssetCard(a)).join('')}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-message" style="display:block;">${err.message}</div>`;
    }
  },

  renderAssetCard(a) {
    const hasAllergy = !!a.allergy_alert;
    const historyCount = (a.service_history || []).length;

    return `
      <div class="card" style="border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; box-shadow: var(--shadow-card);">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <span class="badge ${a.business_type === 'WORKSHOP' ? 'badge-primary' : 'badge-pink'}" style="font-size: 11px;">
                ${a.business_type === 'WORKSHOP' ? '🔧 BENGKEL' : '✂️ SALON'}
              </span>
              <span style="font-size: 11px; color: var(--text-light); margin-left: 6px;">${a.asset_type || 'ASET'}</span>
            </div>
            <span style="font-size: 12px; font-weight: 700; color: var(--text-muted);">${historyCount} Servis</span>
          </div>

          <h3 style="font-size: 17px; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">
            ${a.identifier}
          </h3>
          <div style="font-size: 13px; font-weight: 600; color: var(--text-muted);">
            👤 ${a.customer_name} ${a.customer_phone ? `(${a.customer_phone})` : ''}
          </div>

          ${a.last_odometer ? `
            <div style="font-size: 12px; color: #475569; margin-top: 6px; background: #f8fafc; padding: 4px 8px; border-radius: 6px; display: inline-block;">
              🚗 Odometer Terakhir: <b>${a.last_odometer.toLocaleString('id-ID')} KM</b>
            </div>
          ` : ''}

          <!-- Medical / Allergy Warning for Salon & Workshop -->
          ${hasAllergy ? `
            <div style="margin-top: 10px; padding: 8px 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; font-size: 12px; color: #991b1b; display: flex; gap: 6px; align-items: flex-start;">
              <span>⚠️</span>
              <div>
                <b>PERINGATAN ALERGI:</b> ${a.allergy_alert}
              </div>
            </div>
          ` : ''}
        </div>

        <div style="border-top: 1px solid var(--border-light); padding-top: 10px; display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" onclick="Warranty.openAssetTimelineModal(${a.id})" style="flex: 1; font-size: 12px;">
            📋 Riwayat SPK (${historyCount})
          </button>
          <button class="btn btn-primary btn-sm" onclick="Warranty.openSubmitClaimModalForAsset('${a.identifier}')" style="font-size: 12px;">
            🛡️ Klaim
          </button>
        </div>
      </div>
    `;
  },

  /* =========================================================================
   * MODALS & ACTIONS
   * ========================================================================= */

  // Modal 1: Asset Timeline Modal
  async openAssetTimelineModal(assetId) {
    try {
      const res = await API.get(`/assets/${assetId}`);
      const asset = res.asset;
      const history = asset.service_history || [];
      const modal = document.getElementById('modalContainer');

      modal.innerHTML = `
        <div class="modal modal-lg">
          <div class="modal-header">
            <div>
              <h3>Rekam Servis Lengkap: ${asset.identifier}</h3>
              <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
                Pemilik: <b>${asset.customer_name}</b> • Total Kunjungan: <b>${history.length} kali</b>
              </div>
            </div>
            <button class="modal-close" onclick="App.closeModal()">✕</button>
          </div>

          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            ${asset.allergy_alert ? `
              <div style="margin-bottom: 16px; padding: 12px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: var(--radius-md); font-size: 13px; color: #991b1b;">
                🚨 <b>PERINGATAN KHUSUS PELANGGAN:</b> ${asset.allergy_alert}
              </div>
            ` : ''}

            ${history.length === 0 ? `
              <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                Belum ada riwayat SPK untuk aset ini.
              </div>
            ` : `
              <div class="timeline" style="display: flex; flex-direction: column; gap: 16px;">
                ${history.map((order, idx) => `
                  <div style="border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; background: #ffffff; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                      <div>
                        <div style="font-weight: 800; font-size: 14px; color: var(--primary);">
                          ${order.order_number}
                          ${order.is_warranty_rework ? '<span class="badge badge-warning" style="margin-left: 6px;">SPK REWORK GARANSI Rp 0</span>' : ''}
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                          📅 ${Format.dateTime(order.scheduled_start)} • Teknisi/Terapis: <b>${order.staff_name || '-'}</b> • Tempat: <b>${order.resource_name || '-'}</b>
                        </div>
                      </div>
                      <div>
                        ${Format.statusBadge(order.status)}
                      </div>
                    </div>

                    ${order.odometer_km ? `
                      <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
                        🚗 Odometer: <b>${Number(order.odometer_km).toLocaleString('id-ID')} KM</b>
                        ${order.warranty_exp_km ? ` • Garansi KM s/d: <b>${Number(order.warranty_exp_km).toLocaleString('id-ID')} KM</b>` : ''}
                        ${order.warranty_exp_date ? ` • Garansi Hari s/d: <b>${Format.dateTime(order.warranty_exp_date)}</b>` : ''}
                      </div>
                    ` : ''}

                    <div style="font-size: 12.5px; margin-bottom: 8px; color: var(--text-muted);">
                      <b>Item Jasa & Bahan Terpasang:</b>
                    </div>
                    <div style="background: #f8fafc; border-radius: 8px; padding: 8px 12px;">
                      ${(order.items || []).map(i => `
                        <div style="display: flex; justify-content: space-between; font-size: 12.5px; padding: 3px 0; border-bottom: 1px dashed #e2e8f0;">
                          <span>${i.item_type === 'SERVICE' ? '⚡' : '📦'} ${i.item_name} (x${i.qty})</span>
                          <span style="font-weight: 600;">${Format.rupiah(i.subtotal)}</span>
                        </div>
                      `).join('')}
                      <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; padding-top: 6px; color: var(--text-main);">
                        <span>Total Nilai Servis:</span>
                        <span>${Format.rupiah(order.grand_total)}</span>
                      </div>
                    </div>

                    ${order.status === 'COMPLETED' ? `
                      <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                        <button class="btn btn-secondary btn-sm" onclick="App.closeModal(); Warranty.openSubmitClaimModalForOrder(${order.id}, '${order.order_number}', ${order.odometer_km || 0})" style="font-size: 11.5px;">
                          🛡️ Ajukan Garansi Untuk SPK Ini
                        </button>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal()">Tutup</button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  // Modal 2: Submit Warranty Claim Modal
  async openSubmitClaimModal(prefill = {}) {
    const modal = document.getElementById('modalContainer');
    
    // Fetch completed orders to populate select
    let completedOrders = [];
    try {
      const res = await API.get('/services/orders');
      completedOrders = (res.orders || []).filter(o => o.status === 'COMPLETED');
    } catch (err) {
      console.warn('Failed to load completed orders:', err);
    }

    modal.innerHTML = `
      <div class="modal modal-md">
        <div class="modal-header">
          <h3>🛡️ Pengajuan Klaim Garansi Layanan</h3>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <form id="submitClaimForm" onsubmit="Warranty.submitClaimForm(event)">
            <div class="form-group">
              <label>Pilih SPK Asal (Hanya yang berstatus COMPLETED) *</label>
              <select id="claim_order_id" required class="form-control" onchange="Warranty.onOrderSelectedForClaim(this.value)">
                <option value="">-- Pilih SPK Asal --</option>
                ${completedOrders.map(o => `
                  <option value="${o.id}" data-km="${o.odometer_km || 0}" data-asset="${o.asset_identifier}" data-customer="${o.customer_name}" ${prefill.orderId === o.id ? 'selected' : ''}>
                    ${o.order_number} - ${o.asset_identifier} (${o.customer_name})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label>Odometer Kendaraan Saat Klaim Diajukan (KM) *</label>
              <input type="number" id="claim_odometer" class="form-control" placeholder="Contoh: 46250" value="${prefill.odometer || ''}" oninput="Warranty.triggerValidityCheck()" />
              <small style="color: var(--text-muted); font-size: 11.5px;">Bagi unit Salon/Treatment, isi 0 atau biarkan kosong.</small>
            </div>

            <!-- Realtime Validity Check Banner -->
            <div id="validityAlertBox" style="display: none; padding: 12px; border-radius: var(--radius-md); margin-bottom: 16px; font-size: 13px;">
              <div id="validityAlertText"></div>
            </div>

            <div class="form-group">
              <label>Keluhan / Gejala Kerusakan Berulang *</label>
              <textarea id="claim_complaint" class="form-control" rows="3" required placeholder="Jelaskan kendala yang dirasakan pelanggan secara objektif..."></textarea>
            </div>

            <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
              <input type="checkbox" id="manager_override" value="1" />
              <label for="manager_override" style="font-size: 12.5px; cursor: pointer; color: #475569;">
                <b>Manager Override:</b> Setujui proses klaim meskipun sistem mendeteksi kedaluwarsa hari/KM (demi kepuasan pelanggan prioritas).
              </label>
            </div>

            <div class="modal-footer" style="padding: 16px 0 0 0;">
              <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
              <button type="submit" id="btnSubmitClaim" class="btn btn-primary">Daftarkan Klaim ➔</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

    if (prefill.orderId) {
      this.triggerValidityCheck();
    }
  },

  openSubmitClaimModalForOrder(orderId, orderNumber, odometer) {
    this.openSubmitClaimModal({ orderId, odometer });
  },

  openSubmitClaimModalForAsset(assetIdentifier) {
    this.openSubmitClaimModal();
  },

  onOrderSelectedForClaim(orderId) {
    if (!orderId) return;
    const select = document.getElementById('claim_order_id');
    const opt = select.options[select.selectedIndex];
    if (opt && opt.dataset.km) {
      document.getElementById('claim_odometer').value = Number(opt.dataset.km) + 50; // default simulate +50 km
    }
    this.triggerValidityCheck();
  },

  async triggerValidityCheck() {
    const orderId = document.getElementById('claim_order_id')?.value;
    const claimOdometer = document.getElementById('claim_odometer')?.value || 0;
    const alertBox = document.getElementById('validityAlertBox');
    const alertText = document.getElementById('validityAlertText');
    const btnSubmit = document.getElementById('btnSubmitClaim');
    const override = document.getElementById('manager_override');

    if (!orderId) {
      if (alertBox) alertBox.style.display = 'none';
      return;
    }

    try {
      const res = await API.get('/warranties/check', {
        original_order_id: orderId,
        claim_odometer: claimOdometer
      });

      alertBox.style.display = 'block';

      if (res.isValid) {
        alertBox.style.background = '#ecfdf5';
        alertBox.style.border = '1px solid #a7f3d0';
        alertBox.style.color = '#065f46';
        alertText.innerHTML = `
          <b>✅ GARANSI MEMENUHI SYARAT:</b><br/>
          • Waktu Berlalu: <b>${res.daysElapsed} hari</b> (Batas: ${res.maxDays} hari, Sisa: ${res.remainingDays} hari)<br/>
          ${res.maxKm > 0 ? `• Jarak Tempuh: <b>${res.kmElapsed} KM</b> (Batas: ${res.maxKm} KM, Sisa: ${res.remainingKm} KM)` : ''}
        `;
        if (btnSubmit) btnSubmit.disabled = false;
      } else {
        alertBox.style.background = '#fef2f2';
        alertBox.style.border = '1px solid #fecaca';
        alertBox.style.color = '#991b1b';
        alertText.innerHTML = `
          <b>⚠️ PERINGATAN KEDALUWARSA:</b><br/>
          ${res.reason}<br/>
          <small>Gunakan opsi <i>Manager Override</i> jika pimpinan tetap menyetujui klaim garansi ini.</small>
        `;
        if (btnSubmit && !override?.checked) {
          btnSubmit.disabled = true;
        }
      }

      if (override) {
        override.onchange = () => {
          if (btnSubmit) btnSubmit.disabled = !res.isValid && !override.checked;
        };
      }
    } catch (err) {
      console.warn('Validity check error:', err);
    }
  },

  async submitClaimForm(e) {
    e.preventDefault();
    const orderId = Number(document.getElementById('claim_order_id').value);
    const claimOdometer = Number(document.getElementById('claim_odometer').value) || 0;
    const complaint = document.getElementById('claim_complaint').value.trim();
    const managerOverride = document.getElementById('manager_override')?.checked || false;

    try {
      App.toast('Mendaftarkan klaim garansi...', 'info');
      const res = await API.post('/warranties/claims', {
        original_service_order_id: orderId,
        claim_odometer: claimOdometer,
        complaint_reason: complaint,
        manager_override: managerOverride
      });

      if (res.success) {
        App.toast(`Klaim ${res.claim.claim_number} berhasil didaftarkan!`, 'success');
        App.closeModal();
        this.render();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  // Modal 3: Detail Claim Modal
  openDetailModal(claimId) {
    const claim = this.claims.find(c => c.id === claimId);
    if (!claim) return;

    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
      <div class="modal modal-md">
        <div class="modal-header">
          <div>
            <h3>Rincian Klaim: ${claim.claim_number}</h3>
            <div style="font-size: 13px; color: var(--text-muted);">${Format.dateTime(claim.claim_date)} • ${this.renderClaimStatusBadge(claim.status)}</div>
          </div>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div style="background: #f8fafc; padding: 14px; border-radius: var(--radius-md); font-size: 13px; margin-bottom: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <span style="color: var(--text-muted);">SPK Asal:</span>
                <div style="font-weight: 700;">${claim.original_order_number || ('SPK #' + claim.original_service_order_id)}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Aset / Plat:</span>
                <div style="font-weight: 700;">${claim.asset_identifier || '-'}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Pelanggan:</span>
                <div style="font-weight: 700;">${claim.customer_name || '-'}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Odometer Klaim:</span>
                <div style="font-weight: 700;">${claim.claim_odometer ? `${claim.claim_odometer.toLocaleString('id-ID')} KM` : '-'}</div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Keluhan Pelanggan:</label>
            <div style="padding: 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; font-size: 13px; margin-top: 4px;">
              ${claim.complaint_reason}
            </div>
          </div>

          ${claim.inspection_result ? `
            <div style="margin-bottom: 16px;">
              <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Hasil QC & Root Cause:</label>
              <div style="padding: 10px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; font-size: 13px; margin-top: 4px;">
                <b>Root Cause:</b> ${claim.root_cause}<br/>
                <b>Catatan Inspeksi:</b> ${claim.inspection_result}
              </div>
            </div>
          ` : ''}

          ${claim.rework_service_order_id ? `
            <div style="padding: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; font-size: 13px; color: #065f46; margin-bottom: 16px;">
              ✅ <b>SPK Pengerjaan Ulang Terbit:</b> SPK #${claim.rework_service_order_id} (Biaya ke Konsumen: Rp 0)<br/>
              🏷️ <b>Beban Mutu Internal:</b> ${Format.rupiah(claim.total_claim_cost)}
            </div>
          ` : ''}
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="App.closeModal()">Tutup</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  },

  // Modal 4: QC Inspection Modal
  openInspectModal(claimId) {
    const claim = this.claims.find(c => c.id === claimId);
    if (!claim) return;

    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
      <div class="modal modal-md">
        <div class="modal-header">
          <h3>🔍 Inspeksi Quality Control (QC)</h3>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;">
            <div><b>Klaim:</b> ${claim.claim_number} • <b>Aset:</b> ${claim.asset_identifier || '-'}</div>
            <div style="color: var(--text-muted); margin-top: 4px;"><b>Keluhan:</b> ${claim.complaint_reason}</div>
          </div>

          <form id="inspectClaimForm" onsubmit="Warranty.submitInspectForm(event, ${claim.id})">
            <div class="form-group">
              <label>Akar Penyebab Kerusakan (Root Cause) *</label>
              <select id="qc_root_cause" required class="form-control">
                <option value="">-- Pilih Akar Masalah --</option>
                <option value="WORKMANSHIP_ERROR">Kesalahan Pengerjaan / Pemasangan (Workmanship Error)</option>
                <option value="DEFECTIVE_PART">Cacat Pabrik Suku Cadang (Defective Part)</option>
                <option value="CUSTOMER_MISUSE">Kelalaian Penggunaan Pelanggan (Customer Misuse)</option>
                <option value="OUTSIDE_WARRANTY_SCOPE">Di Luar Lingkup Servis Awal (Different Issue)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Catatan Teknis / Uji Fisik Lapangan *</label>
              <textarea id="qc_notes" required class="form-control" rows="3" placeholder="Tuliskan temuan fisik, pengukuran tegangan/tekanan, atau foto komponen yang aus..."></textarea>
            </div>

            <div class="modal-footer" style="padding: 16px 0 0 0;">
              <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
              <button type="submit" class="btn btn-primary">Simpan Hasil Inspeksi ➔</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  },

  async submitInspectForm(e, claimId) {
    e.preventDefault();
    const rootCause = document.getElementById('qc_root_cause').value;
    const notes = document.getElementById('qc_notes').value.trim();

    try {
      App.toast('Menyimpan hasil inspeksi...', 'info');
      const res = await API.put(`/warranties/claims/${claimId}/inspect`, {
        root_cause: rootCause,
        inspection_result: notes
      });

      if (res.success) {
        App.toast('Hasil inspeksi berhasil dicatat!', 'success');
        App.closeModal();
        this.render();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  // Modal 5: Approval Modal (Generate Zero-Cost SPK)
  openApproveModal(claimId) {
    const claim = this.claims.find(c => c.id === claimId);
    if (!claim) return;

    const modal = document.getElementById('modalContainer');
    const availableResources = this.resources.filter(r => r.status === 'AVAILABLE' || r.status === 'OCCUPIED');
    const consumables = this.itemsCatalog.filter(i => i.type === 'CONSUMABLE');

    modal.innerHTML = `
      <div class="modal modal-lg">
        <div class="modal-header">
          <div>
            <h3>✅ Persetujuan Klaim & Penerbitan SPK Rp 0</h3>
            <div style="font-size: 13px; color: var(--text-muted);">${claim.claim_number} • ${claim.asset_identifier || ''} (${claim.customer_name || ''})</div>
          </div>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <form id="approveClaimForm" onsubmit="Warranty.submitApproveForm(event, ${claim.id})">
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; font-size: 13px; color: #1e40af; margin-bottom: 16px;">
              <b>Prinsip Fair-Allocation & Zero-Cost:</b><br/>
              Pelanggan mendapatkan SPK perbaikan gratis (Rp 0). Biaya suku cadang pengganti otomatis dipotong melalui FIFO dan dibukukan ke Beban Mutu Garansi (QA Expense), bukan memotong komisi mekanik asli secara zalim.
            </div>

            <div class="form-grid-2" style="margin-bottom: 16px;">
              <div class="form-group">
                <label>Fasilitas / Pit / Meja Pengerjaan *</label>
                <select id="app_resource_id" required class="form-control">
                  <option value="">-- Pilih Fasilitas --</option>
                  ${availableResources.map(r => `
                    <option value="${r.id}">${r.code} - ${r.name}</option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label>Staf / Mekanik / Terapis Yang Bertugas *</label>
                <select id="app_staff_id" required class="form-control">
                  <option value="">-- Pilih Penanggung Jawab Pengerjaan --</option>
                  ${this.staffList.map(s => `
                    <option value="${s.id}">${s.staff_code} - ${s.name} (${s.role_title})</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Replacement parts selection -->
            <div class="form-group">
              <label>Suku Cadang Pengganti (Bila Ada Part Yang Rusak):</label>
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <select id="part_select" class="form-control" style="flex: 2;">
                  <option value="">-- Pilih Sparepart Pengganti Dari Stok --</option>
                  ${consumables.map(c => `
                    <option value="${c.id}" data-name="${c.name}" data-price="${c.price}">
                      ${c.code} - ${c.name} (Stok: ${c.stock || 0})
                    </option>
                  `).join('')}
                </select>
                <input type="number" id="part_qty" class="form-control" placeholder="Qty" min="1" value="1" style="flex: 0.5; max-width: 80px;" />
                <button type="button" class="btn btn-secondary btn-sm" onclick="Warranty.addReplacementPart()">+ Tambah</button>
              </div>

              <div id="replacementPartsTable" style="margin-top: 8px;">
                <table class="modern-table" style="font-size: 12.5px;">
                  <thead>
                    <tr>
                      <th>Nama Part</th>
                      <th style="text-align: center; width: 60px;">Qty</th>
                      <th style="text-align: center; width: 50px;">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="partsTableBody">
                    <tr><td colspan="3" style="text-align: center; color: var(--text-light);">Tidak ada part pengganti (hanya pengerjaan ulang jasa).</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="form-group">
              <label>Instruksi Pengerjaan Ulang Khusus:</label>
              <textarea id="app_notes" class="form-control" rows="2" placeholder="Catatan instruksi untuk mekanik/terapis..."></textarea>
            </div>

            <div class="modal-footer" style="padding: 16px 0 0 0;">
              <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
              <button type="submit" class="btn btn-primary" style="background: #059669; border-color: #059669;">
                Setujui & Terbitkan SPK Rp 0 ➔
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.selectedParts = [];
    modal.style.display = 'flex';
  },

  selectedParts: [],

  addReplacementPart() {
    const select = document.getElementById('part_select');
    const qtyInput = document.getElementById('part_qty');
    const itemId = Number(select?.value);
    const qty = Number(qtyInput?.value) || 1;

    if (!itemId) return;

    const opt = select.options[select.selectedIndex];
    const name = opt.dataset.name;

    this.selectedParts.push({ item_id: itemId, name, qty });
    this.renderSelectedParts();

    select.value = '';
    qtyInput.value = '1';
  },

  removeReplacementPart(idx) {
    this.selectedParts.splice(idx, 1);
    this.renderSelectedParts();
  },

  renderSelectedParts() {
    const tbody = document.getElementById('partsTableBody');
    if (!tbody) return;

    if (this.selectedParts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-light);">Tidak ada part pengganti (hanya pengerjaan ulang jasa).</td></tr>';
      return;
    }

    tbody.innerHTML = this.selectedParts.map((p, idx) => `
      <tr>
        <td style="font-weight: 600;">${p.name}</td>
        <td style="text-align: center;">${p.qty}</td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-danger btn-sm" onclick="Warranty.removeReplacementPart(${idx})" style="padding: 2px 6px; font-size: 11px;">✕</button>
        </td>
      </tr>
    `).join('');
  },

  async submitApproveForm(e, claimId) {
    e.preventDefault();
    const resourceId = Number(document.getElementById('app_resource_id').value);
    const staffId = Number(document.getElementById('app_staff_id').value);
    const notes = document.getElementById('app_notes').value.trim();

    try {
      App.toast('Memproses approval dan menerbitkan SPK Rp 0...', 'info');
      const res = await API.post(`/warranties/claims/${claimId}/approve`, {
        resource_id: resourceId,
        staff_id: staffId,
        notes: notes,
        replacement_parts: this.selectedParts
      });

      if (res.success) {
        App.toast('Klaim disetujui! SPK Rework Rp 0 berhasil diterbitkan.', 'success');
        App.closeModal();
        this.render();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  // Modal 6: Reject Modal
  openRejectModal(claimId) {
    const claim = this.claims.find(c => c.id === claimId);
    if (!claim) return;

    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
      <div class="modal modal-md">
        <div class="modal-header">
          <h3>❌ Tolak Klaim Garansi</h3>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <form id="rejectClaimForm" onsubmit="Warranty.submitRejectForm(event, ${claim.id})">
            <div style="background: #fef2f2; padding: 12px; border-radius: 8px; font-size: 13px; color: #991b1b; margin-bottom: 16px;">
              <b>Perhatian:</b> Penolakan klaim harus disertai dengan alasan teknis yang kuat (misal: kerusakan akibat tabrakan/modifikasi ekstrem atau bahan kimia salon non-standar).
            </div>

            <div class="form-group">
              <label>Alasan Penolakan Resmi *</label>
              <textarea id="rej_reason" required class="form-control" rows="3" placeholder="Tuliskan alasan penolakan secara jelas untuk disampaikan kepada pelanggan..."></textarea>
            </div>

            <div class="modal-footer" style="padding: 16px 0 0 0;">
              <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
              <button type="submit" class="btn btn-danger">Tolak Klaim</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  },

  async submitRejectForm(e, claimId) {
    e.preventDefault();
    const reason = document.getElementById('rej_reason').value.trim();

    try {
      App.toast('Menyimpan penolakan klaim...', 'info');
      const res = await API.put(`/warranties/claims/${claimId}/reject`, {
        rejection_reason: reason
      });

      if (res.success) {
        App.toast('Klaim telah ditolak.', 'info');
        App.closeModal();
        this.render();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  viewReworkOrder(orderId) {
    App.navigate('services');
    setTimeout(() => {
      Services.openDetailModal(orderId);
    }, 200);
  }
};
