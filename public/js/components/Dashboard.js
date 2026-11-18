/**
 * Dashboard Overview Component
 */
const Dashboard = {
  async render() {
    const container = document.getElementById('mainContent');
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Memuat ringkasan performa outlet...</p>
      </div>
    `;

    try {
      const [ordersRes, resourcesRes, staffRes, transRes, commRes] = await Promise.all([
        API.get('/services/orders'),
        API.get('/services/resources'),
        API.get('/services/staff'),
        API.get('/pos/transactions', { limit: 10 }),
        API.get('/commissions/summary').catch(() => ({ summary: [] }))
      ]);

      const orders = ordersRes.orders || [];
      const resources = resourcesRes.resources || [];
      const transactions = transRes.transactions || [];
      const staffList = staffRes.staff || [];
      const commSummary = commRes.summary || [];

      // Calculate KPIs
      const activeOrders = orders.filter(o => ['BOOKED', 'QUEUED', 'IN_PROGRESS', 'READY_TO_PAY'].includes(o.status));
      const occupiedResources = resources.filter(r => r.status === 'OCCUPIED').length;
      const totalResources = resources.length;
      const resourceUtilization = totalResources > 0 ? Math.round((occupiedResources / totalResources) * 100) : 0;

      const totalOmzetToday = transactions.reduce((sum, t) => sum + Number(t.grand_total || 0), 0);
      const totalPendingCommission = commSummary.reduce((sum, s) => sum + Number(s.pending_commission || 0), 0);

      container.innerHTML = `
        <!-- KPI Metrics Row -->
        <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
          <!-- Card 1 -->
          <div class="metric-card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Antrean Aktif</span>
              <span style="font-size: 1.2rem; background: var(--primary-light); padding: 0.4rem; border-radius: 8px;">📋</span>
            </div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); line-height: 1.1;">${activeOrders.length}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.4rem;">
              <span style="color: var(--warning-text); font-weight: 700;">${orders.filter(o => o.status === 'IN_PROGRESS').length}</span> sedang dikerjakan
            </div>
          </div>

          <!-- Card 2 -->
          <div class="metric-card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Utilisasi Fasilitas</span>
              <span style="font-size: 1.2rem; background: #ecfdf5; padding: 0.4rem; border-radius: 8px;">💺</span>
            </div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); line-height: 1.1;">${resourceUtilization}%</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.4rem;">
              <span style="font-weight: 700;">${occupiedResources}</span> dari ${totalResources} Bay/Kursi terisi
            </div>
          </div>

          <!-- Card 3 -->
          <div class="metric-card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Omzet Kasir Sesi Ini</span>
              <span style="font-size: 1.2rem; background: #eff6ff; padding: 0.4rem; border-radius: 8px;">💵</span>
            </div>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--primary); line-height: 1.1;">${Format.rupiah(totalOmzetToday)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.4rem;">
              <span style="font-weight: 700;">${transactions.length}</span> transaksi lunas
            </div>
          </div>

          <!-- Card 4 -->
          <div class="metric-card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Komisi Staf Pending</span>
              <span style="font-size: 1.2rem; background: #fffbeb; padding: 0.4rem; border-radius: 8px;">🎁</span>
            </div>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--warning-text); line-height: 1.1;">${Format.rupiah(totalPendingCommission)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.4rem;">Siap dicairkan pada payroll</div>
          </div>
        </div>

        <!-- Action Banner -->
        <div style="background: var(--banner-gradient); color: #fff; padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 0.35rem;">Service Supply Chain Management Terpadu</h3>
            <p style="font-size: 0.85rem; opacity: 0.9;">Kelola reservasi pit bengkel & kursi salon tanpa tabrakan jadwal. Tarik ke kasir dalam 1-klik.</p>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button class="btn btn-secondary" style="background: #ffffff; color: var(--primary); font-weight: 700;" onclick="Services.openBookingModal()">
              ➕ Buat Reservasi Baru
            </button>
            <button class="btn btn-primary" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.4);" onclick="App.navigate('services')">
              ⚡ Papan Antrean Live
            </button>
          </div>
        </div>

        <!-- Recent Orders Table -->
        <div class="card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1rem; font-weight: 800; color: var(--text-main);">SPK & Antrean Terkini</h3>
            <button class="btn btn-sm btn-ghost" onclick="App.navigate('services')">Lihat Semua Antrean ➔</button>
          </div>

          <div class="table-responsive" style="overflow-x: auto;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border-subtle); text-align: left; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                  <th style="padding: 0.6rem 0.75rem;">No. SPK</th>
                  <th style="padding: 0.6rem 0.75rem;">Unit</th>
                  <th style="padding: 0.6rem 0.75rem;">Pelanggan & Aset</th>
                  <th style="padding: 0.6rem 0.75rem;">Fasilitas & Staf</th>
                  <th style="padding: 0.6rem 0.75rem;">Jadwal</th>
                  <th style="padding: 0.6rem 0.75rem;">Estimasi Total</th>
                  <th style="padding: 0.6rem 0.75rem;">Status</th>
                  <th style="padding: 0.6rem 0.75rem; text-align: right;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${orders.length === 0 ? `
                  <tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada antrean servis aktif saat ini.</td></tr>
                ` : orders.slice(0, 6).map(o => `
                  <tr style="border-bottom: 1px solid var(--border-subtle);">
                    <td style="padding: 0.75rem; font-weight: 700; color: var(--primary);">${o.order_number}</td>
                    <td style="padding: 0.75rem;">${Format.businessBadge(o.business_type)}</td>
                    <td style="padding: 0.75rem;">
                      <div style="font-weight: 700; color: var(--text-main);">${o.customer_name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${o.asset_identifier}</div>
                    </td>
                    <td style="padding: 0.75rem;">
                      <div style="font-weight: 600;">${o.resource_name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${o.staff_name}</div>
                    </td>
                    <td style="padding: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">
                      ${Format.timeOnly(o.scheduled_start)} - ${Format.timeOnly(o.scheduled_end)}
                    </td>
                    <td style="padding: 0.75rem; font-weight: 700; color: var(--text-main);">
                      ${Format.rupiah(o.grand_total)}
                    </td>
                    <td style="padding: 0.75rem;">${Format.statusBadge(o.status)}</td>
                    <td style="padding: 0.75rem; text-align: right;">
                      <button class="btn btn-sm btn-secondary" onclick="Services.openDetailModal(${o.id})">Detail</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div class="alert alert-danger" style="padding: 1.5rem; background: #fee2e2; color: #991b1b; border-radius: var(--radius-md);">
          <b>Gagal memuat dashboard:</b> ${err.message}
        </div>
      `;
    }
  }
};
