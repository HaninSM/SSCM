/**
 * Sidebar Navigation Component
 */
const Sidebar = {
  items: [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'services', label: 'Layanan & Antrean', icon: '⚡', badge: 'SSCM' },
    { id: 'pos', label: 'Kasir POS', icon: '💳' },
    { id: 'commissions', label: 'Rekap Komisi', icon: '💰', role: ['admin'] },
    { id: 'items', label: 'Katalog & Stok', icon: '📦' }
  ],

  render() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    const user = API.getUser() || { role: 'cashier' };
    const currentTab = App.activeTab || 'dashboard';

    let html = '';
    this.items.forEach(item => {
      if (item.role && !item.role.includes(user.role)) {
        return;
      }

      const isActive = item.id === currentTab;
      html += `
        <button class="nav-item ${isActive ? 'active' : ''}" onclick="App.navigate('${item.id}')">
          <span class="icon">${item.icon}</span>
          <span class="label">${item.label}</span>
          ${item.badge ? `<span class="nav-badge" style="margin-left: auto; font-size: 0.65rem; font-weight: 800; background: var(--primary); color: #fff; padding: 0.15rem 0.4rem; border-radius: 9999px;">${item.badge}</span>` : ''}
        </button>
      `;
    });

    nav.innerHTML = html;
  }
};
