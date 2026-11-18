/**
 * Services & Queue Board (Pilar 1: Booking & Pilar 2: Antrean)
 */
const Services = {
  activeBusinessType: 'ALL', // 'ALL', 'WORKSHOP', 'SALON'
  orders: [],
  resources: [],
  staffList: [],
  itemsCatalog: [],

  async render() {
    const content = document.getElementById('contentArea');
    if (!content) return;

    content.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">Memuat papan antrean layanan & jadwal...</div>';

    try {
      await this.loadData();
      this.renderBoard();
    } catch (err) {
      content.innerHTML = `
        <div class="error-message" style="display:block; padding:16px;">
          <b>Gagal memuat papan layanan:</b> ${err.message}
        </div>
      `;
    }
  },

  async loadData() {
    const [ordersRes, resourcesRes, staffRes, itemsRes] = await Promise.all([
      API.get('/services/orders', { business_type: this.activeBusinessType }),
      API.get('/services/resources'),
      API.get('/services/staff'),
      API.get('/items')
    ]);

    this.orders = ordersRes.orders || [];
    this.resources = resourcesRes.resources || [];
    this.staffList = staffRes.staff || [];
    this.itemsCatalog = itemsRes.items || [];
  },

  renderBoard() {
    const content = document.getElementById('contentArea');
    if (!content) return;
    
    // Categorize orders into the 4 kanban stages
    const bookedOrders = this.orders.filter(o => o.status === 'BOOKED');
    const queuedOrders = this.orders.filter(o => o.status === 'QUEUED');
    const inProgressOrders = this.orders.filter(o => o.status === 'IN_PROGRESS');
    const readyOrders = this.orders.filter(o => o.status === 'READY_TO_PAY');

    content.innerHTML = `
      <div class="queue-board-container">
        <!-- Top Toolbar & Filters -->
        <div class="queue-board-filters">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-muted); margin-right: 4px;">Lini Bisnis:</span>
            <button class="btn btn-sm ${this.activeBusinessType === 'ALL' ? 'btn-primary' : 'btn-secondary'}" onclick="Services.setFilter('ALL')">Semua Unit</button>
            <button class="btn btn-sm ${this.activeBusinessType === 'WORKSHOP' ? 'btn-primary' : 'btn-secondary'}" onclick="Services.setFilter('WORKSHOP')">🔧 Bengkel & Carwash</button>
            <button class="btn btn-sm ${this.activeBusinessType === 'SALON' ? 'btn-primary' : 'btn-secondary'}" onclick="Services.setFilter('SALON')">✂️ Salon & Treatment</button>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="Services.render()">🔄 Refresh</button>
            <button class="btn btn-primary btn-sm" onclick="Services.openBookingModal()">➕ Buat Reservasi / SPK</button>
          </div>
        </div>

        <!-- 4-Column Board -->
        <div class="queue-columns">
          <!-- Column 1: BOOKED -->
          <div class="queue-column col-booked">
            <div class="column-header">
              <span class="column-title">📅 Reservasi (Booked)</span>
              <span class="column-count">${bookedOrders.length}</span>
            </div>
            <div class="column-cards" style="display: flex; flex-direction: column; gap: 12px;">
              ${bookedOrders.length === 0 ? `<div style="text-align: center; padding: 24px 0; font-size: 12px; color: var(--text-light);">Tidak ada reservasi mendatang</div>` : ''}
              ${bookedOrders.map(o => this.renderCardHtml(o)).join('')}
            </div>
          </div>

          <!-- Column 2: QUEUED -->
          <div class="queue-column col-queued">
            <div class="column-header">
              <span class="column-title">⏳ Menunggu (Queued)</span>
              <span class="column-count">${queuedOrders.length}</span>
            </div>
            <div class="column-cards" style="display: flex; flex-direction: column; gap: 12px;">
              ${queuedOrders.length === 0 ? `<div style="text-align: center; padding: 24px 0; font-size: 12px; color: var(--text-light);">Tidak ada yang mengantre</div>` : ''}
              ${queuedOrders.map(o => this.renderCardHtml(o)).join('')}
            </div>
          </div>

          <!-- Column 3: IN_PROGRESS -->
          <div class="queue-column col-in-progress">
            <div class="column-header">
              <span class="column-title">⚙️ Dikerjakan (In Progress)</span>
              <span class="column-count">${inProgressOrders.length}</span>
            </div>
            <div class="column-cards" style="display: flex; flex-direction: column; gap: 12px;">
              ${inProgressOrders.length === 0 ? `<div style="text-align: center; padding: 24px 0; font-size: 12px; color: var(--text-light);">Tidak ada unit sedang dikerjakan</div>` : ''}
              ${inProgressOrders.map(o => this.renderCardHtml(o)).join('')}
            </div>
          </div>

          <!-- Column 4: READY_TO_PAY -->
          <div class="queue-column col-ready-to-pay">
            <div class="column-header">
              <span class="column-title">✅ Siap Bayar (Ready)</span>
              <span class="column-count">${readyOrders.length}</span>
            </div>
            <div class="column-cards" style="display: flex; flex-direction: column; gap: 12px;">
              ${readyOrders.length === 0 ? `<div style="text-align: center; padding: 24px 0; font-size: 12px; color: var(--text-light);">Tidak ada order siap bayar</div>` : ''}
              ${readyOrders.map(o => this.renderCardHtml(o)).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderCardHtml(order) {
    const isWorkshop = order.business_type === 'WORKSHOP';
    
    // Action buttons depending on state
    let actionBtnHtml = '';
    if (order.status === 'BOOKED') {
      actionBtnHtml = `
        <button class="btn btn-sm btn-primary" onclick="Services.updateOrderStatus(${order.id}, 'QUEUED')">Pelanggan Tiba ➔</button>
      `;
    } else if (order.status === 'QUEUED') {
      actionBtnHtml = `
        <button class="btn btn-sm btn-primary" onclick="Services.updateOrderStatus(${order.id}, 'IN_PROGRESS')">Mulai Servis ⚙️</button>
      `;
    } else if (order.status === 'IN_PROGRESS') {
      actionBtnHtml = `
        <button class="btn btn-sm btn-secondary" onclick="Services.openAddPartModal(${order.id})" title="Tambah oli/sparepart/bahan">+ Bahan</button>
        <button class="btn btn-sm btn-success" onclick="Services.updateOrderStatus(${order.id}, 'READY_TO_PAY')">Selesai ✅</button>
      `;
    } else if (order.status === 'READY_TO_PAY') {
      actionBtnHtml = `
        <button class="btn btn-sm btn-primary" onclick="POS.loadServiceOrderToCart(${order.id})">Bayar di Kasir 💳</button>
      `;
    }

    // Items snippet
    const itemsText = order.items && order.items.length > 0 
      ? order.items.map(i => `${i.item_name} (x${i.qty})`).join(', ')
      : 'Belum ada item tindakan';

    return `
      <div class="service-card" id="card-${order.id}">
        <div class="card-top">
          <span class="card-order-num">${order.order_number}</span>
          ${Format.businessBadge(order.business_type)}
        </div>

        <div>
          <div class="card-customer">${order.customer_name}</div>
          <div class="card-asset">
            <span>${isWorkshop ? '🏍️' : '💇'}</span>
            <span>${order.asset_identifier}</span>
          </div>
        </div>

        <div class="card-meta-grid">
          <div class="meta-item">
            <span class="meta-label">Fasilitas</span>
            <span class="meta-val">${order.resource_name}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Staf Pelaksana</span>
            <span class="meta-val">${order.staff_name}</span>
          </div>
          <div class="meta-item" style="grid-column: span 2;">
            <span class="meta-label">Waktu Pengerjaan</span>
            <span class="meta-val">${Format.timeOnly(order.scheduled_start)} - ${Format.timeOnly(order.scheduled_end)}</span>
          </div>
        </div>

        <div class="card-items-preview">
          <div style="font-weight: 600; color: var(--text-main); margin-bottom: 2px;">Item Servis & Bahan:</div>
          <div style="font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${itemsText}</div>
        </div>

        <div class="card-footer">
          <div class="card-total">${Format.rupiah(order.grand_total)}</div>
          <div class="card-actions">
            <button class="btn btn-sm btn-secondary" onclick="Services.openDetailModal(${order.id})">🔍</button>
            ${actionBtnHtml}
          </div>
        </div>
      </div>
    `;
  },

  setFilter(type) {
    this.activeBusinessType = type;
    this.render();
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      App.toast('Memperbarui status...', 'info');
      const res = await API.put(`/services/orders/${orderId}/status`, { status: newStatus });
      if (res.success) {
        App.toast(res.message, 'success');
        this.render();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  // Modal 1: Buat Reservasi Baru dengan Real-time Collision Check
  openBookingModal() {
    const modal = document.getElementById('modalContainer');
    const now = new Date();
    const startTimeStr = new Date(now.getTime() + 15 * 60000).toISOString().slice(0, 16);
    const endTimeStr = new Date(now.getTime() + 75 * 60000).toISOString().slice(0, 16);

    modal.innerHTML = `
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>➕ Buat SPK / Reservasi Servis Baru</h3>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <!-- Real-time Collision Warning Banner -->
          <div id="collisionAlert" class="error-message" style="display: none; margin-bottom: 16px;">
            <span id="collisionMsg">Peringatan bentrok jadwal!</span>
          </div>

          <form id="bookingForm" onsubmit="Services.submitBooking(event)">
            <div class="form-grid-2">
              <div class="form-group">
                <label>Lini Bisnis</label>
                <select id="b_type" onchange="Services.handleBusinessTypeChange(this.value)">
                  <option value="WORKSHOP">🔧 Bengkel & Carwash</option>
                  <option value="SALON">✂️ Salon & Treatment</option>
                </select>
              </div>

              <div class="form-group">
                <label id="assetLabel">No. Plat & Tipe Kendaraan</label>
                <input type="text" id="b_asset" placeholder="Contoh: B 1234 ABC (Vario 160)" required />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label>Nama Pelanggan</label>
                <input type="text" id="b_customer_name" placeholder="Nama lengkap" required />
              </div>
              <div class="form-group">
                <label>No. HP / WhatsApp</label>
                <input type="text" id="b_customer_phone" placeholder="08xxxxxxxxxx" />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label>Waktu Mulai</label>
                <input type="datetime-local" id="b_start" value="${startTimeStr}" onchange="Services.triggerCollisionCheck()" required />
              </div>
              <div class="form-group">
                <label>Waktu Selesai (Estimasi)</label>
                <input type="datetime-local" id="b_end" value="${endTimeStr}" onchange="Services.triggerCollisionCheck()" required />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label id="resourceLabel">Fasilitas Fisik (Pit / Bay)</label>
                <select id="b_resource" onchange="Services.triggerCollisionCheck()" required></select>
              </div>
              <div class="form-group">
                <label id="staffLabel">Tenaga Ahli (Mekanik)</label>
                <select id="b_staff" onchange="Services.triggerCollisionCheck()" required></select>
              </div>
            </div>

            <div class="form-group">
              <label>Pilih Layanan Jasa Utama</label>
              <select id="b_service_item" required></select>
            </div>

            <div class="form-group">
              <label>Catatan Keluhan / Instruksi Tambahan</label>
              <textarea id="b_notes" rows="2" placeholder="Keluhan konsumen / diagnosa..."></textarea>
            </div>

            <div class="modal-footer" style="padding: 16px 0 0 0;">
              <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitBooking">💾 Simpan & Terbitkan SPK</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    this.handleBusinessTypeChange('WORKSHOP');
  },

  handleBusinessTypeChange(bType) {
    const assetLabel = document.getElementById('assetLabel');
    const bAsset = document.getElementById('b_asset');
    const resourceLabel = document.getElementById('resourceLabel');
    const staffLabel = document.getElementById('staffLabel');
    const resourceSelect = document.getElementById('b_resource');
    const staffSelect = document.getElementById('b_staff');
    const serviceSelect = document.getElementById('b_service_item');

    if (bType === 'WORKSHOP') {
      assetLabel.textContent = 'No. Plat & Tipe Motor/Mobil';
      bAsset.placeholder = 'Contoh: B 4128 SZZ (Honda Vario 160)';
      resourceLabel.textContent = 'Fasilitas Bengkel (Pit / Bay / Lift)';
      staffLabel.textContent = 'Mekanik Penanggung Jawab';
    } else {
      assetLabel.textContent = 'Profil Rambut / Kulit Pelanggan';
      bAsset.placeholder = 'Contoh: Rambut Bob Pendek (Kulit Kering)';
      resourceLabel.textContent = 'Fasilitas Salon (Kursi / Bed / Room)';
      staffLabel.textContent = 'Stylist / Terapis Pelaksana';
    }

    // Filter resources
    const filteredRes = this.resources.filter(r => r.business_type === bType);
    resourceSelect.innerHTML = filteredRes.map(r => `
      <option value="${r.id}">${r.name} (${r.code}) - ${r.status}</option>
    `).join('');

    // Filter staff
    const filteredStaff = this.staffList.filter(s => s.business_type === bType);
    staffSelect.innerHTML = filteredStaff.map(s => `
      <option value="${s.id}">${s.name} (${s.role_title} • Komisi ${s.default_commission_rate}%)</option>
    `).join('');

    // Filter service items
    const filteredServices = this.itemsCatalog.filter(i => (i.business_type === bType || i.business_type === 'ALL') && i.type === 'SERVICE');
    serviceSelect.innerHTML = filteredServices.map(i => `
      <option value="${i.id}" data-price="${i.price}" data-name="${i.name}">${i.name} - ${Format.rupiah(i.price)} (${i.duration_minutes} mnt)</option>
    `).join('');

    this.triggerCollisionCheck();
  },

  async triggerCollisionCheck() {
    const resourceId = document.getElementById('b_resource')?.value;
    const staffId = document.getElementById('b_staff')?.value;
    const start = document.getElementById('b_start')?.value;
    const end = document.getElementById('b_end')?.value;
    const alertBox = document.getElementById('collisionAlert');
    const alertMsg = document.getElementById('collisionMsg');
    const btnSubmit = document.getElementById('btnSubmitBooking');

    if (!resourceId || !staffId || !start || !end) return;

    try {
      const res = await API.post('/services/check-collision', {
        resource_id: resourceId,
        staff_id: staffId,
        scheduled_start: start,
        scheduled_end: end
      });

      if (res.hasCollision) {
        alertBox.style.display = 'block';
        alertMsg.textContent = '⚠️ ' + res.reason;
        btnSubmit.disabled = true;
      } else {
        alertBox.style.display = 'none';
        btnSubmit.disabled = false;
      }
    } catch (err) {
      console.warn('Collision check error:', err);
    }
  },

  async submitBooking(e) {
    e.preventDefault();
    const serviceSelect = document.getElementById('b_service_item');
    const selectedOpt = serviceSelect.options[serviceSelect.selectedIndex];
    
    const payload = {
      business_type: document.getElementById('b_type').value,
      asset_identifier: document.getElementById('b_asset').value.trim(),
      customer_name: document.getElementById('b_customer_name').value.trim(),
      customer_phone: document.getElementById('b_customer_phone').value.trim(),
      scheduled_start: document.getElementById('b_start').value,
      scheduled_end: document.getElementById('b_end').value,
      resource_id: Number(document.getElementById('b_resource').value),
      staff_id: Number(document.getElementById('b_staff').value),
      notes: document.getElementById('b_notes').value.trim(),
      status: 'BOOKED',
      service_items: [
        {
          item_id: Number(selectedOpt.value),
          item_name: selectedOpt.dataset.name,
          item_type: 'SERVICE',
          unit_price: Number(selectedOpt.dataset.price),
          qty: 1
        }
      ]
    };

    try {
      App.toast('Menerbitkan SPK...', 'info');
      const res = await API.post('/services/orders', payload);
      if (res.success) {
        App.toast(`SPK ${res.order.order_number} berhasil dibuat!`, 'success');
        App.closeModal();
        this.render();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  // Modal 2: Tambah Part/Bahan Konsumsi
  openAddPartModal(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const consumables = this.itemsCatalog.filter(i => 
      (i.business_type === order.business_type || i.business_type === 'ALL') && 
      i.type === 'CONSUMABLE'
    );

    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>📦 Pakai Sparepart / Bahan Habis Pakai</h3>
          <button class="modal-close" onclick="App.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div style="background: #f8fafc; padding: 12px; border-radius: var(--radius-md); margin-bottom: 16px; font-size: 13px;">
            <div><b>Order:</b> ${order.order_number} (${order.customer_name})</div>
            <div><b>Unit:</b> ${order.asset_identifier}</div>
          </div>

          <form id="addPartForm" onsubmit="Services.submitAddPart(event, ${order.id})">
            <div class="form-group">
              <label>Pilih Sparepart / Bahan</label>
              <select id="part_item_id" required>
                ${consumables.map(c => `
                  <option value="${c.id}">${c.name} - ${Format.rupiah(c.price)} (Sisa Stok: ${c.stock} ${c.unit})</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label>Jumlah Pemakaian (Qty)</label>
              <input type="number" id="part_qty" value="1" min="1" step="0.5" required />
            </div>

            <div class="modal-footer" style="padding: 16px 0 0 0;">
              <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
              <button type="submit" class="btn btn-primary">➕ Masukkan ke SPK</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  },

  async submitAddPart(e, orderId) {
    e.preventDefault();
    const itemId = Number(document.getElementById('part_item_id').value);
    const qty = Number(document.getElementById('part_qty').value);

    try {
      App.toast('Menambahkan bahan ke SPK...', 'info');
      const res = await API.post(`/services/orders/${orderId}/items`, {
        item_id: itemId,
        qty: qty
      });

      if (res.success) {
        App.toast('Bahan berhasil dicatat ke dalam SPK!', 'success');
        App.closeModal();
        this.render();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  // Modal 3: Detail SPK Lengkap
  async openDetailModal(orderId) {
    try {
      const res = await API.get(`/services/orders/${orderId}`);
      const order = res.order;
      const modal = document.getElementById('modalContainer');

      modal.innerHTML = `
        <div class="modal modal-lg">
          <div class="modal-header">
            <div>
              <h3>Rincian SPK: ${order.order_number}</h3>
              <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${Format.dateTime(order.scheduled_start)} • ${Format.businessBadge(order.business_type)}</div>
            </div>
            <button class="modal-close" onclick="App.closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-grid-2" style="margin-bottom: 16px; font-size: 13.5px; background: #f8fafc; padding: 16px; border-radius: var(--radius-md);">
              <div>
                <div style="color: var(--text-muted); font-size: 12px;">Pelanggan & Kontak</div>
                <div style="font-weight: 700;">${order.customer_name} (${order.customer_phone || '-'})</div>
                <div style="margin-top: 8px; color: var(--text-muted); font-size: 12px;">Identitas Aset</div>
                <div style="font-weight: 700;">${order.asset_identifier}</div>
              </div>
              <div>
                <div style="color: var(--text-muted); font-size: 12px;">Fasilitas & Staf</div>
                <div style="font-weight: 700;">${order.resource_name}</div>
                <div style="font-weight: 600; color: var(--primary);">${order.staff_name}</div>
                <div style="margin-top: 8px; color: var(--text-muted); font-size: 12px;">Status Saat Ini</div>
                <div>${Format.statusBadge(order.status)}</div>
              </div>
            </div>

            ${order.notes ? `
              <div style="font-size: 13px; margin-bottom: 16px; padding: 10px 14px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: var(--radius-md);">
                <b>Catatan/Keluhan:</b> ${order.notes}
              </div>
            ` : ''}

            <h4 style="font-size: 14px; font-weight: 800; margin-bottom: 8px;">Tindakan Jasa & Bahan Habis Pakai:</h4>
            <div class="table-container" style="margin-bottom: 16px;">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Tipe</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Tarif</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(i => `
                    <tr>
                      <td style="font-weight: 600;">${i.item_name}</td>
                      <td>
                        <span class="badge ${i.item_type === 'SERVICE' ? 'badge-info' : 'badge-warning'}">
                          ${i.item_type === 'SERVICE' ? 'JASA' : 'BAHAN'}
                        </span>
                      </td>
                      <td style="text-align: center;">${i.qty}</td>
                      <td style="text-align: right;">${Format.rupiah(i.unit_price)}</td>
                      <td style="text-align: right; font-weight: 700;">${Format.rupiah(i.subtotal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" style="text-align: right; padding: 14px; font-weight: 800; font-size: 14px;">Grand Total:</td>
                    <td style="text-align: right; padding: 14px; font-weight: 800; font-size: 16px; color: var(--primary);">${Format.rupiah(order.grand_total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div class="modal-footer" style="padding: 16px 0 0 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary btn-sm" onclick="App.closeModal(); App.navigate('warranty'); setTimeout(() => { Warranty.switchTab('assets'); const inp = document.getElementById('assetSearchInput'); if (inp) { inp.value = '${order.asset_identifier}'; Warranty.handleAssetSearch(); } }, 200);">
                  🚗 Riwayat Aset Ini
                </button>
                ${order.status === 'COMPLETED' ? `
                  <button class="btn btn-secondary btn-sm" onclick="App.closeModal(); App.navigate('warranty'); setTimeout(() => { Warranty.openSubmitClaimModalForOrder(${order.id}, '${order.order_number}', ${order.odometer_km || 0}); }, 200);">
                    🛡️ Ajukan Klaim Garansi
                  </button>
                ` : ''}
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" onclick="App.closeModal()">Tutup</button>
                ${order.status === 'READY_TO_PAY' ? `
                  <button class="btn btn-primary" onclick="App.closeModal(); POS.loadServiceOrderToCart(${order.id});">Buka di Kasir POS ➔</button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  }
};
