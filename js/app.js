/* 应用启动：路由 + 底部导航 + Service Worker 注册 */
(function () {
  const root = document.getElementById('view-root');
  const nav = document.getElementById('bottom-nav');

  K.navVisible = function (show) { nav.classList.toggle('hidden', !show); };

  K.navigate = function (view, params) {
    params = params || {};
    if (K.cleanupCurrent) {
      try { K.cleanupCurrent(); } catch (e) {}
      K.cleanupCurrent = null;
    }
    const withNav = (view === 'home' || view === 'recipes' || view === 'settings');
    K.navVisible(withNav);
    nav.querySelectorAll('.bottom-nav__item').forEach(b => {
      b.classList.toggle('active', b.dataset.view === view);
    });
    root.innerHTML = '';
    switch (view) {
      case 'home': K.renderHome(root); break;
      case 'recipes': K.renderRecipes(root); break;
      case 'settings': K.renderSettings(root); break;
      case 'wizard': K.renderWizard(root, params); break;
      case 'cooking': K.renderCooking(root, params); break;
    }
    window.scrollTo(0, 0);
    // 记录路由，刷新后保留当前页面
    try { sessionStorage.setItem('kitchen.route', JSON.stringify({ view: view, params: params || {} })); } catch (e) {}
  };

  nav.addEventListener('click', e => {
    const btn = e.target.closest('.bottom-nav__item');
    if (!btn) return;
    K.navigate(btn.dataset.view);
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  // 启动：优先恢复上次页面（误触刷新后不回主页）
  let boot = 'home', bootParams = {};
  try {
    const saved = JSON.parse(sessionStorage.getItem('kitchen.route') || 'null');
    if (saved && saved.view) { boot = saved.view; bootParams = saved.params || {}; }
  } catch (e) {}
  K.navigate(boot, bootParams);
})();
