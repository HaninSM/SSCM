/**
 * Items & Stock Component (Katalog Jasa & Sparepart/Bahan)
 */
const Items = {
  items: [],

  async render() {
    const container = document.getElementById('mainContent');
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Memuat katalog layanan dan inventori bahan...</p>
      </div>
    `;

    try {
      const res = await API.get('/items');
      this.items = res.items || [];
      this.renderView();
    } catch (err) {
      container.innerHTML = `
        <div class="alert alert-danger" style="padding: 1.5rem; background: #fee2e2; color: #991b1b; border-radius: 12px;">
          <b>Gagal memuat katalog:</b> ${err.message}
        </div>
      `;
    }
  },

  renderView() {
    const container = document.getElementById('mainContent');

    container.innerHTML = `
      <div class="card" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-card);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Katalog Layanan Jasa & Suku Cadang</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Daftar tarif jasa, bahan habis pakai, stok gudang, dan persentase komisi.</p>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="Items.render()">🔄 Refresh</button>
        </div>

        <div class="table-responsive" style="overflow-x: auto;">
          <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-subtle); text-align: left; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                <th style="padding: 0.6rem 0.75rem;">SKU</th>
                <th style="padding: 0.6rem 0.75rem;">Nama Item</th>
                <th style="padding: 0.6rem 0.75rem;">Unit Bisnis</th>
                <th style="padding: 0.6rem 0.75rem;">Tipe</th>
                <th style="padding: 0.6rem 0.75rem;">Kategori</th>
                <th style="padding: 0.6rem 0.75rem; text-align: right;">Tarif / Harga</th>
                <th style="padding: 0.6rem 0.75rem; text-align: center;">Komisi %</th>
                <th style="padding: 0.6rem 0.75rem; text-align: center;">Stok (FIFO)</th>
              </tr>
            </thead>
            <tbody>
              ${this.items.length === 0 ? `
                <tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada item di katalog.</td></tr>
              ` : this.items.map(i => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 0.75rem; font-weight: 700; color: var(--primary);">${i.sku}</td>
                  <td style="padding: 0.75rem; font-weight: 700; color: var(--text-main);">${i.name}</td>
                  <td style="padding: 0.75rem;">${Format.businessBadge(i.business_type)}</td>
                  <td style="padding: 0.75rem;">
                    <span style="font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; ${i.type === 'SERVICE' ? 'background: #eff6ff; color: #1d4ed8;' : 'background: #fef3c7; color: #b45309;'}">
                      ${i.type === 'SERVICE' ? 'JASA' : 'BAHAN/PART'}
                    </span>
                  </td>
                  <td style="padding: 0.75rem; color: var(--text-muted);">${i.category}</td>
                  <td style="padding: 0.75rem; text-align: right; font-weight: 800; color: var(--text-main);">${Format.rupiah(i.price)}</td>
                  <td style="padding: 0.75rem; text-align: center; font-weight: 700; color: var(--primary);">
                    ${i.type === 'SERVICE' ? `${i.commission_rate}%` : '-'}
                  </td>
                  <td style="padding: 0.75rem; text-align: center;">
                    ${i.type === 'SERVICE' ? `
                      <span style="color: var(--text-light); font-size: 0.75rem;">Unlimited</span>
                    ` : `
                      <span style="font-weight: 800; color: ${i.stock < 5 ? 'var(--danger-text)' : 'var(--text-main)'};">
                        ${i.stock} ${i.unit}
                      </span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};
