/* 开始烹饪：选菜谱 -> 烹饪流程（食材统计 + 栏位模块 + 倒计时 + 拖拽 + 全屏） */
(function () {
  let root = null;
  let step = 1;
  let selectedIds = [];
  let counts = {};      // recipeId -> 份数
  let searchQuery = '';
  let sortMode = 'time';  // 'time' 按添加时间 | 'freq' 按使用频率
  let recipes = [];     // [{recipeId, name, slots: [{key, label, keys:[...]}]}]
  let moduleMap = {};   // key -> runtime module（含计时状态，稳定）
  let zoom = 1;         // 放缩比例（0.4 ~ 2.0）
  let prepMode = 'triple';  // 'single' 单列 | 'triple' 三列（默认三列）

  const TAG = { tool: '厨具', action: '动作', time: '时间', note: '备注' };

  /* ------- 全屏 ------- */
  function enterFullscreen() {
    try {
      const el = document.documentElement;
      const p = el.requestFullscreen ? el.requestFullscreen() : (el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null);
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
    try {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    } catch (e) {}
    document.body.classList.add('cooking-mode');
  }
  function exitFullscreen() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (e) {}
    try {
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    } catch (e) {}
    document.body.classList.remove('cooking-mode');
  }

  function clearAllTimers() {
    Object.keys(moduleMap).forEach(k => {
      const m = moduleMap[k];
      if (m.timer) { clearInterval(m.timer); m.timer = null; }
      m.running = false;
    });
  }

  K.renderCooking = function (container) {
    root = container;
    step = 1;
    selectedIds = [];
    counts = {};
    searchQuery = '';
    sortMode = 'time';
    recipes = [];
    moduleMap = {};
    zoom = 1;
    prepMode = 'triple';
    K.cleanupCurrent = function () { clearAllTimers(); exitFullscreen(); };
    render();
  };

  function render() {
    const sy = window.scrollY;
    root.innerHTML = (step === 1 ? step1HTML() : step2HTML());
    if (step === 1) bindStep1(); else bindStep2();
    window.scrollTo(0, sy);
  }

  /* ---------------- 步骤 1：选择菜谱 ---------------- */
  function searchableRecipes() {
    const q = (searchQuery || '').trim().toLowerCase();
    const recipes = K.getRecipes().slice();
    if (sortMode === 'freq') {
      recipes.sort((a, b) => ((b.useCount || 0) - (a.useCount || 0)) || ((b.createdAt || 0) - (a.createdAt || 0)));
    } else {
      recipes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    if (!q) return recipes;
    return recipes.filter(r => {
      if ((r.name || '').toLowerCase().indexOf(q) >= 0) return true;
      if ((r.cookingMethod || '').toLowerCase().indexOf(q) >= 0) return true;
      const ing = [];
      (r.meats || []).forEach(x => ing.push(x.name));
      (r.vegetables || []).forEach(x => ing.push(x.name));
      return ing.some(n => (n || '').toLowerCase().indexOf(q) >= 0);
    });
  }

  function step1HTML() {
    return '<div class="view" style="padding-bottom:130px;">' +
      '<div class="flow-head">' +
        '<button class="btn btn--icon" id="flow-back">' + K.icon('back', 20) + '</button>' +
        '<div class="fh-title">选择要烹饪的菜谱</div>' +
        '<div class="fh-step">1/2</div>' +
      '</div>' +
      '<div class="search-bar">' + K.icon('search', 19) +
        '<input id="cook-search" placeholder="按名称 / 烹饪方式 / 主料食材搜索" value="' + K.esc(searchQuery) + '">' +
      '</div>' +
      '<div class="seg seg--sm" id="sort-toggle" style="margin:10px 0 4px;">' +
        '<button class="seg__btn' + (sortMode === 'time' ? ' active' : '') + '" data-sort="time">按时间添加</button>' +
        '<button class="seg__btn' + (sortMode === 'freq' ? ' active' : '') + '" data-sort="freq">按使用频率</button>' +
      '</div>' +
      '<div class="grid-2" id="cook-grid"></div>' +
    '</div>' +
    '<div class="page-footer"><button class="btn btn--primary btn--block" id="cook-next">选好了</button></div>';
  }

  function renderCookGrid() {
    const grid = document.getElementById('cook-grid');
    const list = searchableRecipes();
    if (!list.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1;">' + K.icon('recipe', 42) + '<div style="margin-top:10px;">' + (K.getRecipes().length ? '没有匹配的菜谱' : '还没有菜谱，请先到「菜谱」页添加') + '</div></div>';
      return;
    }
    grid.innerHTML = list.map(r => {
      const sel = selectedIds.indexOf(r.id) >= 0;
      const cnt = counts[r.id] || 1;
      const img = r.photo ? '<img class="recipe-tile__img" src="' + r.photo + '" alt="">' : '<div class="recipe-tile__ph ' + K.phClass(r.id) + '">🍲</div>';
      return '<div class="recipe-tile' + (sel ? ' selected' : '') + '" data-id="' + r.id + '">' +
        img +
        '<span class="select-check">' + (sel ? K.icon('check', 15) : '') + '</span>' +
        '<div class="recipe-tile__name">' + K.esc(r.name || '未命名菜谱') + '</div>' +
        '<div class="recipe-tile__meta">' + K.esc(r.cookingMethod || '') + '</div>' +
        (sel ? '<div class="qty-stepper">' +
          '<button class="qty-btn" data-qty-minus="' + r.id + '">−</button>' +
          '<span class="qty-count">×' + cnt + '</span>' +
          '<button class="qty-btn" data-qty-plus="' + r.id + '">＋</button>' +
        '</div>' : '') +
      '</div>';
    }).join('');
  }

  function bindStep1() {
    document.getElementById('flow-back').addEventListener('click', () => K.navigate('home'));
    const search = document.getElementById('cook-search');
    search.addEventListener('input', () => { searchQuery = search.value; renderCookGrid(); });

    const sortToggle = document.getElementById('sort-toggle');
    sortToggle.addEventListener('click', e => {
      const btn = e.target.closest('[data-sort]');
      if (!btn) return;
      sortMode = btn.dataset.sort;
      sortToggle.querySelectorAll('.seg__btn').forEach(b => b.classList.toggle('active', b === btn));
      renderCookGrid();
    });

    const grid = document.getElementById('cook-grid');
    grid.addEventListener('click', e => {
      const qPlus = e.target.closest('[data-qty-plus]');
      if (qPlus) { const id = qPlus.dataset.qtyPlus; counts[id] = Math.min(99, (counts[id] || 1) + 1); renderCookGrid(); return; }
      const qMinus = e.target.closest('[data-qty-minus]');
      if (qMinus) { const id = qMinus.dataset.qtyMinus; counts[id] = Math.max(1, (counts[id] || 1) - 1); renderCookGrid(); return; }
      const tile = e.target.closest('.recipe-tile');
      if (!tile) return;
      const id = tile.dataset.id;
      const i = selectedIds.indexOf(id);
      if (i >= 0) { selectedIds.splice(i, 1); delete counts[id]; } else { selectedIds.push(id); counts[id] = 1; }
      renderCookGrid();
    });

    document.getElementById('cook-next').addEventListener('click', () => {
      if (!selectedIds.length) { K.toast('请先选择至少一道菜谱'); return; }
      buildRuntime();
      step = 2;
      render();
      window.scrollTo(0, 0);
      enterFullscreen();
    });

    renderCookGrid();
  }

  function buildRuntime() {
    moduleMap = {};
    recipes = [];
    selectedIds.forEach(id => {
      const r = K.getRecipe(id);
      if (!r) return;
      const slotDefs = (r.slots && r.slots.length) ? r.slots : [(r.modules || [])];
      const col = { recipeId: r.id, name: r.name, slots: [] };
      slotDefs.forEach((slotModules, si) => {
        const slotKey = r.id + '-s' + si;
        const keys = slotModules.map((m, mi) => {
          const key = r.id + '-' + si + '-' + mi + '-' + K.uid().slice(0, 4);
          const rt = {
            key: key, type: m.type, name: m.name, text: m.text || '', note: m.note || '',
            seconds: m.seconds || 0, remaining: m.seconds || 0, running: false, timer: null,
            popup: m.popup !== false, showSauce: m.showSauce !== false, sauceText: '', sauceDetail: ''
          };
          if (m.type === 'action' && (m.name === '腌制' || m.name === '调味') && m.sauceId != null && r.sauces[m.sauceId]) {
            rt.sauceText = (r.sauces[m.sauceId].selected || []).join('、') || '未配置食材';
            rt.sauceDetail = K.sauceDetails(r, m.sauceId);
          }
          moduleMap[key] = rt;
          return key;
        });
        col.slots.push({ key: slotKey, label: '栏位 ' + (si + 1), keys: keys });
      });
      recipes.push(col);
    });
  }

  /* ---------------- 步骤 2：烹饪流程 ---------------- */
  function aggregate() {
    const meats = {}, vegs = {}, seasons = {};
    selectedIds.forEach(id => {
      const r = K.getRecipe(id);
      if (!r) return;
      const mult = counts[id] || 1;
      (r.meats || []).forEach(m => {
        const n = (m.name || '').trim(); if (!n) return;
        const k = n + '|' + (m.unit || '');
        if (!meats[k]) meats[k] = { name: n, unit: m.unit || '', qty: 0, thaw: false };
        meats[k].qty += (parseFloat(m.qty) || 0) * mult;
        if (m.thaw) meats[k].thaw = true;
      });
      (r.vegetables || []).forEach(v => {
        const n = (v.name || '').trim(); if (!n) return;
        const k = n + '|' + (v.unit || '');
        if (!vegs[k]) vegs[k] = { name: n, unit: v.unit || '', qty: 0 };
        vegs[k].qty += (parseFloat(v.qty) || 0) * mult;
      });
      (r.sauces || []).forEach(s => {
        K.SEASONINGS.forEach(se => {
          const st = r.seasonings && r.seasonings[se.key];
          if (st && st.sel) {
            if (!seasons[se.key]) seasons[se.key] = { name: se.key, unit: K.seasoningUnit(r, se.key), qty: 0 };
            seasons[se.key].qty += (parseFloat(s.amounts[se.key]) || 0) * mult;
          }
        });
      });
    });
    return { meats: Object.values(meats), vegs: Object.values(vegs), seasons: Object.values(seasons) };
  }

  function qtyStr(x) { return x.qty > 0 ? (x.qty + (x.unit || '')) : ''; }

  function step2HTML() {
    const agg = aggregate();

    const sumTags = (arr) => arr.map(x => {
      const q = qtyStr(x);
      return '<span class="sum-tag">' + K.esc(x.name) + (q ? ' <span class="q">' + K.esc(q) + '</span>' : '') + '</span>';
    }).join('');

    const prepItems = [];
    const vegSeen = {};
    selectedIds.forEach(id => {
      const r = K.getRecipe(id); if (!r) return;
      (r.vegetables || []).forEach(v => {
        const n = (v.name || '').trim(); if (!n) return;
        const k = n + '|' + (v.process || '');
        if (vegSeen[k]) return; vegSeen[k] = true;
        prepItems.push({ cat: '素菜', name: n, detail: v.process || '' });
      });
    });
    const seasonSeen = {};
    selectedIds.forEach(id => {
      const r = K.getRecipe(id); if (!r) return;
      K.selectedSeasonings(r).forEach(s => {
        if (seasonSeen[s.key]) return; seasonSeen[s.key] = true;
        const detail = s.variant && s.variant !== s.key ? s.variant : '';
        prepItems.push({ cat: '调味料', name: s.key, detail: detail });
      });
    });
    const meatSeen = {};
    selectedIds.forEach(id => {
      const r = K.getRecipe(id); if (!r) return;
      (r.meats || []).forEach(m => {
        const n = (m.name || '').trim(); if (!n) return;
        const k = n + '|' + (m.process || '');
        if (meatSeen[k]) return; meatSeen[k] = true;
        prepItems.push({ cat: '肉类', name: n, detail: m.process || '' });
      });
    });

    const prepItemHTML = (p, withBadge) =>
      '<div class="prep-item">' +
        (withBadge ? '<span class="pi-badge">' + K.esc(p.cat) + '</span>' : '') +
        '<span class="pi-name">' + K.esc(p.name) + '</span>' +
        (p.detail ? '<span class="pi-detail">' + K.esc(p.detail) + '</span>' : '') +
      '</div>';

    const singlePrepHTML = prepItems.map(p => prepItemHTML(p, true)).join('');
    const prepOrder = ['素菜', '调味料', '肉类'];
    const triplePrepHTML = prepOrder.map(cat => {
      const items = prepItems.filter(p => p.cat === cat);
      return '<div class="prep-col">' +
        '<div class="prep-col__head">' + K.esc(cat) + '</div>' +
        (items.length ? items.map(p => prepItemHTML(p, false)).join('') : '<div class="prep-empty">无</div>') +
      '</div>';
    }).join('');

    const sauceStats = selectedIds.map(id => {
      const r = K.getRecipe(id);
      if (!r) return null;
      const mult = counts[id] || 1;
      const details = (r.sauces || []).map((s, si) => {
        const d = K.sauceDetails(r, si, mult);
        return d ? '酱汁' + (si + 1) + '：' + d : '';
      }).filter(t => t);
      return details.length ? { name: r.name, details: details } : null;
    }).filter(Boolean);

    const sauceStatsHTML = sauceStats.map(x =>
      '<div class="sauce-stat">' +
        '<div class="sauce-stat__recipe">' + K.esc(x.name || '菜谱') + '</div>' +
        x.details.map(d => '<div class="sauce-stat__item">' + K.esc(d) + '</div>').join('') +
      '</div>'
    ).join('');

    const colsHTML = recipes.map((rc, ci) =>
      '<div class="recipe-col recipe-col--c' + (ci % 6) + '" data-recipe="' + K.esc(rc.recipeId) + '">' +
        '<div class="recipe-col__head">' +
          '<div class="recipe-col__handle">' + K.icon('grip', 15) + '</div>' +
          '<span class="recipe-col__name">' + K.esc(rc.name || '菜谱') + '</span>' +
        '</div>' +
        '<div class="recipe-col__slots">' +
          rc.slots.map(sl =>
            '<div class="slot" data-slot-key="' + K.esc(sl.key) + '">' +
              '<div class="slot__head"><span class="slot__title">' + K.esc(sl.label) + '</span></div>' +
              '<div class="slot-modules">' +
                (sl.keys.length
                  ? sl.keys.map(k => flowModuleHTML(moduleMap[k])).join('')
                  : '<div class="empty" style="width:100%;padding:8px 0;">无模块</div>') +
              '</div>' +
            '</div>'
          ).join('') +
        '</div>' +
      '</div>'
    ).join('');

    return '<div class="cooking-flow">' +
      '<div class="flow-head">' +
        '<button class="btn btn--icon" id="flow-back">' + K.icon('back', 20) + '</button>' +
        '<div class="fh-title">烹饪流程</div>' +
        '<button class="btn btn--soft landscape-btn" id="enter-landscape">' + K.icon('reset', 14) + ' 横屏</button>' +
        '<div class="zoom-control">' +
          '<button class="zoom-btn" id="zoom-out">−</button>' +
          '<span class="zoom-val" id="zoom-val">100%</span>' +
          '<button class="zoom-btn" id="zoom-in">＋</button>' +
        '</div>' +
        '<button class="hold-btn hold-btn--rect" id="end-cook">长按结束烹饪</button>' +
      '</div>' +
      '<div class="cooking-flow__body">' +
        '<div class="summary-card">' +
          '<div class="sum-title">' + K.icon('seasoning', 16) + ' 食材汇总</div>' +
          (agg.meats.length ? '<div style="font-size:12px;color:#7C7C86;margin-top:6px;">肉类</div><div class="sum-row">' + sumTags(agg.meats.map(x => Object.assign({}, x, { name: (x.thaw ? '解冻的' : '') + x.name }))) + '</div>' : '') +
          (agg.vegs.length ? '<div style="font-size:12px;color:#7C7C86;margin-top:6px;">素菜</div><div class="sum-row">' + sumTags(agg.vegs) + '</div>' : '') +
          (agg.seasons.length ? '<div style="font-size:12px;color:#7C7C86;margin-top:6px;">调味料</div><div class="sum-row">' + sumTags(agg.seasons) + '</div>' : '') +
          (!agg.meats.length && !agg.vegs.length && !agg.seasons.length ? '<div style="font-size:13px;color:#7C7C86;">暂无食材</div>' : '') +
        '</div>' +
        '<div class="prep-list">' +
          '<div class="prep-head">' +
            '<div style="font-size:14px;font-weight:800;">' + K.icon('check', 16) + ' 备料清单</div>' +
            '<button class="prep-toggle" id="prep-toggle">' + (prepMode === 'single' ? '切换三列' : '切换单列') + '</button>' +
          '</div>' +
          (prepItems.length
            ? (prepMode === 'single'
                ? '<div class="prep-single">' + singlePrepHTML + '</div>'
                : '<div class="prep-cols">' + triplePrepHTML + '</div>')
            : '<div style="font-size:13px;color:#7C7C86;">暂无备料</div>') +
        '</div>' +
        (sauceStats.length
          ? '<div class="sauce-stats-card">' +
              '<div class="sum-title">' + K.icon('sauce', 16) + ' 酱汁统计</div>' +
              sauceStatsHTML +
            '</div>'
          : '') +
        '<div class="section-title">' + K.icon('grip', 18) + '烹饪栏位（一个菜谱一列，拖动可换序，计时可点击）</div>' +
        '<div id="module-area" class="module-area--cols">' + (colsHTML || '<div class="empty">没有选中的菜谱</div>') + '</div>' +
      '</div>' +
    '</div>';
  }

  function flowModuleHTML(m) {
    let body = '';
    if (m.type === 'tool') {
      body = '<div class="module__title">' + K.esc(m.name) + '</div>';
    } else if (m.type === 'action') {
      const sauceInfo = m.sauceText ? (m.showSauce && m.sauceDetail ? m.sauceDetail : m.sauceText) : '';
      body = '<div class="module__title">' + K.esc(m.name) + '</div>' +
        (sauceInfo ? '<div style="font-size:10px;color:#7C7C86;margin-top:2px;line-height:1.3;">' + K.esc(sauceInfo) + '</div>' : '');
    } else if (m.type === 'time') {
      body = '<div class="timer__label">倒计时</div>' +
        '<div class="timer__display' + (m.running ? ' running' : '') + '" data-key="' + m.key + '">' + K.fmtDuration(m.remaining) + '</div>' +
        '<div class="timer__controls">' +
          '<button class="timer__btn timer__btn--start" data-key="' + m.key + '" data-a="toggle">' + (m.running ? '暂停' : '开始') + '</button>' +
          '<button class="timer__btn stop" data-key="' + m.key + '" data-a="reset">重置</button>' +
        '</div>';
    }

    const note = m.note || m.text || '';
    if (note) body += '<div style="font-size:10px;color:#7C7C86;margin-top:3px;line-height:1.3;">📝 ' + K.esc(note) + '</div>';

    return '<div class="module flow-module" data-key="' + m.key + '">' +
      '<div class="module__top">' +
        '<div class="module__handle">' + K.icon('grip', 13) + '</div>' +
      '</div>' +
      '<div class="module__body">' +
        '<span class="module__tag module__tag--' + m.type + '">' + (TAG[m.type] || '模块') + '</span>' +
        body +
      '</div>' +
    '</div>';
  }

  function bindStep2() {
    document.getElementById('flow-back').addEventListener('click', () => {
      clearAllTimers();
      exitFullscreen();
      step = 1;
      render();
      window.scrollTo(0, 0);
    });

    const area = document.getElementById('module-area');

    // 计时器：单击 开始/暂停，双击 重置
    Object.keys(moduleMap).forEach(k => {
      const m = moduleMap[k];
      if (m.type !== 'time') return;
      const card = area.querySelector('.flow-module[data-key="' + k + '"]');
      if (!card) return;
      const display = card.querySelector('.timer__display');
      let clickTimer = null;
      display.addEventListener('click', () => {
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; resetTimer(m); }
        else clickTimer = setTimeout(() => { clickTimer = null; toggleTimer(m); }, 260);
      });
      card.querySelectorAll('.timer__btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.a === 'toggle') toggleTimer(m);
          else resetTimer(m);
        });
      });
    });

    // 拖拽：模块（栏位内横向 / 可跨栏位）
    K.makeDraggable({
      root: area, itemSelector: '.flow-module', handleSelector: '.module__handle',
      containerSelector: '.slot-modules', axis: 'x', onDrop: rebuildFromDOM
    });
    // 拖拽：整列菜谱（左右移动）
    K.makeDraggable({
      root: area, itemSelector: '.recipe-col', handleSelector: '.recipe-col__handle',
      containerSelector: '#module-area', axis: 'x', onDrop: rebuildFromDOM
    });

    // 放缩
    document.getElementById('zoom-out').addEventListener('click', () => adjustZoom(-0.1));
    document.getElementById('zoom-in').addEventListener('click', () => adjustZoom(0.1));
    applyZoom();

    // 主动进入横屏
    document.getElementById('enter-landscape').addEventListener('click', () => enterFullscreen());

    // 备料清单单列/三列切换
    document.getElementById('prep-toggle').addEventListener('click', () => {
      prepMode = prepMode === 'single' ? 'triple' : 'single';
      render();
    });

    // 长按结束烹饪
    const hold = document.getElementById('end-cook');
    let holdTimer = null;
    const startHold = () => { hold.classList.add('holding'); holdTimer = setTimeout(() => endCooking(), 900); };
    const cancelHold = () => { clearTimeout(holdTimer); hold.classList.remove('holding'); };
    hold.addEventListener('pointerdown', startHold);
    hold.addEventListener('pointerup', cancelHold);
    hold.addEventListener('pointercancel', cancelHold);
    hold.addEventListener('pointerleave', cancelHold);
  }

  function rebuildFromDOM() {
    const area = document.getElementById('module-area');
    if (!area) return;
    const colEls = Array.from(area.querySelectorAll(':scope > .recipe-col'));
    recipes = colEls.map(colEl => {
      const rid = colEl.dataset.recipe;
      const orig = recipes.find(x => x.recipeId === rid);
      const slotEls = Array.from(colEl.querySelectorAll(':scope > .recipe-col__slots > .slot'));
      const slots = slotEls.map(slEl => {
        const key = slEl.dataset.slotKey;
        const o = orig ? orig.slots.find(s => s.key === key) : null;
        const keys = Array.from(slEl.querySelectorAll(':scope > .slot-modules > .flow-module')).map(el => el.dataset.key);
        return { key: key, label: o ? o.label : '', keys: keys };
      });
      return { recipeId: rid, name: orig ? orig.name : '', slots: slots };
    });
  }

  function applyZoom() {
    const area = document.getElementById('module-area');
    if (area) {
      if (area.style.setProperty) area.style.setProperty('--module-zoom', zoom);
      else area.style['--module-zoom'] = zoom;
    }
    const val = document.getElementById('zoom-val');
    if (val) val.textContent = Math.round(zoom * 100) + '%';
  }
  function adjustZoom(d) {
    zoom = Math.max(0.4, Math.min(2, Math.round((zoom + d) * 10) / 10));
    applyZoom();
  }

  /* ------- 计时 + 提醒 ------- */
  let audioCtx = null;
  function ensureAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) { return null; }
  }
  function ring(seconds) {
    try {
      const ctx = ensureAudio();
      if (!ctx) return;
      const start = ctx.currentTime + 0.05;
      const n = Math.floor(seconds * 2);
      for (let i = 0; i < n; i++) {
        const t = start + i * 0.5;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      }
    } catch (e) {}
  }
  function showTimerPopup(note) {
    const el = document.createElement('div');
    el.className = 'timer-popup';
    el.innerHTML = '<div class="timer-popup__title">⏰ 倒计时结束</div>' +
      (note ? '<div class="timer-popup__note">' + K.esc(note) + '</div>' : '');
    document.body.appendChild(el);
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }, 3000);
  }
  function onTimerEnd(m) {
    if (m.popup === false) return;
    ring(5);
    showTimerPopup(m.note || m.text || '');
  }

  function toggleTimer(m) {
    if (m.running) pauseTimer(m);
    else startTimer(m);
  }
  function startTimer(m) {
    if (m.running) return;
    ensureAudio();
    if (m.remaining <= 0) m.remaining = m.seconds || 0;
    m.running = true;
    m.timer = setInterval(() => {
      m.remaining--;
      if (m.remaining <= 0) { m.remaining = 0; pauseTimer(m); onTimerEnd(m); }
      updateTimerDisplay(m);
    }, 1000);
    updateTimerDisplay(m);
  }
  function pauseTimer(m) {
    m.running = false;
    if (m.timer) { clearInterval(m.timer); m.timer = null; }
    updateTimerDisplay(m);
  }
  function resetTimer(m) {
    pauseTimer(m);
    m.remaining = m.seconds || 0;
    updateTimerDisplay(m);
  }
  function updateTimerDisplay(m) {
    document.querySelectorAll('.timer__display[data-key="' + m.key + '"]').forEach(el => {
      el.textContent = K.fmtDuration(m.remaining);
      el.classList.toggle('running', m.running);
    });
    document.querySelectorAll('.timer__btn--start[data-key="' + m.key + '"]').forEach(el => {
      el.textContent = m.running ? '暂停' : '开始';
    });
  }

  function endCooking() {
    clearAllTimers();
    const names = selectedIds.map(id => { const r = K.getRecipe(id); return r ? (r.name || '未命名菜谱') : ''; }).filter(Boolean);
    selectedIds.forEach(id => K.bumpRecipeUse(id));
    K.addHistory({ id: K.uid(), time: Date.now(), recipeIds: selectedIds.slice(), recipeNames: names, photo: null });
    K.navigate('home');
    K.toast('烹饪结束，已记录到历史');
  }
})();
