/**
 * Items & Stock Component (Katalog Jasa & Sparepart/Bahan)
 */
const Items = {
  items: [],

  async render() {
    const content = document.getElementById('contentArea');
    if (!content) return;

    content.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">Memuat katalog layanan dan inventori bahan...</div>';

    try {
      const res = await API.get('/items');
      this.items = res.items || [];
      this.renderView();
    } catch (err) {
      content.innerHTML = `
        <div class="error-message" style="display:block; padding:16px;">
          <b>Gagal memuat katalog:</b> ${err.message}
        </div>
      `;
    }
  },

  renderView() {
    const content = document.getElementById('contentArea');
    if (!content) return;

    content.innerHTML = `
      <div class="invoices-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0;">Katalog Layanan Jasa & Suku Cadang</h3>
            <p style="font-size: 12px; color: var(--text-muted); margin: 4px 0 0 0;">Daftar tarif jasa, bahan habis pakai, stok gudang, dan persentase komisi.</p>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="Items.render()">🔄 Refresh</button>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nama Item</th>
                <th>Unit Bisnis</th>
                <th>Tipe</th>
                <th>Kategori</th>
                <th style="text-align: right;">Tarif / Harga</th>
                <th style="text-align: center;">Komisi %</th>
                <th style="text-align: center;">Stok (FIFO)</th>
              </tr>
            </thead>
            <tbody>
              ${this.items.length === 0 ? `
                <tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">Belum ada item di katalog.</td></tr>
              ` : this.items.map(i => `
                <tr>
                  <td style="font-weight: 700; color: var(--primary);">${i.sku}</td>
                  <td style="font-weight: 700; color: var(--text-main);">${i.name}</td>
                  <td>${Format.businessBadge(i.business_type)}</td>
                  <td>
                    <span class="badge ${i.type === 'SERVICE' ? 'badge-info' : 'badge-warning'}">
                      ${i.type === 'SERVICE' ? 'JASA' : 'BAHAN'}
                    </span>
                  </td>
                  <td style="color: var(--text-muted);">${i.category}</td>
                  <td style="text-align: right; font-weight: 800; color: var(--text-main);">${Format.rupiah(i.price)}</td>
                  <td style="text-align: center; font-weight: 700; color: var(--primary);">
                    ${i.type === 'SERVICE' ? `${i.commission_rate}%` : '-'}
                  </td>
                  <td style="text-align: center;">
                    ${i.type === 'SERVICE' ? `
                      <span style="color: var(--text-light); font-size: 12px;">Unlimited</span>
                    ` : `
                      <span style="font-weight: 800; color: ${i.stock < 5 ? 'var(--danger)' : 'var(--text-main)'};">
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
