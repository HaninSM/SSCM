/**
 * Commission Management Component (Pilar 4: Rekap & Payout Komisi Teknisi/Terapis)
 */
const Commissions = {
  summary: [],
  logs: [],

  async render() {
    const container = document.getElementById('mainContent');
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Memuat rekapitulasi komisi teknisi & terapis...</p>
      </div>
    `;

    try {
      await this.loadData();
      this.renderView();
    } catch (err) {
      container.innerHTML = `
        <div class="alert alert-danger" style="padding: 1.5rem; background: #fee2e2; color: #991b1b; border-radius: 12px;">
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
    const container = document.getElementById('mainContent');

    const totalJobs = this.summary.reduce((s, row) => s + Number(row.total_jobs || 0), 0);
    const totalServiceOmzet = this.summary.reduce((s, row) => s + Number(row.total_service_sales || 0), 0);
    const totalPending = this.summary.reduce((s, row) => s + Number(row.pending_commission || 0), 0);
    const totalPaid = this.summary.reduce((s, row) => s + Number(row.paid_commission || 0), 0);

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Top Metrics -->
        <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
          <div class="metric-card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Pekerjaan Jasa</span>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-top: 0.5rem;">${totalJobs}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Dari SPK yang terselesaikan</div>
          </div>

          <div class="metric-card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Omzet Tarif Layanan</span>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--primary); margin-top: 0.5rem;">${Format.rupiah(totalServiceOmzet)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Dasar perhitungan komisi</div>
          </div>

          <div class="metric-card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Komisi Pending (Siap Bayar)</span>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--warning-text); margin-top: 0.5rem;">${Format.rupiah(totalPending)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Hak staf belum dicairkan</div>
          </div>

          <div class="metric-card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Sudah Dicairkan</span>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--success-text); margin-top: 0.5rem;">${Format.rupiah(totalPaid)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Telah diserahkan ke staf</div>
          </div>
        </div>

        <!-- Staff Summary Table -->
        <div class="card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
              <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main);">Ringkasan Perolehan Komisi Per Karyawan</h3>
              <p style="font-size: 0.78rem; color: var(--text-muted);">Kalkulasi otomatis berdasarkan SPK lunas di kasir.</p>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="Commissions.render()">🔄 Refresh</button>
          </div>

          <div class="table-responsive" style="overflow-x: auto;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border-subtle); text-align: left; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                  <th style="padding: 0.6rem 0.75rem;">Kode & Nama Staf</th>
                  <th style="padding: 0.6rem 0.75rem;">Divisi & Peran</th>
                  <th style="padding: 0.6rem 0.75rem; text-align: center;">Total SPK</th>
                  <th style="padding: 0.6rem 0.75rem; text-align: right;">Omzet Servis</th>
                  <th style="padding: 0.6rem 0.75rem; text-align: right;">Total Komisi</th>
                  <th style="padding: 0.6rem 0.75rem; text-align: right;">Pending</th>
                  <th style="padding: 0.6rem 0.75rem; text-align: right;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${this.summary.length === 0 ? `
                  <tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada catatan komisi karyawan.</td></tr>
                ` : this.summary.map(s => `
                  <tr style="border-bottom: 1px solid var(--border-subtle);">
                    <td style="padding: 0.75rem;">
                      <div style="font-weight: 700; color: var(--text-main);">${s.staff_name}</div>
                      <div style="font-size: 0.75rem; color: var(--primary); font-weight: 600;">${s.staff_code}</div>
                    </td>
                    <td style="padding: 0.75rem;">
                      <span style="font-weight: 600;">${s.role_title}</span>
                      <div style="margin-top: 0.2rem;">${Format.businessBadge(s.business_type)}</div>
                    </td>
                    <td style="padding: 0.75rem; text-align: center; font-weight: 700;">${s.total_jobs}</td>
                    <td style="padding: 0.75rem; text-align: right; color: var(--text-muted);">${Format.rupiah(s.total_service_sales)}</td>
                    <td style="padding: 0.75rem; text-align: right; font-weight: 800; color: var(--text-main);">${Format.rupiah(s.total_commission)}</td>
                    <td style="padding: 0.75rem; text-align: right; font-weight: 800; color: var(--warning-text);">${Format.rupiah(s.pending_commission)}</td>
                    <td style="padding: 0.75rem; text-align: right;">
                      ${Number(s.pending_commission) > 0 ? `
                        <button class="btn btn-xs btn-primary" onclick="Commissions.payoutStaff(${s.staff_id}, '${s.staff_name}', ${s.pending_commission})">
                          Cairkan Payout ➔
                        </button>
                      ` : `
                        <span style="font-size: 0.75rem; color: var(--success-text); font-weight: 700;">Sudah Lunas</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Logs Table -->
        <div class="card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
          <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.85rem;">Histori Rincian Insentif Jasa Terkini</h3>
          
          <div class="table-responsive" style="overflow-x: auto;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border-subtle); text-align: left; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                  <th style="padding: 0.5rem;">Waktu</th>
                  <th style="padding: 0.5rem;">Staf</th>
                  <th style="padding: 0.5rem;">No. SPK & Pelanggan</th>
                  <th style="padding: 0.5rem;">Tindakan Layanan</th>
                  <th style="padding: 0.5rem; text-align: right;">Tarif Dasar</th>
                  <th style="padding: 0.5rem; text-align: center;">Rate %</th>
                  <th style="padding: 0.5rem; text-align: right;">Komisi</th>
                  <th style="padding: 0.5rem; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${this.logs.length === 0 ? `
                  <tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada log rincian komisi.</td></tr>
                ` : this.logs.map(l => `
                  <tr style="border-bottom: 1px solid var(--border-subtle);">
                    <td style="padding: 0.6rem; color: var(--text-muted); font-size: 0.75rem;">${Format.dateTime(l.created_at)}</td>
                    <td style="padding: 0.6rem; font-weight: 700;">${l.staff_name}</td>
                    <td style="padding: 0.6rem;">
                      <div style="font-weight: 600; color: var(--primary);">${l.order_number}</div>
                      <div style="font-size: 0.72rem; color: var(--text-muted);">${l.customer_name} (${l.asset_identifier})</div>
                    </td>
                    <td style="padding: 0.6rem;">${l.service_name || 'Jasa Servis'}</td>
                    <td style="padding: 0.6rem; text-align: right;">${Format.rupiah(l.base_amount)}</td>
                    <td style="padding: 0.6rem; text-align: center; font-weight: 700;">${l.commission_rate}%</td>
                    <td style="padding: 0.6rem; text-align: right; font-weight: 800; color: var(--text-main);">${Format.rupiah(l.commission_amount)}</td>
                    <td style="padding: 0.6rem; text-align: center;">
                      ${l.status === 'PENDING' ? `
                        <span style="background: #fffbeb; color: #b45309; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 9999px;">PENDING</span>
                      ` : `
                        <span style="background: #ecfdf5; color: #059669; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 9999px;">CAIR</span>
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
