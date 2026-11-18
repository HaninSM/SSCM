/**
 * POS Kasir Component (Pilar 3: Kasir, Split Payment & FIFO Depletion)
 */
const POS = {
  cart: [],
  linkedServiceOrderId: null,
  linkedCustomerName: '',
  catalogItems: [],

  async render() {
    const container = document.getElementById('mainContent');
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Menyiapkan mesin kasir POS...</p>
      </div>
    `;

    try {
      const res = await API.get('/items');
      this.catalogItems = res.items || [];
      this.renderPOSLayout();
    } catch (err) {
      container.innerHTML = `
        <div class="alert alert-danger" style="padding: 1.5rem; background: #fee2e2; color: #991b1b; border-radius: 12px;">
          <b>Gagal membuka kasir:</b> ${err.message}
        </div>
      `;
    }
  },

  renderPOSLayout() {
    const container = document.getElementById('mainContent');
    const subtotal = this.calculateSubtotal();
    const grandTotal = subtotal;

    container.innerHTML = `
      <div class="pos-layout" style="display: grid; grid-template-columns: 1fr 380px; gap: 1.25rem; height: calc(100vh - 120px);">
        <!-- Left: Catalog & Quick Actions -->
        <div class="pos-catalog-panel" style="display: flex; flex-direction: column; gap: 1rem; overflow-y: auto;">
          <!-- Top Bar: Load Service Button & Category Filters -->
          <div style="background: #ffffff; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sm btn-primary" onclick="POS.openLoadServiceOrderModal()">
                ⚡ Panggil Antrean Servis (Load SPK)
              </button>
              <button class="btn btn-sm btn-secondary" onclick="POS.filterCatalog('ALL')">Semua</button>
              <button class="btn btn-sm btn-secondary" onclick="POS.filterCatalog('SERVICE')">Jasa</button>
              <button class="btn btn-sm btn-secondary" onclick="POS.filterCatalog('CONSUMABLE')">Sparepart / Bahan</button>
            </div>
            
            <input type="text" id="posSearch" placeholder="Cari jasa / produk..." style="padding: 0.4rem 0.75rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-pill); font-size: 0.82rem;" onkeyup="POS.handleSearch(this.value)" />
          </div>

          <!-- Items Grid -->
          <div class="pos-items-grid" id="posItemsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.85rem;">
            ${this.renderItemsList(this.catalogItems)}
          </div>
        </div>

        <!-- Right: Active Cart Panel -->
        <div class="pos-cart-panel" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); display: flex; flex-direction: column; box-shadow: var(--shadow-card);">
          <!-- Cart Header -->
          <div style="padding: 1rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="font-size: 1.05rem; font-weight: 800;">🛒 Keranjang Tagihan</h3>
              ${this.linkedServiceOrderId ? `
                <span class="badge" style="background: var(--primary-light); color: var(--primary); font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 9999px;">
                  Terhubung SPK: #${this.linkedServiceOrderId} (${this.linkedCustomerName})
                </span>
              ` : `
                <span style="font-size: 0.75rem; color: var(--text-muted);">Pelanggan Walk-In Biasa</span>
              `}
            </div>
            <button class="btn btn-xs btn-ghost" onclick="POS.clearCart()" title="Kosongkan Keranjang">🗑️</button>
          </div>

          <!-- Cart Items List -->
          <div class="cart-items-container" style="flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
            ${this.cart.length === 0 ? `
              <div style="text-align: center; color: var(--text-light); margin-top: 4rem;">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🛍️</div>
                <p style="font-size: 0.85rem;">Keranjang belanja masih kosong.</p>
                <p style="font-size: 0.75rem; margin-top: 0.25rem;">Klik item katalog atau panggil SPK antrean.</p>
              </div>
            ` : this.cart.map((item, idx) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem; background: #f8fafc; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <div style="flex: 1; padding-right: 0.5rem;">
                  <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">${item.name}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">${Format.rupiah(item.price)} x ${item.qty}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <button class="btn btn-xs btn-secondary" onclick="POS.updateQty(${idx}, -1)">-</button>
                  <span style="font-size: 0.85rem; font-weight: 700; min-width: 20px; text-align: center;">${item.qty}</span>
                  <button class="btn btn-xs btn-secondary" onclick="POS.updateQty(${idx}, 1)">+</button>
                  <button class="btn btn-xs btn-ghost" style="color: var(--danger);" onclick="POS.removeItem(${idx})">✕</button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Cart Totals & Checkout -->
          <div style="padding: 1.25rem; border-top: 1px solid var(--border-subtle); background: #fdfefe;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.85rem; color: var(--text-muted);">
              <span>Subtotal:</span>
              <span style="font-weight: 600;">${Format.rupiah(subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.85rem; font-size: 1.15rem; font-weight: 800; color: var(--text-main);">
              <span>Grand Total:</span>
              <span style="color: var(--primary);">${Format.rupiah(grandTotal)}</span>
            </div>

            <button class="btn btn-primary btn-block" style="padding: 0.85rem; font-size: 0.95rem; font-weight: 800;" onclick="POS.openCheckoutModal()" ${this.cart.length === 0 ? 'disabled' : ''}>
              💳 Lanjut ke Pembayaran
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderItemsList(items) {
    if (items.length === 0) {
      return `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Tidak ada item ditemukan</div>`;
    }

    return items.map(i => `
      <div class="pos-item-card" onclick="POS.addToCart(${i.id})" style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0.85rem; cursor: pointer; transition: var(--transition); display: flex; flex-direction: column; justify-content: space-between; height: 120px;">
        <div>
          <div style="font-size: 0.7rem; font-weight: 700; color: ${i.type === 'SERVICE' ? 'var(--primary)' : '#b45309'}; margin-bottom: 0.2rem;">
            ${i.type === 'SERVICE' ? '⚡ JASA' : '📦 PART/BAHAN'}
          </div>
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); line-height: 1.2; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            ${i.name}
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 0.5rem;">
          <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-main);">${Format.rupiah(i.price)}</div>
          <button class="btn btn-xs btn-primary">+</button>
        </div>
      </div>
    `).join('');
  },

  calculateSubtotal() {
    return this.cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
  },

  addToCart(itemId) {
    const item = this.catalogItems.find(i => i.id === itemId);
    if (!item) return;

    const existing = this.cart.find(c => c.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cart.push({
        id: item.id,
        name: item.name,
        type: item.type,
        price: Number(item.price),
        qty: 1
      });
    }
    this.renderPOSLayout();
  },

  updateQty(idx, change) {
    if (!this.cart[idx]) return;
    this.cart[idx].qty += change;
    if (this.cart[idx].qty <= 0) {
      this.cart.splice(idx, 1);
    }
    this.renderPOSLayout();
  },

  removeItem(idx) {
    this.cart.splice(idx, 1);
    this.renderPOSLayout();
  },

  clearCart() {
    this.cart = [];
    this.linkedServiceOrderId = null;
    this.linkedCustomerName = '';
    this.renderPOSLayout();
  },

  filterCatalog(type) {
    if (type === 'ALL') {
      document.getElementById('posItemsGrid').innerHTML = this.renderItemsList(this.catalogItems);
    } else {
      const filtered = this.catalogItems.filter(i => i.type === type);
      document.getElementById('posItemsGrid').innerHTML = this.renderItemsList(filtered);
    }
  },

  handleSearch(query) {
    const q = query.toLowerCase().trim();
    const filtered = this.catalogItems.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.sku.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
    document.getElementById('posItemsGrid').innerHTML = this.renderItemsList(filtered);
  },

  // One-Click Load Service Order
  async openLoadServiceOrderModal() {
    try {
      const res = await API.get('/pos/service-orders');
      const orders = res.orders || [];

      const modal = document.getElementById('modalContainer');
      modal.innerHTML = `
        <div class="modal-card" style="max-width: 600px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 800;">⚡ Panggil Antrean Servis Siap Bayar</h3>
            <button class="modal-close" onclick="App.closeModal()">✕</button>
          </div>

          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
            Pilih SPK yang telah selesai pengerjaan untuk langsung dimuat ke keranjang kasir beserta rincian jasa dan bahan habis pakai.
          </p>

          <div style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem;">
            ${orders.length === 0 ? `
              <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                Tidak ada order servis yang siap ditagihkan saat ini.
              </div>
            ` : orders.map(o => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid var(--border-subtle); padding: 0.85rem; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition);" onclick="POS.loadOrder(${o.id})">
                <div>
                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span style="font-weight: 700; color: var(--primary); font-size: 0.85rem;">${o.order_number}</span>
                    ${Format.businessBadge(o.business_type)}
                    ${Format.statusBadge(o.status)}
                  </div>
                  <div style="font-weight: 700; font-size: 0.95rem; margin-top: 0.2rem;">${o.customer_name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${o.asset_identifier} • ${o.resource_name}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-main);">${Format.rupiah(o.grand_total)}</div>
                  <button class="btn btn-xs btn-primary" style="margin-top: 0.25rem;">Tarik ke Kasir ➔</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      modal.style.display = 'flex';
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  async loadOrder(orderId) {
    try {
      const res = await API.get(`/services/orders/${orderId}`);
      const order = res.order;

      this.cart = [];
      this.linkedServiceOrderId = order.id;
      this.linkedCustomerName = order.customer_name;

      // Populate cart with all order items
      if (order.items && order.items.length > 0) {
        order.items.forEach(line => {
          this.cart.push({
            id: line.item_id,
            name: line.item_name,
            type: line.item_type,
            price: Number(line.unit_price),
            qty: Number(line.qty)
          });
        });
      }

      App.closeModal();
      this.renderPOSLayout();
      App.toast(`SPK ${order.order_number} berhasil dimuat ke kasir!`, 'success');
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  async loadServiceOrderToCart(orderId) {
    App.navigate('pos');
    await this.loadOrder(orderId);
  },

  // Split Payment Checkout Modal
  openCheckoutModal() {
    const grandTotal = this.calculateSubtotal();
    const modal = document.getElementById('modalContainer');

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 520px;">
        <div class="modal-header">
          <h3 style="font-size: 1.15rem; font-weight: 800;">💳 Penyelesaian Pembayaran (Split Payment)</h3>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>

        <div style="background: var(--primary-light); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem; text-align: center;">
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Yang Harus Dibayar</span>
          <div style="font-size: 2rem; font-weight: 800; color: var(--primary);">${Format.rupiah(grandTotal)}</div>
          ${this.linkedServiceOrderId ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">Menyelesaikan SPK #${this.linkedServiceOrderId}</div>` : ''}
        </div>

        <!-- Payment Methods Inputs -->
        <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1rem;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; font-size: 0.82rem;">💵 Tunai (CASH)</label>
            <input type="number" id="pay_cash" class="form-control" placeholder="0" value="${grandTotal}" onkeyup="POS.recalculateChange(${grandTotal})" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; font-size: 0.82rem;">📱 Non-Tunai / QRIS</label>
            <input type="number" id="pay_qris" class="form-control" placeholder="0" value="0" onkeyup="POS.recalculateChange(${grandTotal})" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; font-size: 0.82rem;">🏦 Transfer Bank</label>
            <input type="number" id="pay_transfer" class="form-control" placeholder="0" value="0" onkeyup="POS.recalculateChange(${grandTotal})" />
          </div>
        </div>

        <!-- Real-time Balance / Change Display -->
        <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
            <span>Total Masuk:</span>
            <span id="labelTotalPaid" style="font-weight: 700;">${Format.rupiah(grandTotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 800;">
            <span>Kembalian / Sisa:</span>
            <span id="labelChange" style="color: var(--success-text);">Rp 0</span>
          </div>
        </div>

        <button class="btn btn-primary btn-block" id="btnSubmitPayment" style="padding: 0.85rem; font-weight: 800;" onclick="POS.submitPayment(${grandTotal})">
          ✅ Konfirmasi & Cetak Struk
        </button>
      </div>
    `;

    modal.style.display = 'flex';
  },

  recalculateChange(grandTotal) {
    const cash = Number(document.getElementById('pay_cash')?.value || 0);
    const qris = Number(document.getElementById('pay_qris')?.value || 0);
    const transfer = Number(document.getElementById('pay_transfer')?.value || 0);

    const totalPaid = cash + qris + transfer;
    const change = totalPaid - grandTotal;

    document.getElementById('labelTotalPaid').textContent = Format.rupiah(totalPaid);
    const labelChange = document.getElementById('labelChange');
    const btnSubmit = document.getElementById('btnSubmitPayment');

    if (change >= 0) {
      labelChange.textContent = Format.rupiah(change);
      labelChange.style.color = 'var(--success-text)';
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('btn-disabled');
    } else {
      labelChange.textContent = `Kurang ${Format.rupiah(Math.abs(change))}`;
      labelChange.style.color = 'var(--danger-text)';
      btnSubmit.disabled = true;
      btnSubmit.classList.add('btn-disabled');
    }
  },

  async submitPayment(grandTotal) {
    const cash = Number(document.getElementById('pay_cash')?.value || 0);
    const qris = Number(document.getElementById('pay_qris')?.value || 0);
    const transfer = Number(document.getElementById('pay_transfer')?.value || 0);

    const payments = [];
    if (cash > 0) payments.push({ payment_method: 'CASH', amount: cash });
    if (qris > 0) payments.push({ payment_method: 'QRIS', amount: qris });
    if (transfer > 0) payments.push({ payment_method: 'TRANSFER', amount: transfer });

    const payload = {
      service_order_id: this.linkedServiceOrderId,
      customer_name: this.linkedCustomerName || 'Pelanggan Kasir',
      cart_items: this.cart,
      payments: payments,
      discount: 0,
      tax: 0
    };

    try {
      App.toast('Memproses transaksi kasir & potong stok FIFO...', 'info');
      const res = await API.post('/pos/checkout', payload);
      
      if (res.success) {
        App.closeModal();
        this.clearCart();
        App.toast('Transaksi berhasil! Komisi staf telah otomatis dicatat.', 'success');

        // Show receipt confirmation
        this.showReceiptModal(res.transaction, res.change_amount);
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  showReceiptModal(transaction, changeAmount) {
    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 440px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
        <h3 style="font-size: 1.2rem; font-weight: 800;">Transaksi Berhasil!</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem;">
          Nomor Faktur: <b>${transaction.invoice_number}</b>
        </p>

        <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); text-align: left; font-size: 0.85rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
            <span>Total Tagihan:</span>
            <b>${Format.rupiah(transaction.grand_total)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
            <span>Total Dibayar:</span>
            <b>${Format.rupiah(transaction.total_paid)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 800; color: var(--success-text); border-top: 1px dashed var(--border-subtle); padding-top: 0.5rem; margin-top: 0.5rem;">
            <span>Kembalian:</span>
            <span>${Format.rupiah(changeAmount)}</span>
          </div>
        </div>

        <button class="btn btn-primary btn-block" onclick="App.closeModal()">Selesai & Tutup</button>
      </div>
    `;

    modal.style.display = 'flex';
  }
};
