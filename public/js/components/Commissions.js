/**
 * Commission Management Component (Pilar 4: Rekap & Payout Komisi Teknisi/Terapis)
 */
const Commissions = {
  summary: [],
  logs: [],

  async render() {
    const content = document.getElementById('contentArea');
    if (!content) return;

    content.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">Memuat rekapitulasi komisi teknisi & terapis...</div>';

    try {
      await this.loadData();
      this.renderView();
    } catch (err) {
      content.innerHTML = `
        <div class="error-message" style="display:block; padding:16px;">
          <b>Gagal memuat rekap komisi:</b> ${err.message}
        </div>
      `;
    }
  },

  async loadData() {
    const [summaryRes, logsRes] = await Promise.all([
      API.get('/commissions/summary'),
      API.get('/commissions/logs', { limit: 50 })
    ]);

    this.summary = summaryRes.summary || [];
    this.logs = logsRes.logs || [];
  },

  renderView() {
    const content = document.getElementById('contentArea');
    if (!content) return;

    const totalJobs = this.summary.reduce((s, row) => s + Number(row.total_jobs || 0), 0);
    const totalServiceOmzet = this.summary.reduce((s, row) => s + Number(row.total_service_sales || 0), 0);
    const totalPending = this.summary.reduce((s, row) => s + Number(row.pending_commission || 0), 0);
    const totalPaid = this.summary.reduce((s, row) => s + Number(row.paid_commission || 0), 0);

    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <!-- Top Metrics -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-circle blue">🛠️</div>
              <span class="stat-label-text">Total SPK Selesai</span>
            </div>
            <div class="stat-card-bottom">
              <span class="stat-value-large">${totalJobs}</span>
              <span class="stat-trend-badge positive">Jasa Terlaksana</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-circle green">💵</div>
              <span class="stat-label-text">Omzet Tarif Jasa</span>
            </div>
            <div class="stat-card-bottom">
              <span class="stat-value-large" style="font-size: 20px;">${Format.rupiah(totalServiceOmzet)}</span>
              <span class="stat-trend-badge positive">Basis Komisi</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-circle orange">⏳</div>
              <span class="stat-label-text">Komisi Pending</span>
            </div>
            <div class="stat-card-bottom">
              <span class="stat-value-large" style="font-size: 20px;">${Format.rupiah(totalPending)}</span>
              <span class="stat-trend-badge negative">Belum Cair</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-circle pink">✅</div>
              <span class="stat-label-text">Komisi Dicairkan</span>
            </div>
            <div class="stat-card-bottom">
              <span class="stat-value-large" style="font-size: 20px;">${Format.rupiah(totalPaid)}</span>
              <span class="stat-trend-badge positive">Telah Dibayar</span>
            </div>
          </div>
        </div>

        <!-- Staff Summary Table -->
        <div class="invoices-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0;">Ringkasan Komisi Per Karyawan</h3>
              <p style="font-size: 12px; color: var(--text-muted); margin: 4px 0 0 0;">Kalkulasi otomatis saat kasir memproses pembayaran SPK.</p>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="Commissions.render()">🔄 Refresh</button>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Kode & Nama Staf</th>
                  <th>Divisi & Jabatan</th>
                  <th style="text-align: center;">Total SPK</th>
                  <th style="text-align: right;">Omzet Servis</th>
                  <th style="text-align: right;">Total Hak Komisi</th>
                  <th style="text-align: right;">Status Pending</th>
                  <th style="text-align: right;">Aksi Pencairan</th>
                </tr>
              </thead>
              <tbody>
                ${this.summary.length === 0 ? `
                  <tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">Belum ada catatan komisi karyawan.</td></tr>
                ` : this.summary.map(s => `
                  <tr>
                    <td>
                      <div style="font-weight: 700; color: var(--text-main);">${s.staff_name}</div>
                      <div style="font-size: 12px; color: var(--primary); font-weight: 600;">${s.staff_code}</div>
                    </td>
                    <td>
                      <span style="font-weight: 600;">${s.role_title}</span>
                      <div style="margin-top: 4px;">${Format.businessBadge(s.business_type)}</div>
                    </td>
                    <td style="text-align: center; font-weight: 700;">${s.total_jobs}</td>
                    <td style="text-align: right; color: var(--text-muted);">${Format.rupiah(s.total_service_sales)}</td>
                    <td style="text-align: right; font-weight: 800; color: var(--text-main);">${Format.rupiah(s.total_commission)}</td>
                    <td style="text-align: right; font-weight: 800; color: var(--warning-text);">${Format.rupiah(s.pending_commission)}</td>
                    <td style="text-align: right;">
                      ${Number(s.pending_commission) > 0 ? `
                        <button class="btn btn-sm btn-primary" onclick="Commissions.payoutStaff(${s.staff_id}, '${s.staff_name}', ${s.pending_commission})">
                          Cairkan Payout ➔
                        </button>
                      ` : `
                        <span class="badge badge-success">LUNAS</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Logs Table -->
        <div class="invoices-card">
          <h3 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0 0 16px 0;">Histori Rincian Insentif Jasa Terkini</h3>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Staf</th>
                  <th>No. SPK & Pelanggan</th>
                  <th>Tindakan Layanan</th>
                  <th style="text-align: right;">Tarif Dasar</th>
                  <th style="text-align: center;">Rate %</th>
                  <th style="text-align: right;">Komisi</th>
                  <th style="text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${this.logs.length === 0 ? `
                  <tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">Belum ada log rincian komisi.</td></tr>
                ` : this.logs.map(l => `
                  <tr>
                    <td style="color: var(--text-muted); font-size: 12px;">${Format.dateTime(l.created_at)}</td>
                    <td style="font-weight: 700;">${l.staff_name}</td>
                    <td>
                      <div style="font-weight: 600; color: var(--primary);">${l.order_number}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">${l.customer_name} (${l.asset_identifier})</div>
                    </td>
                    <td>${l.service_name || 'Jasa Servis'}</td>
                    <td style="text-align: right;">${Format.rupiah(l.base_amount)}</td>
                    <td style="text-align: center; font-weight: 700;">${l.commission_rate}%</td>
                    <td style="text-align: right; font-weight: 800; color: var(--text-main);">${Format.rupiah(l.commission_amount)}</td>
                    <td style="text-align: center;">
                      ${l.status === 'PENDING' ? `
                        <span class="badge badge-warning">PENDING</span>
                      ` : `
                        <span class="badge badge-success">CAIR</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async payoutStaff(staffId, staffName, pendingAmount) {
    if (!confirm(`Konfirmasi pencairan komisi sebesar ${Format.rupiah(pendingAmount)} untuk ${staffName}?`)) {
      return;
    }

    try {
      App.toast('Memproses pencairan komisi...', 'info');
      const res = await API.post('/commissions/payout', { staff_id: staffId });
      if (res.success) {
        App.toast(res.message, 'success');
        this.render();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  }
};
