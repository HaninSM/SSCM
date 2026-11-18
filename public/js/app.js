/**
 * SSCM Master Application Controller
 */
const App = {
  activeTab: 'dashboard',

  init() {
    // Check authentication
    const token = API.getToken();
    if (!token) {
      window.location.href = '/';
      return;
    }

    const user = API.getUser();
    if (user) {
      document.getElementById('userName').textContent = user.name || user.username;
      document.getElementById('userRole').textContent = user.role.toUpperCase();
      const initials = (user.name || user.username).substring(0, 2).toUpperCase();
      document.getElementById('userAvatar').textContent = initials;
    }

    // Modal click outside to close
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        this.closeModal();
      }
    });

    // Keyboard ESC to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });

    // Load initial tab
    this.navigate('dashboard');
  },

  navigate(tabId) {
    this.activeTab = tabId;
    Sidebar.render();

    const titles = {
      'dashboard': 'Dashboard Ringkasan Operasional',
      'services': 'Papan Layanan & Antrean (SSCM)',
      'pos': 'Kasir POS & Penagihan Split Payment',
      'commissions': 'Rekapitulasi Komisi Teknisi & Terapis',
      'items': 'Katalog Jasa & Inventori Suku Cadang'
    };

    const titleElem = document.getElementById('pageTitle');
    if (titleElem) {
      titleElem.textContent = titles[tabId] || 'Dashboard';
    }

    switch (tabId) {
      case 'dashboard':
        Dashboard.render();
        break;
      case 'services':
        Services.render();
        break;
      case 'pos':
        POS.render();
        break;
      case 'commissions':
        Commissions.render();
        break;
      case 'items':
        Items.render();
        break;
      default:
        Dashboard.render();
    }
  },

  closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.style.display = 'none';
    modalContainer.innerHTML = '';
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      'success': '✅',
      'danger': '⚠️',
      'info': 'ℹ️'
    };

    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${icons[type] || 'ℹ️'}</span>
      <span style="flex: 1; font-size: 0.82rem; font-weight: 600;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  handleGlobalSearch(query) {
    if (!query) return;
    this.navigate('services');
    setTimeout(() => {
      Services.activeBusinessType = 'ALL';
      Services.render();
      this.toast(`Mencari: "${query}" di daftar antrean`, 'info');
    }, 200);
  }
};

// Start application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
