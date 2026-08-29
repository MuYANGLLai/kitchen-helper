/* 设置页：版本信息 / 更新 / 数据管理 / 模块工具箱管理 / 酱汁分类管理 */
(function () {
  let settingsRoot = null;
  let openSections = {};

  function cmpVersion(a, b) {
    const pa = String(a || '0').split('.').map(n => parseInt(n, 10) || 0);
    const pb = String(b || '0').split('.').map(n => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const x = pa[i] || 0, y = pb[i] || 0;
      if (x !== y) return x - y;
    }
    return 0;
  }

  function normBaseUrl(url) {
    url = (url || '').trim();
    if (!url) return '';
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    return url.replace(/\/+$/, '');
  }

  async function fetchVersion(baseUrl) {
    const url = baseUrl ? baseUrl + '/version.json?t=' + Date.now() : './version.json?t=' + Date.now();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function doUpdateFromCurrent() {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } catch (e) {}
    setTimeout(() => location.reload(), 600);
  }

  function section(headIcon, title, id, bodyHTML) {
    const open = openSections[id] ? ' open' : '';
    return '<div class="settings-sec">' +
      '<button class="settings-sec__head' + open + '" data-sec-head="' + id + '">' +
        K.icon(headIcon, 18) + '<span>' + title + '</span>' + K.icon('chevDown', 16) +
      '</button>' +
      '<div class="settings-sec__body' + open + '" data-sec-body="' + id + '">' + bodyHTML + '</div>' +
    '</div>';
  }

  function move(list, idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const t = list[idx]; list[idx] = list[j]; list[j] = t;
  }

  /* ---------- 模块工具箱管理 ---------- */
  function mgmtRow(label, type, idx) {
    return '<div class="mgmt-row" data-type="' + type + '" data-idx="' + idx + '">' +
      '<span class="mgmt-label">' + K.esc(label) + '</span>' +
      '<button class="mgmt-btn" data-mgmt-up>↑</button>' +
      '<button class="mgmt-btn" data-mgmt-down>↓</button>' +
      '<button class="mgmt-btn mgmt-btn--del" data-mgmt-del>✕</button>' +
    '</div>';
  }
  function moduleMgmtBody() {
    const tools = K.getToolboxTools();
    const actions = K.getToolboxActions();
    const times = K.getToolboxTimes();
    return '<div class="card" style="margin-top:8px;">' +
      '<div class="mgmt-title">厨具</div>' +
      tools.map((n, i) => mgmtRow(n, 'tool', i)).join('') +
      '<button class="add-line" data-mgmt-add="tool">' + K.icon('plus', 15) + ' 添加厨具</button>' +
      '<div class="mgmt-title" style="margin-top:14px;">动作</div>' +
      actions.map((n, i) => mgmtRow(n, 'action', i)).join('') +
      '<button class="add-line" data-mgmt-add="action">' + K.icon('plus', 15) + ' 添加动作</button>' +
      '<div class="mgmt-title" style="margin-top:14px;">时间</div>' +
      times.map((s, i) => mgmtRow(K.fmtTimeName(s), 'time', i)).join('') +
      '<button class="add-line" data-mgmt-add="time">' + K.icon('plus', 15) + ' 添加时间</button>' +
    '</div>';
  }

  /* ---------- 酱汁分类管理 ---------- */
  function sauceMgmtBody() {
    const cats = K.getSauceCategories();
    return '<div class="card" style="margin-top:8px;">' +
      cats.map((c, ci) =>
        '<div class="mgmt-cat" data-cat-idx="' + ci + '">' +
          '<div class="mgmt-cat__head">' +
            '<span class="mgmt-label mgmt-label--cat">' + K.esc(c.key) + '</span>' +
            '<label class="mgmt-open"><input type="checkbox" data-cat-open' + (c.open ? ' checked' : '') + '>默认展开</label>' +
            '<button class="mgmt-btn" data-cat-up>↑</button>' +
            '<button class="mgmt-btn" data-cat-down>↓</button>' +
            '<button class="mgmt-btn mgmt-btn--del" data-cat-del>✕</button>' +
          '</div>' +
          '<div class="mgmt-cat__items">' +
            (c.items || []).map((it, ii) =>
              '<div class="mgmt-row mgmt-row--item" data-item-idx="' + ii + '">' +
                '<span class="mgmt-label">' + K.esc(it) + '</span>' +
                '<button class="mgmt-btn" data-item-up>↑</button>' +
                '<button class="mgmt-btn" data-item-down>↓</button>' +
                '<button class="mgmt-btn mgmt-btn--del" data-item-del>✕</button>' +
              '</div>'
            ).join('') +
            '<button class="add-line" data-item-add>' + K.icon('plus', 15) + ' 添加配料</button>' +
          '</div>' +
        '</div>'
      ).join('') +
      '<button class="add-line" data-cat-add>' + K.icon('plus', 15) + ' 添加一级分类</button>' +
    '</div>';
  }

  K.renderSettings = function (root) {
    settingsRoot = root;
    renderInternal();
  };

  function refresh() { if (settingsRoot) renderInternal(); }

  function renderInternal() {
    const root = settingsRoot;
    K.cleanupCurrent = function () {};

    const versionBody =
      '<div class="card" style="margin-top:8px;">' +
        '<div class="setting-row" style="margin:0 0 10px;"><span class="sr-label">当前版本</span><span class="sr-val">v' + K.APP_VERSION + '</span></div>' +
        '<div class="setting-row" style="margin:0 0 10px;"><span class="sr-label">存储方式</span><span class="sr-val">本机存储</span></div>' +
        '<div class="setting-row" style="margin:0;"><span class="sr-label">安装方式</span><span class="sr-val">PWA 可安装</span></div>' +
      '</div>';

    const updateBody =
      '<div class="card" style="margin-top:8px;">' +
        '<div style="display:flex;gap:8px;">' +
          '<button class="btn btn--primary" id="update-current" style="flex:1;">' + K.icon('reset', 18) + '检查更新</button>' +
          '<button class="btn btn--mint" id="refresh-btn">' + K.icon('reset', 18) + '刷新</button>' +
        '</div>' +
        '<div style="margin:14px 0 8px;font-size:13px;color:#7C7C86;">或从指定网址拉取最新版本：</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<input class="field__input" id="update-url-input" placeholder="https://…" style="flex:1;">' +
          '<button class="btn btn--mint" id="update-url">从网址更新</button>' +
        '</div>' +
      '</div>';

    const dataBody =
      '<div class="card" style="margin-top:8px;">' +
        '<button class="btn btn--block" id="export-btn" style="background:#EFFAF3;color:#1E5C3C;">' + K.icon('check', 18) + '备份（导出全部数据）</button>' +
        '<button class="btn btn--block" id="import-btn" style="background:#FFF1F4;color:#C2495F;margin-top:10px;">' + K.icon('plus', 18) + '导入（选择性恢复备份）</button>' +
        '<button class="btn btn--block" id="clear-btn" style="background:#FFF1F4;color:#C2495F;margin-top:10px;">' + K.icon('trash', 18) + '清除数据（可选清除）</button>' +
        '<input type="file" id="import-file" accept="application/json,.json" style="display:none">' +
      '</div>';

    root.innerHTML =
      '<div class="view" style="padding-bottom:140px;">' +
        '<div class="page-head"><div class="page-title">设置</div></div>' +
        '<div style="text-align:center;padding:24px 0 12px;">' +
          '<div style="width:76px;height:76px;border-radius:22px;background:#FFB7C5;margin:0 auto;display:flex;align-items:center;justify-content:center;">' + K.icon('pot', 40) + '</div>' +
          '<div style="font-size:20px;font-weight:800;margin-top:12px;">厨房小助手</div>' +
          '<div style="font-size:13px;color:#B4B4BE;margin-top:5px;">记录菜谱 · 配置酱汁 · 按步骤烹饪</div>' +
        '</div>' +
        section('info', '版本信息', 'version', versionBody) +
        section('reset', '更新', 'update', updateBody) +
        section('note', '数据管理', 'data', dataBody) +
        section('pot', '模块工具箱管理', 'toolbox', moduleMgmtBody()) +
        section('sauce', '酱汁分类管理', 'sauce', sauceMgmtBody()) +
        '<div style="text-align:center;font-size:12px;color:#B4B4BE;padding:10px 0;">数据保存在本机浏览器，卸载或清除数据前请先备份。</div>' +
      '</div>';

    // 折叠菜单（手风琴）
    root.querySelectorAll('[data-sec-head]').forEach(head => {
      head.addEventListener('click', () => {
        const id = head.dataset.secHead;
        const wasOpen = !!openSections[id];
        root.querySelectorAll('.settings-sec__body').forEach(b => b.classList.remove('open'));
        root.querySelectorAll('.settings-sec__head').forEach(h => h.classList.remove('open'));
        openSections = {};
        if (!wasOpen) {
          openSections[id] = true;
          const body = root.querySelector('[data-sec-body="' + id + '"]');
          if (body) body.classList.add('open');
          head.classList.add('open');
        }
      });
    });

    // 更新
    document.getElementById('update-current').addEventListener('click', async () => {
      try {
        const info = await fetchVersion('');
        const cmp = cmpVersion(info.version, K.APP_VERSION);
        if (cmp > 0) {
          K.confirm('发现新版本 v' + info.version + (info.note ? '（' + info.note + '）' : '') + '，是否立即更新？', () => {
            K.toast('正在更新…');
            doUpdateFromCurrent();
          });
        } else {
          K.toast('已是最新版本 v' + K.APP_VERSION);
        }
      } catch (e) {
        K.toast('无法获取版本信息，请确认当前网址已部署');
      }
    });
    document.getElementById('refresh-btn').addEventListener('click', () => { location.reload(); });
    document.getElementById('update-url').addEventListener('click', async () => {
      const input = document.getElementById('update-url-input');
      const base = normBaseUrl(input.value);
      if (!base) { K.toast('请输入网址'); return; }
      try {
        const info = await fetchVersion(base);
        const cmp = cmpVersion(info.version, K.APP_VERSION);
        if (cmp > 0) {
          K.confirm('发现新版本 v' + info.version + '，是否跳转到新网址更新？', () => { location.replace(base + '/index.html'); });
        } else {
          K.toast('该网址版本不高于当前版本');
        }
      } catch (e) {
        K.toast('无法从该网址获取版本信息');
      }
    });

    // 数据管理
    document.getElementById('clear-btn').addEventListener('click', showClearPicker);
    document.getElementById('export-btn').addEventListener('click', () => {
      const data = K.exportData();
      const name = '厨房小助手备份_' + new Date().toISOString().slice(0, 10) + '.json';
      K.download(name, JSON.stringify(data, null, 2));
      K.toast('已导出备份文件');
    });
    document.getElementById('import-btn').addEventListener('click', () => { document.getElementById('import-file').click(); });
    document.getElementById('import-file').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      K.readFileAsText(f, text => {
        try {
          const data = JSON.parse(text);
          if (!data || !data.app || !Array.isArray(data.recipes)) throw new Error('bad');
          showImportPicker(data);
        } catch (err) {
          K.toast('无法识别的备份文件');
        }
      });
    });

    // 模块工具箱管理
    bindModuleMgmt(root);
    // 酱汁分类管理
    bindSauceMgmt(root);
  }

  function bindModuleMgmt(root) {
    root.addEventListener('click', e => {
      const row = e.target.closest('.mgmt-row');
      if (row && row.dataset.type) {
        const type = row.dataset.type, idx = +row.dataset.idx;
        const getList = type === 'tool' ? K.getToolboxTools : (type === 'action' ? K.getToolboxActions : K.getToolboxTimes);
        const saveList = type === 'tool' ? K.saveToolboxTools : (type === 'action' ? K.saveToolboxActions : K.saveToolboxTimes);
        const list = getList();
        if (e.target.closest('[data-mgmt-up]')) move(list, idx, -1);
        else if (e.target.closest('[data-mgmt-down]')) move(list, idx, 1);
        else if (e.target.closest('[data-mgmt-del]')) list.splice(idx, 1);
        else return;
        saveList(list);
        refresh();
        return;
      }
      const add = e.target.closest('[data-mgmt-add]');
      if (add) {
        const type = add.dataset.mgmtAdd;
        if (type === 'time') {
          K.prompt('添加时间模块（输入分钟数）', '5', v => { const min = parseFloat(v); if (!isNaN(min) && min > 0) { K.addCustomTime(Math.round(min * 60)); refresh(); } });
        } else {
          K.prompt('添加' + (type === 'tool' ? '厨具' : '动作') + '名称', '', v => { if (v && v.trim()) { (type === 'tool' ? K.addCustomTool : K.addCustomAction)(v.trim()); refresh(); } });
        }
      }
    });
  }

  function bindSauceMgmt(root) {
    root.addEventListener('click', e => {
      const catEl = e.target.closest('.mgmt-cat');
      if (catEl) {
        const ci = +catEl.dataset.catIdx;
        const cats = K.getSauceCategories();
        if (e.target.closest('[data-cat-up]')) { move(cats, ci, -1); K.saveSauceCategories(cats); refresh(); return; }
        if (e.target.closest('[data-cat-down]')) { move(cats, ci, 1); K.saveSauceCategories(cats); refresh(); return; }
        if (e.target.closest('[data-cat-del]')) { cats.splice(ci, 1); K.saveSauceCategories(cats); refresh(); return; }
        const itemRow = e.target.closest('[data-item-idx]');
        if (itemRow) {
          const ii = +itemRow.dataset.itemIdx;
          const cat = cats[ci];
          if (!cat || !cat.items) return;
          if (e.target.closest('[data-item-up]')) { move(cat.items, ii, -1); K.saveSauceCategories(cats); refresh(); return; }
          if (e.target.closest('[data-item-down]')) { move(cat.items, ii, 1); K.saveSauceCategories(cats); refresh(); return; }
          if (e.target.closest('[data-item-del]')) { cat.items.splice(ii, 1); K.saveSauceCategories(cats); refresh(); return; }
        }
        const itemAdd = e.target.closest('[data-item-add]');
        if (itemAdd) {
          const key = cats[ci] ? cats[ci].key : '';
          K.prompt('在「' + key + '」中添加配料', '', v => {
            if (v && v.trim()) { const c = cats[ci]; if (c && c.items.indexOf(v.trim()) < 0) { c.items.push(v.trim()); K.saveSauceCategories(cats); refresh(); } }
          });
          return;
        }
        return;
      }
      const catAdd = e.target.closest('[data-cat-add]');
      if (catAdd) {
        K.prompt('添加一级分类名称', '', v => {
          if (v && v.trim()) {
            const cats = K.getSauceCategories();
            const name = v.trim();
            if (!cats.find(c => c.key === name)) { cats.push({ key: name, open: false, items: [] }); K.saveSauceCategories(cats); refresh(); }
          }
        });
      }
    });
    root.addEventListener('change', e => {
      const cb = e.target.closest('[data-cat-open]');
      if (cb) {
        const catEl = cb.closest('.mgmt-cat');
        const ci = +catEl.dataset.catIdx;
        const cats = K.getSauceCategories();
        if (cats[ci]) { cats[ci].open = cb.checked; K.saveSauceCategories(cats); refresh(); }
      }
    });
  }

  function showImportPicker(data) {
    const recipeRows = (data.recipes || []).map(r =>
      '<label class="import-row"><input type="checkbox" class="import-rec" data-id="' + K.esc(r.id) + '" checked>' +
      '<span>' + K.esc(r.name || '未命名菜谱') + '</span></label>'
    ).join('');

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:300;display:flex;align-items:center;justify-content:center;';
    wrap.innerHTML =
      '<div style="background:#fff;border-radius:22px;padding:20px;width:min(360px,88vw);max-height:78vh;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(0,0,0,.2);">' +
        '<div style="font-size:17px;font-weight:800;margin-bottom:4px;">选择要导入的内容</div>' +
        '<div style="font-size:12px;color:#B4B4BE;margin-bottom:12px;">备份包含 ' + (data.recipes || []).length + ' 个菜谱</div>' +
        '<div style="flex:1;overflow-y:auto;margin-bottom:8px;">' + (recipeRows || '<div style="color:#B4B4BE;font-size:13px;padding:8px 0;">无菜谱</div>') + '</div>' +
        '<label class="import-row"><input type="checkbox" id="import-prefs" checked><span>导入个性偏好（自定义配料 / 单位 / 模块）</span></label>' +
        '<label class="import-row"><input type="checkbox" id="import-methods" checked><span>导入烹饪方式记录</span></label>' +
        '<div style="display:flex;gap:10px;margin-top:14px;">' +
          '<button class="btn btn--soft" style="flex:1;" data-a="no">取消</button>' +
          '<button class="btn btn--primary" style="flex:1;" data-a="yes">导入</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    const close = ans => {
      if (ans !== 'yes') { wrap.remove(); return; }
      const ids = Array.from(wrap.querySelectorAll('.import-rec:checked')).map(x => x.dataset.id);
      const count = K.importData(data, {
        recipes: true,
        selectedIds: ids,
        prefs: wrap.querySelector('#import-prefs').checked,
        methods: wrap.querySelector('#import-methods').checked
      });
      wrap.remove();
      K.toast('已导入 ' + count + ' 个菜谱');
    };
    wrap.addEventListener('click', e => {
      const a = e.target.closest('[data-a]');
      if (a) close(a.dataset.a);
      else if (e.target === wrap) close('no');
    });
  }

  function showClearPicker() {
    const items = [
      { id: 'recipes', label: '菜谱' },
      { id: 'history', label: '烹饪历史' },
      { id: 'prefs', label: '个性偏好（自定义配料 / 单位 / 模块）' },
      { id: 'methods', label: '烹饪方式记录' }
    ];
    const rows = items.map(it =>
      '<label class="import-row"><input type="checkbox" class="clear-item" data-k="' + it.id + '" checked><span>' + it.label + '</span></label>'
    ).join('');

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:300;display:flex;align-items:center;justify-content:center;';
    wrap.innerHTML =
      '<div style="background:#fff;border-radius:22px;padding:20px;width:min(340px,88vw);box-shadow:0 10px 30px rgba(0,0,0,.2);">' +
        '<div style="font-size:17px;font-weight:800;margin-bottom:4px;">选择要清除的数据</div>' +
        '<div style="font-size:12px;color:#B4B4BE;margin-bottom:12px;">清除后无法恢复，建议先备份。</div>' +
        rows +
        '<div style="display:flex;gap:10px;margin-top:14px;">' +
          '<button class="btn btn--soft" style="flex:1;" data-a="no">取消</button>' +
          '<button class="btn btn--primary" style="flex:1;" data-a="yes">清除</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    wrap.addEventListener('click', e => {
      const a = e.target.closest('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'yes') {
        const checked = Array.from(wrap.querySelectorAll('.clear-item:checked')).map(x => x.dataset.k);
        if (checked.indexOf('recipes') >= 0) K.clearRecipes();
        if (checked.indexOf('history') >= 0) K.clearHistory();
        if (checked.indexOf('prefs') >= 0) K.clearPrefs();
        if (checked.indexOf('methods') >= 0) K.clearMethods();
        K.toast('已清除所选数据');
      }
      wrap.remove();
    });
  }
})();
