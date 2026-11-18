/**
 * Dashboard Overview Component (TokoJendral Native Layout)
 */
const Dashboard = {
  async render() {
    const content = document.getElementById('contentArea');
    if (!content) return;

    content.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">Memuat ringkasan performa outlet...</div>';

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
      const commSummary = commRes.summary || [];

      // Calculate KPIs
      const activeOrders = orders.filter(o => ['BOOKED', 'QUEUED', 'IN_PROGRESS', 'READY_TO_PAY'].includes(o.status));
      const occupiedResources = resources.filter(r => r.status === 'OCCUPIED').length;
      const totalResources = resources.length;
      const resourceUtilization = totalResources > 0 ? Math.round((occupiedResources / totalResources) * 100) : 0;
      const totalOmzet = transactions.reduce((sum, t) => sum + Number(t.grand_total || 0), 0);
      const totalPendingCommission = commSummary.reduce((sum, s) => sum + Number(s.pending_commission || 0), 0);

      content.innerHTML = `
        <!-- 1. STATS GRID (TokoJendral Style) -->
        <div class="stats-grid" style="margin-bottom: 24px;">
          <!-- Card 1: Antrean Aktif -->
          <div class="stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-circle blue">📋</div>
              <span class="stat-label-text">Antrean Aktif</span>
            </div>
            <div class="stat-card-bottom">
              <span class="stat-value-large">${activeOrders.length}</span>
              <span class="stat-trend-badge positive">${orders.filter(o => o.status === 'IN_PROGRESS').length} dikerjakan</span>
            </div>
          </div>

          <!-- Card 2: Utilisasi Fasilitas -->
          <div class="stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-circle green">💺</div>
              <span class="stat-label-text">Utilisasi Bay & Kursi</span>
            </div>
            <div class="stat-card-bottom">
              <span class="stat-value-large">${resourceUtilization}%</span>
              <span class="stat-trend-badge ${resourceUtilization > 50 ? 'positive' : 'negative'}">${occupiedResources}/${totalResources} terisi</span>
            </div>
          </div>

          <!-- Card 3: Omzet Servis Hari Ini -->
          <div class="stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-circle orange">💵</div>
              <span class="stat-label-text">Omzet Sesi Ini</span>
            </div>
            <div class="stat-card-bottom">
              <span class="stat-value-large" style="font-size: 20px;">${Format.rupiah(totalOmzet)}</span>
              <span class="stat-trend-badge positive">${transactions.length} faktur</span>
            </div>
          </div>

          <!-- Card 4: Komisi Pending -->
          <div class="stat-card">
            <div class="stat-card-top">
              <div class="stat-icon-circle pink">🎁</div>
              <span class="stat-label-text">Komisi Pending</span>
            </div>
            <div class="stat-card-bottom">
              <span class="stat-value-large" style="font-size: 20px;">${Format.rupiah(totalPendingCommission)}</span>
              <span class="stat-trend-badge ${totalPendingCommission > 0 ? 'negative' : 'positive'}">Siap Payroll</span>
            </div>
          </div>
        </div>

        <!-- 2. QUICK ACTION BANNER -->
        <div style="background: var(--banner-gradient); color: #ffffff; padding: 22px 28px; border-radius: var(--radius-lg); margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-primary); flex-wrap: wrap; gap: 16px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; margin: 0 0 6px 0;">Service Supply Chain Management Terpadu</h3>
            <p style="font-size: 13px; opacity: 0.9; margin: 0;">Kelola alokasi fasilitas & staf tanpa bentrok. Tarik tagihan langsung ke kasir POS.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" style="background:#ffffff; color:var(--primary);" onclick="Services.openBookingModal()">
              ➕ Buat Reservasi Baru
            </button>
            <button class="btn btn-primary" style="background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.4);" onclick="App.navigate('services')">
              ⚡ Buka Papan Antrean
            </button>
          </div>
        </div>

        <!-- 3. RECENT ORDERS TABLE (Invoices Card) -->
        <div class="invoices-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0;">SPK & Antrean Terkini</h3>
            <button class="btn btn-sm btn-secondary" onclick="App.navigate('services')">Buka Papan Antrean ➔</button>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>No. SPK</th>
                  <th>Unit</th>
                  <th>Pelanggan & Aset</th>
                  <th>Fasilitas & Staf</th>
                  <th>Waktu</th>
                  <th style="text-align: right;">Estimasi Total</th>
                  <th style="text-align: center;">Status</th>
                  <th style="text-align: right;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${orders.length === 0 ? `
                  <tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">Belum ada antrean servis aktif.</td></tr>
                ` : orders.slice(0, 6).map(o => `
                  <tr>
                    <td style="font-weight: 700; color: var(--primary);">${o.order_number}</td>
                    <td>${Format.businessBadge(o.business_type)}</td>
                    <td>
                      <div style="font-weight: 700; color: var(--text-main);">${o.customer_name}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">${o.asset_identifier}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600;">${o.resource_name}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">${o.staff_name}</div>
                    </td>
                    <td style="font-size: 12px; color: var(--text-muted);">
                      ${Format.timeOnly(o.scheduled_start)} - ${Format.timeOnly(o.scheduled_end)}
                    </td>
                    <td style="text-align: right; font-weight: 700; color: var(--text-main);">
                      ${Format.rupiah(o.grand_total)}
                    </td>
                    <td style="text-align: center;">${Format.statusBadge(o.status)}</td>
                    <td style="text-align: right;">
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
      content.innerHTML = `
        <div class="error-message" style="display:block; padding:16px;">
          <b>Gagal memuat dashboard:</b> ${err.message}
        </div>
      `;
    }
  }
};
