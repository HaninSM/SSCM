/**
 * POS Kasir Component (Pilar 3: Kasir, Split Payment & FIFO Depletion)
 */
const POS = {
  cart: [],
  linkedServiceOrderId: null,
  linkedCustomerName: '',
  catalogItems: [],

  async render() {
    const content = document.getElementById('contentArea');
    if (!content) return;

    content.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">Menyiapkan mesin kasir POS...</div>';

    try {
      const res = await API.get('/items');
      this.catalogItems = res.items || [];
      this.renderPOSLayout();
    } catch (err) {
      content.innerHTML = `
        <div class="error-message" style="display:block; padding:16px;">
          <b>Gagal membuka kasir:</b> ${err.message}
        </div>
      `;
    }
  },

  renderPOSLayout() {
    const content = document.getElementById('contentArea');
    if (!content) return;

    const subtotal = this.calculateSubtotal();
    const grandTotal = subtotal;

    content.innerHTML = `
      <div class="pos-layout" style="display: grid; grid-template-columns: 1fr 380px; gap: 20px; align-items: stretch;">
        <!-- Left: Catalog & Quick Actions -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Top Bar: Load Service Button & Category Filters -->
          <div style="background: var(--bg-card); padding: 16px 20px; border-radius: var(--radius-lg); border: 1px solid var(--border-light); box-shadow: var(--shadow-card); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-sm btn-primary" onclick="POS.openLoadServiceOrderModal()">
                ⚡ Panggil Antrean Servis (Load SPK)
              </button>
              <button class="btn btn-sm btn-secondary" onclick="POS.filterCatalog('ALL')">Semua</button>
              <button class="btn btn-sm btn-secondary" onclick="POS.filterCatalog('SERVICE')">Jasa</button>
              <button class="btn btn-sm btn-secondary" onclick="POS.filterCatalog('CONSUMABLE')">Sparepart / Bahan</button>
            </div>
            
            <input type="text" id="posSearch" placeholder="Cari jasa / produk..." style="width: 200px; padding: 8px 14px; border-radius: var(--radius-pill); font-size: 13px;" onkeyup="POS.handleSearch(this.value)" />
          </div>

          <!-- Items Grid -->
          <div class="pos-items-grid" id="posItemsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px;">
            ${this.renderItemsList(this.catalogItems)}
          </div>
        </div>

        <!-- Right: Active Cart Panel -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); display: flex; flex-direction: column; box-shadow: var(--shadow-card); height: 100%;">
          <!-- Cart Header -->
          <div style="padding: 18px 20px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0;">🛒 Keranjang Tagihan</h3>
              ${this.linkedServiceOrderId ? `
                <div style="margin-top: 4px;">
                  <span class="badge badge-info">SPK #${this.linkedServiceOrderId} • ${this.linkedCustomerName}</span>
                </div>
              ` : `
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Pelanggan Walk-In Biasa</div>
              `}
            </div>
            <button class="btn btn-sm btn-secondary" onclick="POS.clearCart()" title="Kosongkan Keranjang">🗑️</button>
          </div>

          <!-- Cart Items List -->
          <div class="cart-items-container" style="flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; min-height: 280px; max-height: 400px;">
            ${this.cart.length === 0 ? `
              <div style="text-align: center; color: var(--text-light); margin-top: 60px;">
                <div style="font-size: 36px; margin-bottom: 8px;">🛍️</div>
                <p style="font-size: 14px; margin: 0;">Keranjang belanja masih kosong.</p>
                <p style="font-size: 12px; margin-top: 4px;">Klik katalog atau panggil SPK antrean.</p>
              </div>
            ` : this.cart.map((item, idx) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8fafc; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                <div style="flex: 1; padding-right: 10px;">
                  <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main);">${item.name}</div>
                  <div style="font-size: 12px; color: var(--text-muted);">${Format.rupiah(item.price)} x ${item.qty}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <button class="btn btn-sm btn-secondary" style="padding: 2px 8px;" onclick="POS.updateQty(${idx}, -1)">-</button>
                  <span style="font-size: 13.5px; font-weight: 700; min-width: 20px; text-align: center;">${item.qty}</span>
                  <button class="btn btn-sm btn-secondary" style="padding: 2px 8px;" onclick="POS.updateQty(${idx}, 1)">+</button>
                  <button class="btn btn-sm btn-danger" style="padding: 2px 8px; margin-left: 4px;" onclick="POS.removeItem(${idx})">✕</button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Cart Totals & Checkout -->
          <div style="padding: 20px; border-top: 1px solid var(--border-light); background: #fafcff; border-radius: 0 0 var(--radius-lg) var(--radius-lg);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px; color: var(--text-muted);">
              <span>Subtotal:</span>
              <span style="font-weight: 700;">${Format.rupiah(subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 18px; font-weight: 800; color: var(--text-main);">
              <span>Grand Total:</span>
              <span style="color: var(--primary);">${Format.rupiah(grandTotal)}</span>
            </div>

            <button class="btn btn-primary btn-full" style="padding: 12px; font-size: 14px; font-weight: 800;" onclick="POS.openCheckoutModal()" ${this.cart.length === 0 ? 'disabled' : ''}>
              💳 Lanjut ke Pembayaran
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderItemsList(items) {
    if (items.length === 0) {
      return `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Tidak ada item ditemukan</div>`;
    }

    return items.map(i => `
      <div class="pos-item-card" onclick="POS.addToCart(${i.id})" style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 14px; cursor: pointer; transition: var(--transition); display: flex; flex-direction: column; justify-content: space-between; height: 130px; box-shadow: var(--shadow-card);">
        <div>
          <div style="margin-bottom: 4px;">
            <span class="badge ${i.type === 'SERVICE' ? 'badge-info' : 'badge-warning'}">
              ${i.type === 'SERVICE' ? '⚡ JASA' : '📦 PART/BAHAN'}
            </span>
          </div>
          <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main); line-height: 1.25; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            ${i.name}
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;">
          <div style="font-size: 14px; font-weight: 800; color: var(--text-main);">${Format.rupiah(i.price)}</div>
          <button class="btn btn-sm btn-primary" style="padding: 4px 8px;">+</button>
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
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3>⚡ Panggil Antrean Servis Siap Bayar</h3>
            <button class="modal-close" onclick="App.closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
              Pilih SPK yang telah selesai pengerjaan untuk langsung dimuat ke keranjang kasir beserta rincian jasa dan bahan habis pakai.
            </p>

            <div style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
              ${orders.length === 0 ? `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                  Tidak ada order servis yang siap ditagihkan saat ini.
                </div>
              ` : orders.map(o => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid var(--border-light); padding: 14px 18px; border-radius: var(--radius-md); cursor: pointer; transition: var(--transition);" onclick="POS.loadOrder(${o.id})">
                  <div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <span style="font-weight: 700; color: var(--primary); font-size: 13.5px;">${o.order_number}</span>
                      ${Format.businessBadge(o.business_type)}
                      ${Format.statusBadge(o.status)}
                    </div>
                    <div style="font-weight: 700; font-size: 14px; margin-top: 4px;">${o.customer_name}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${o.asset_identifier} • ${o.resource_name}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 16px; font-weight: 800; color: var(--text-main);">${Format.rupiah(o.grand_total)}</div>
                    <button class="btn btn-sm btn-primary" style="margin-top: 4px;">Tarik ke Kasir ➔</button>
                  </div>
                </div>
              `).join('')}
            </div>
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
      <div class="modal">
        <div class="modal-header">
          <h3>💳 Penyelesaian Pembayaran (Split Payment)</h3>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div style="background: var(--primary-light); padding: 18px; border-radius: var(--radius-md); margin-bottom: 20px; text-align: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Tagihan</span>
            <div style="font-size: 28px; font-weight: 800; color: var(--primary); margin-top: 4px;">${Format.rupiah(grandTotal)}</div>
            ${this.linkedServiceOrderId ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Menyelesaikan SPK #${this.linkedServiceOrderId}</div>` : ''}
          </div>

          <!-- Payment Methods Inputs -->
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>💵 Tunai (CASH)</label>
              <input type="number" id="pay_cash" placeholder="0" value="${grandTotal}" onkeyup="POS.recalculateChange(${grandTotal})" />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label>📱 Non-Tunai / QRIS</label>
              <input type="number" id="pay_qris" placeholder="0" value="0" onkeyup="POS.recalculateChange(${grandTotal})" />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label>🏦 Transfer Bank</label>
              <input type="number" id="pay_transfer" placeholder="0" value="0" onkeyup="POS.recalculateChange(${grandTotal})" />
            </div>
          </div>

          <!-- Real-time Balance / Change Display -->
          <div style="background: #f8fafc; padding: 14px 18px; border-radius: var(--radius-md); border: 1px solid var(--border-light); margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 4px;">
              <span>Total Diterima:</span>
              <span id="labelTotalPaid" style="font-weight: 700;">${Format.rupiah(grandTotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800;">
              <span>Kembalian / Sisa:</span>
              <span id="labelChange" style="color: var(--success);">Rp 0</span>
            </div>
          </div>

          <button class="btn btn-primary btn-full" id="btnSubmitPayment" style="padding: 12px; font-weight: 800; font-size: 14px;" onclick="POS.submitPayment(${grandTotal})">
            ✅ Konfirmasi & Cetak Struk
          </button>
        </div>
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
      labelChange.style.color = 'var(--success)';
      btnSubmit.disabled = false;
    } else {
      labelChange.textContent = `Kurang ${Format.rupiah(Math.abs(change))}`;
      labelChange.style.color = 'var(--danger)';
      btnSubmit.disabled = true;
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
        this.showReceiptModal(res.transaction, res.change_amount);
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  showReceiptModal(transaction, changeAmount) {
    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
      <div class="modal" style="max-width: 440px; text-align: center;">
        <div style="font-size: 42px; margin-bottom: 8px;">🎉</div>
        <h3 style="font-size: 18px; font-weight: 800; margin: 0 0 4px 0;">Transaksi Selesai!</h3>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
          Nomor Faktur: <b>${transaction.invoice_number}</b>
        </p>

        <div style="background: #f8fafc; padding: 16px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-light); text-align: left; font-size: 13.5px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Total Tagihan:</span>
            <b>${Format.rupiah(transaction.grand_total)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Total Dibayar:</span>
            <b>${Format.rupiah(transaction.total_paid)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: var(--success); border-top: 1px dashed var(--border-subtle); padding-top: 8px; margin-top: 8px;">
            <span>Kembalian:</span>
            <span>${Format.rupiah(changeAmount)}</span>
          </div>
        </div>

        <button class="btn btn-primary btn-full" onclick="App.closeModal()">Selesai & Tutup</button>
      </div>
    `;

    modal.style.display = 'flex';
  }
};
