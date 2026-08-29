/* 添加 / 编辑菜谱 四步向导 */
(function () {
  let draft = null;
  let step = 1;
  let editingId = null;
  let sauceIndex = 0;
  let root = null;
  let toolboxTab = '厨具';

  const TOTAL_STEPS = 4;
  const TAG = { tool: '厨具', action: '动作', time: '时间' };

  function hasContent() {
    return !!(draft.name || draft.cookingMethod || draft.photo ||
      (draft.meats || []).length || (draft.vegetables || []).length ||
      Object.keys(draft.seasonings || {}).some(k => draft.seasonings[k] && draft.seasonings[k].sel) ||
      (draft.sauces || []).some(s => (s.selected || []).length) ||
      (draft.slots || []).some(s => s.length));
  }

  K.renderWizard = function (container, params) {
    root = container;
    editingId = params.id || null;
    const src = editingId ? K.getRecipe(editingId) : null;
    draft = src ? K.clone(src) : K.newRecipe();
    if (!draft.sauces || !draft.sauces.length) draft.sauces = [K.newSauce('腌制')];
    if (!draft.slots) draft.slots = draft.modules ? [draft.modules] : [];
    sauceIndex = 0;
    step = 1;
    toolboxTab = '厨具';
    K.cleanupCurrent = function () {};
    render();
  };

  function render() {
    const sy = window.scrollY;
    root.innerHTML =
      '<div class="view" style="padding-bottom:150px;">' +
        headerHTML() +
        '<div class="stepper-dots">' + dotsHTML() + '</div>' +
        stepHTML() +
      '</div>' +
      footerHTML();
    bindHeader();
    bindStep();
    window.scrollTo(0, sy);
  }

  function dotsHTML() {
    let s = '';
    for (let i = 1; i <= TOTAL_STEPS; i++) s += '<span' + (i === step ? ' class="on"' : '') + '></span>';
    return s;
  }

  function headerHTML() {
    return '<div class="wizard-head">' +
      '<button class="btn btn--icon wz-back">' + K.icon('back', 20) + '</button>' +
      '<div class="wz-title">' + (editingId ? '编辑菜谱' : '添加菜谱') + '</div>' +
      '<button class="btn btn--primary wz-save">保存</button>' +
    '</div>';
  }

  function footerHTML() {
    if (step === 3) {
      return '<div class="page-footer page-footer--split">' +
        '<button class="btn" id="w-add-sauce">' + K.icon('plus', 17) + '配制另一份酱汁</button>' +
        '<button class="btn btn--primary" id="w-next">下一步</button>' +
      '</div>';
    }
    if (step === 4) {
      return '<div class="page-footer"><button class="btn btn--primary btn--block" id="w-next">' + (editingId ? '保存修改' : '保存菜谱') + '</button></div>';
    }
    return '<div class="page-footer"><button class="btn btn--primary btn--block" id="w-next">下一步</button></div>';
  }

  function stepHTML() {
    if (step === 1) return step1HTML();
    if (step === 2) return step2HTML();
    if (step === 3) return step3HTML();
    return step4HTML();
  }
  function bindStep() {
    if (step === 1) bindStep1();
    else if (step === 2) bindStep2();
    else if (step === 3) bindStep3();
    else bindStep4();
  }

  /* ============ 步骤 1：命名 / 烹饪方式 / 照片 ============ */
  function step1HTML() {
    const photo = draft.photo
      ? '<img src="' + draft.photo + '" alt=""><button class="photo-remove" id="photo-remove">' + K.icon('close', 15) + '</button>'
      : K.icon('camera', 30) + '<div style="font-size:13px;">点击上传照片</div>';
    return '<div class="section-title">' + K.icon('note', 18) + '基本信息</div>' +
      '<div class="card">' +
        '<div class="field"><label class="field__label">菜谱名称</label>' +
          '<input class="field__input" id="w-name" placeholder="给这道菜起个名字" value="' + K.esc(draft.name) + '"></div>' +
        '<div class="field"><label class="field__label">烹饪方式</label>' +
          '<div class="autocomplete"><input class="field__input" id="w-method" placeholder="如：炒、蒸、红烧…" value="' + K.esc(draft.cookingMethod) + '"></div></div>' +
      '</div>' +
      '<div class="photo-box" id="w-photo">' + photo + '</div>' +
      '<input type="file" id="w-file" accept="image/*" style="display:none">';
  }

  function bindStep1() {
    const name = document.getElementById('w-name');
    const method = document.getElementById('w-method');
    name.addEventListener('input', () => { draft.name = name.value; });
    method.addEventListener('input', () => { draft.cookingMethod = method.value; });

    const photo = document.getElementById('w-photo');
    const file = document.getElementById('w-file');
    photo.addEventListener('click', e => {
      if (e.target.closest('#photo-remove')) return;
      file.click();
    });
    const rm = document.getElementById('photo-remove');
    if (rm) rm.addEventListener('click', () => { draft.photo = null; render(); });
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      K.fileToDataURL(f, dataUrl => { draft.photo = dataUrl; render(); });
    });

    setupAutocomplete(method);
  }

  function setupAutocomplete(input) {
    const parent = input.parentElement;
    let listEl = null;
    function hide() { if (listEl) listEl.remove(); listEl = null; }
    function show(items) {
      hide();
      listEl = document.createElement('div');
      listEl.className = 'autocomplete__list';
      if (!items.length) listEl.innerHTML = '<div class="autocomplete__empty">暂无联想结果</div>';
      else listEl.innerHTML = items.map(x => '<div class="autocomplete__item" data-v="' + K.esc(x) + '">' + K.esc(x) + '</div>').join('');
      parent.appendChild(listEl);
    }
    input.addEventListener('focus', () => { if (!input.value.trim()) show(K.getMethodHistory()); });
    input.addEventListener('input', () => {
      const v = input.value.trim();
      if (!v) { show(K.getMethodHistory()); return; }
      show(K.getMethods().filter(m => m.indexOf(v) >= 0));
    });
    input.addEventListener('blur', () => setTimeout(hide, 160));
    parent.addEventListener('click', e => {
      const it = e.target.closest('.autocomplete__item');
      if (it) { input.value = it.dataset.v; draft.cookingMethod = it.dataset.v; hide(); }
    });
  }

  /* ============ 步骤 2：食材 ============ */
  function step2HTML() {
    const meats = (draft.meats || []).map((m, i) => ingItemHTML('meat', i, m)).join('');
    const vegs = (draft.vegetables || []).map((v, i) => ingItemHTML('veg', i, v)).join('');

    let seasonVars = '';
    K.SEASONINGS.forEach(s => {
      const st = draft.seasonings[s.key];
      if (st && st.sel && s.variants.length) {
        const chips = s.variants.map(v => '<button class="chip' + (st.variant === v ? ' active' : '') + '" data-key="' + K.esc(s.key) + '" data-variant="' + K.esc(v) + '">' + K.esc(v) + '</button>').join('');
        seasonVars += '<div style="margin-top:14px;"><div style="font-size:13px;font-weight:700;color:#7C7C86;margin-bottom:8px;">' + K.esc(s.key) + '</div><div class="season-variants">' + chips + '</div></div>';
      }
    });

    const seasonGrid = K.SEASONINGS.map(s => {
      const st = draft.seasonings[s.key];
      return '<button class="season-item' + (st && st.sel ? ' active' : '') + '" data-season="' + K.esc(s.key) + '">' + K.esc(s.key) + '</button>';
    }).join('');

    return '<div class="section-title">' + K.icon('meat', 18) + '食材</div>' +
      '<div class="ing-block ing-block--meat">' +
        '<div class="ing-block__head">' + K.icon('meat', 18) + '肉类</div>' + meats +
        '<button class="add-line" id="w-add-meat">' + K.icon('plus', 17) + '添加肉类</button>' +
      '</div>' +
      '<div class="ing-block ing-block--veg">' +
        '<div class="ing-block__head">' + K.icon('veg', 18) + '素菜</div>' + vegs +
        '<button class="add-line" id="w-add-veg">' + K.icon('plus', 17) + '添加素菜</button>' +
      '</div>' +
      '<div class="ing-block ing-block--season">' +
        '<div class="ing-block__head">' + K.icon('seasoning', 18) + '调味料</div>' +
        '<div class="season-grid">' + seasonGrid + '</div>' +
        '<div id="season-variants">' + seasonVars + '</div>' +
      '</div>';
  }

  function ingItemHTML(kind, i, it) {
    const isMeat = kind === 'meat';
    const label = isMeat ? '肉类' : '素菜';
    return '<div class="ing-item">' +
      '<div class="ing-item__head"><span class="ing-item__title">' + label + ' ' + (i + 1) + '</span>' +
      '<button class="ing-item__del" data-del="' + kind + '" data-i="' + i + '">' + K.icon('close', 14) + '</button></div>' +
      '<div class="qty-row">' +
        '<div class="field qty-name"><input class="field__input" placeholder="名称" data-kind="' + kind + '" data-i="' + i + '" data-f="name" value="' + K.esc(it.name) + '"></div>' +
        '<div class="field qty-num"><input class="field__input" placeholder="数量" inputmode="decimal" data-kind="' + kind + '" data-i="' + i + '" data-f="qty" value="' + K.esc(it.qty) + '"></div>' +
        '<div class="field qty-unit"><div class="autocomplete"><input class="field__input" placeholder="单位" data-kind="' + kind + '" data-i="' + i + '" data-f="unit" value="' + K.esc(it.unit) + '"></div></div>' +
      '</div>' +
      '<div class="field" style="margin-bottom:0;"><div class="autocomplete"><input class="field__input" placeholder="处理方式（如：切块 / 切片）" data-kind="' + kind + '" data-i="' + i + '" data-f="process" value="' + K.esc(it.process) + '"></div></div>' +
      (isMeat ? '<label style="display:flex;align-items:center;gap:8px;font-size:14px;color:#7C7C86;margin-top:10px;"><input type="checkbox" data-kind="meat" data-i="' + i + '" data-f="thaw"' + (it.thaw ? ' checked' : '') + '> 需要解冻</label>' : '') +
    '</div>';
  }

  function bindStep2() {
    const content = root.querySelector('.view');
    content.addEventListener('input', e => {
      const t = e.target;
      const f = t.dataset.f;
      if (!f) return;
      const kind = t.dataset.kind, i = +t.dataset.i;
      const item = kind === 'meat' ? draft.meats[i] : draft.vegetables[i];
      if (!item) return;
      item[f] = (t.type === 'checkbox') ? t.checked : t.value;
    });

    // 单位 / 处理方式：历史文本联想
    content.querySelectorAll('input[data-f="unit"], input[data-f="process"]').forEach(inp => {
      const kind = inp.dataset.kind, i = +inp.dataset.i, f = inp.dataset.f;
      K.setupSuggest(inp, f === 'unit' ? K.getUnitHistory : K.getProcessHistory, v => {
        const item = kind === 'meat' ? draft.meats[i] : draft.vegetables[i];
        if (item) item[f] = v;
      });
    });

    content.addEventListener('click', e => {
      const del = e.target.closest('[data-del]');
      if (del) { const kind = del.dataset.del, i = +del.dataset.i; if (kind === 'meat') draft.meats.splice(i, 1); else draft.vegetables.splice(i, 1); render(); return; }
      if (e.target.closest('#w-add-meat')) { draft.meats.push(K.emptyMeat()); render(); return; }
      if (e.target.closest('#w-add-veg')) { draft.vegetables.push(K.emptyVeg()); render(); return; }

      const season = e.target.closest('[data-season]');
      if (season) {
        const key = season.dataset.season;
        const st = draft.seasonings[key];
        st.sel = !st.sel;
        if (st.sel && !st.variant) { const def = K.seasoningByKey(key); if (def.variants.length) st.variant = def.variants[0]; }
        render(); return;
      }
      const vc = e.target.closest('[data-variant]');
      if (vc) { draft.seasonings[vc.dataset.key].variant = vc.dataset.variant; render(); return; }
    });
  }

  /* ============ 步骤 3：酱汁 ============ */
  function amtGet(sauce, name) {
    const a = sauce.amounts[name];
    if (a && typeof a === 'object') return { qty: a.qty || '', unit: a.unit || '勺' };
    return { qty: (typeof a === 'string' ? a : ''), unit: '勺' };
  }
  function amtSet(sauce, name, qty, unit) {
    const a = sauce.amounts[name];
    const prev = amtGet(sauce, name);
    sauce.amounts[name] = { qty: qty != null ? qty : prev.qty, unit: unit != null ? unit : prev.unit };
  }

  function step3HTML() {
    const sauce = draft.sauces[sauceIndex];
    const total = draft.sauces.length;

    const seg = ['腌制', '调味'].map(p =>
      '<button class="seg__btn' + (sauce.purpose === p ? ' active' : '') + '" data-purpose="' + p + '">' + p + '</button>'
    ).join('');

    const cats = K.SAUCE_CATEGORIES.map(c => {
      const open = c.open ? ' sauce-cat--open' : '';
      const items = K.getCategoryItems(c.key);
      const chips = items.map(it => {
        const on = (sauce.selected || []).indexOf(it) >= 0;
        return '<button class="chip' + (on ? ' active' : '') + '" data-sauce-item="' + K.esc(it) + '">' + K.esc(it) + '</button>';
      }).join('');
      return '<div class="sauce-cat' + open + '" data-cat="' + K.esc(c.key) + '">' +
        '<button class="sauce-cat__head">' + K.esc(c.key) + K.icon('chevDown', 18) + '</button>' +
        '<div class="sauce-cat__body">' + chips +
          '<button class="chip chip--custom" data-customcat="' + K.esc(c.key) + '">' + K.icon('plus', 13) + ' 自定义配料</button>' +
        '</div>' +
      '</div>';
    }).join('');

    const seasonSel = K.selectedSeasonings(draft);
    const rows = [];
    (sauce.selected || []).forEach(n => {
      const amt = amtGet(sauce, n);
      const units = K.getAllUnits();
      const opts = units.map(u => '<button class="unit-opt' + (amt.unit === u ? ' active' : '') + '" data-uname="' + K.esc(n) + '" data-unit-opt="' + K.esc(u) + '">' + K.esc(u) + '</button>').join('') +
        '<button class="unit-opt unit-opt--custom" data-uname="' + K.esc(n) + '" data-unit-opt="__custom__">' + K.icon('plus', 13) + ' 自定义</button>';
      rows.push('<div class="amount-row">' +
        '<span class="amount-row__name">' + K.esc(n) + '</span>' +
        '<input type="text" inputmode="decimal" placeholder="用量" data-amount="' + K.esc(n) + '" value="' + K.esc(amt.qty) + '">' +
        '<div class="unit-picker">' +
          '<button class="unit-tab" data-unit-tab="' + K.esc(n) + '">' + K.esc(amt.unit || '勺') + K.icon('chevDown', 13) + '</button>' +
          '<div class="unit-panel" data-unit-panel="' + K.esc(n) + '">' + opts + '</div>' +
        '</div>' +
      '</div>');
    });
    seasonSel.forEach(s => {
      const qty = (typeof sauce.amounts[s.key] === 'string' ? sauce.amounts[s.key] : '') || '';
      if (s.key === '蒜') {
        const cur = draft.seasonings['蒜'].unit || '瓣';
        rows.push('<div class="amount-row">' +
          '<span class="amount-row__name">蒜</span>' +
          '<input type="text" inputmode="decimal" placeholder="用量" data-season="蒜" value="' + K.esc(qty) + '">' +
          '<span class="unit-toggle">' + ['瓣', '头'].map(u => '<button class="chip mini' + (cur === u ? ' active' : '') + '" data-garlic-unit="' + u + '">' + u + '</button>').join('') + '</span>' +
        '</div>');
      } else {
        rows.push('<div class="amount-row">' +
          '<span class="amount-row__name">' + K.esc(s.key) + '</span>' +
          '<input type="text" inputmode="decimal" placeholder="用量" data-season="' + K.esc(s.key) + '" value="' + K.esc(qty) + '">' +
          '<span class="amount-row__unit">' + K.esc(s.unit) + '</span>' +
        '</div>');
      }
    });

    return '<div class="section-title">' + K.icon('sauce', 18) + '酱汁配制</div>' +
      '<div class="sauce-pager">' +
        '<button class="pg-btn" id="sauce-prev"' + (sauceIndex === 0 ? ' disabled' : '') + '>' + K.icon('chevLeft', 16) + '</button>' +
        '<span class="pg-label">酱汁 ' + (sauceIndex + 1) + ' / ' + total + '</span>' +
        '<button class="pg-btn" id="sauce-next"' + (sauceIndex >= total - 1 ? ' disabled' : '') + '>' + K.icon('chevRight', 16) + '</button>' +
      '</div>' +
      '<div class="seg">' + seg + '</div>' +
      '<div style="margin-top:12px;">' + cats + '</div>' +
      (rows.length
        ? '<div class="section-title">' + K.icon('seasoning', 18) + '填写用量</div><div class="amount-list">' + rows.join('') + '</div>'
        : '<div class="empty" style="padding:26px 0;">选择上方酱料或食材页调味料后，可在此填写用量</div>');
  }

  function bindStep3() {
    const content = root.querySelector('.view');

    content.addEventListener('click', e => {
      const p = e.target.closest('[data-purpose]');
      if (p) { draft.sauces[sauceIndex].purpose = p.dataset.purpose; render(); return; }
      const catHead = e.target.closest('.sauce-cat__head');
      if (catHead) { catHead.parentElement.classList.toggle('sauce-cat--open'); return; }
      const cc = e.target.closest('[data-customcat]');
      if (cc) {
        const catKey = cc.dataset.customcat;
        K.prompt('在「' + catKey + '」中添加自定义配料', '', name => {
          if (name && name.trim()) { K.addCustomSauceItem(catKey, name.trim()); draft.sauces[sauceIndex].selected.push(name.trim()); render(); }
        });
        return;
      }
      const gu = e.target.closest('[data-garlic-unit]');
      if (gu) { draft.seasonings['蒜'].unit = gu.dataset.garlicUnit; render(); return; }

      const unitTab = e.target.closest('[data-unit-tab]');
      if (unitTab) {
        const name = unitTab.dataset.unitTab;
        const panel = content.querySelector('[data-unit-panel="' + name + '"]');
        content.querySelectorAll('.unit-panel').forEach(p => { if (p !== panel) p.classList.remove('open'); });
        if (panel) panel.classList.toggle('open');
        return;
      }
      const unitOpt = e.target.closest('[data-unit-opt]');
      if (unitOpt) {
        const name = unitOpt.dataset.uname, val = unitOpt.dataset.unitOpt;
        if (val === '__custom__') {
          K.prompt('自定义单位', '', u => { if (u && u.trim()) { K.addCustomUnit(u.trim()); amtSet(draft.sauces[sauceIndex], name, null, u.trim()); render(); } });
        } else {
          amtSet(draft.sauces[sauceIndex], name, null, val);
          render();
        }
        return;
      }
      const si = e.target.closest('[data-sauce-item]');
      if (si) {
        const n = si.dataset.sauceItem;
        const sel = draft.sauces[sauceIndex].selected;
        const idx = sel.indexOf(n);
        if (idx >= 0) sel.splice(idx, 1); else sel.push(n);
        render(); return;
      }
      if (e.target.closest('#sauce-prev') && sauceIndex > 0) { sauceIndex--; render(); window.scrollTo(0, 0); return; }
      if (e.target.closest('#sauce-next') && sauceIndex < draft.sauces.length - 1) { sauceIndex++; render(); window.scrollTo(0, 0); return; }
    });

    content.addEventListener('input', e => {
      const t = e.target;
      if (t.matches && t.matches('[data-amount]')) {
        const name = t.dataset.amount;
        const s = draft.sauces[sauceIndex];
        const a = s.amounts[name];
        if (a && typeof a === 'object') a.qty = t.value; else s.amounts[name] = { qty: t.value, unit: '勺' };
      } else if (t.matches && t.matches('[data-season]')) {
        draft.sauces[sauceIndex].amounts[t.dataset.season] = t.value;
      }
    });
  }

  /* ============ 步骤 4：烹饪模块（栏位） ============ */
  function step4HTML() {
    const tabs = ['厨具', '动作', '时间'].map(t =>
      '<button class="toolbox__tab' + (toolboxTab === t ? ' active' : '') + '" data-tab="' + t + '">' + t + '</button>'
    ).join('');

    let items = '';
    if (toolboxTab === '厨具') {
      items = K.TOOLS.map(x => '<button class="toolbox__item tool" data-tool="' + K.esc(x) + '">' + K.esc(x) + '</button>').join('') +
        K.getCustomTools().map(x => '<button class="toolbox__item tool" data-tool="' + K.esc(x) + '">' + K.esc(x) + '</button>').join('') +
        '<button class="toolbox__item custom" data-custom="tool">' + K.icon('plus', 14) + ' 自定义</button>';
    } else if (toolboxTab === '动作') {
      items = K.ACTIONS.map(x => '<button class="toolbox__item action" data-action="' + K.esc(x) + '">' + K.esc(x) + '</button>').join('') +
        K.getCustomActions().map(x => '<button class="toolbox__item action" data-action="' + K.esc(x) + '">' + K.esc(x) + '</button>').join('') +
        '<button class="toolbox__item custom" data-custom="action">' + K.icon('plus', 14) + ' 自定义</button>';
    } else {
      items = '<button class="toolbox__item time" data-addtime="1">' + K.icon('timer', 16) + ' 添加计时（10分钟）</button>' +
        K.getCustomTimes().map(s => '<button class="toolbox__item time" data-addtime-sec="' + s + '">' + K.esc(K.fmtTimeName(s)) + '</button>').join('') +
        '<button class="toolbox__item custom" data-custom="time">' + K.icon('plus', 14) + ' 自定义时间</button>';
    }

    const slots = (draft.slots || []).map((slot, i) => slotHTML(i, slot)).join('');

    return '<div class="section-title">' + K.icon('pot', 18) + '烹饪步骤（模块工具箱）</div>' +
      '<div class="toolbox">' +
        '<div class="toolbox__tabs">' + tabs + '</div>' +
        '<div class="toolbox__items">' + items + '</div>' +
      '</div>' +
      '<div class="section-title">' + K.icon('grip', 18) + '烹饪栏位（一个栏位可放多个模块）</div>' +
      '<div id="slots-area">' + (slots || '<div class="empty" style="padding:20px 0;">点击上方工具箱添加第一个模块</div>') + '</div>' +
      '<button class="add-line" id="w-add-slot">' + K.icon('plus', 17) + '添加栏位</button>';
  }

  function slotHTML(i, modules) {
    const inner = modules.length
      ? modules.map(m => moduleHTML(m)).join('')
      : '<div class="empty slot-empty" style="padding:14px 0;">空栏位 — 点上方工具箱添加模块</div>';
    return '<div class="slot" data-slot="' + i + '">' +
      '<div class="slot__head">' +
        '<div class="slot__handle">' + K.icon('grip', 18) + '</div>' +
        '<span class="slot__title">栏位 ' + (i + 1) + '</span>' +
        '<button class="slot__del" data-delslot="' + i + '">' + K.icon('close', 14) + '</button>' +
      '</div>' +
      '<div class="slot-modules" data-slotlist="' + i + '">' + inner + '</div>' +
    '</div>';
  }

  function moduleHTML(m) {
    let body = '';
    if (m.type === 'action' && (m.name === '腌制' || m.name === '调味')) {
      const need = m.name === '腌制' ? '腌制' : '调味';
      const opts = draft.sauces.map((s, idx) => ({ s, idx })).filter(x => x.s.purpose === need);
      if (opts.length) {
        const sel = opts.map(x => '<option value="' + x.idx + '"' + (m.sauceId === x.idx ? ' selected' : '') + '>' + K.esc(sauceLabel(x.s, x.idx)) + '</option>').join('');
        body = '<select class="sauce-select" data-f="sauceId"><option value="">选择' + need + '酱汁</option>' + sel + '</select>' +
          '<label class="popup-switch"><input type="checkbox" data-f="showSauce"' + (m.showSauce !== false ? ' checked' : '') + '><span>显示酱汁详细信息</span></label>';
      } else {
        body = '<div style="font-size:11px;color:#B4B4BE;margin-top:5px;">请先在「酱汁」页配制' + need + '用途的酱汁</div>';
      }
    } else if (m.type === 'time') {
      const mm = Math.floor((m.seconds || 0) / 60), ss = (m.seconds || 0) % 60;
      body = '<div class="stepper stepper--inputs">' +
        '<input type="number" min="0" inputmode="numeric" class="time-input" data-timef="min" value="' + mm + '"><span class="time-lbl">分</span>' +
        '<input type="number" min="0" max="59" inputmode="numeric" class="time-input" data-timef="sec" value="' + ss + '"><span class="time-lbl">秒</span>' +
      '</div>' +
      '<label class="popup-switch"><input type="checkbox" data-f="popup"' + (m.popup !== false ? ' checked' : '') + '><span>结束后弹窗</span></label>';
    }

    const title = m.type === 'time' ? K.fmtTimeName(m.seconds || 0) : m.name;
    return '<div class="module' + (m.type === 'tool' ? ' module--tool' : '') + '" data-key="' + m._id + '">' +
      '<div class="module__top">' +
        '<div class="module__handle">' + K.icon('grip', 14) + '</div>' +
        '<button class="module__del" data-delmodule="' + K.esc(m._id) + '">' + K.icon('close', 11) + '</button>' +
      '</div>' +
      '<div class="module__body">' +
        '<span class="module__tag module__tag--' + m.type + '">' + (TAG[m.type] || '模块') + '</span>' +
        '<div class="module__title">' + K.esc(title || '') + '</div>' +
        body +
        '<textarea class="field__input module-note" rows="1" placeholder="备注…" data-f="note">' + K.esc(m.note || '') + '</textarea>' +
      '</div>' +
    '</div>';
  }

  function sauceLabel(s, idx) {
    const parts = (s.selected || []);
    return '酱汁' + (idx + 1) + '（' + (parts.length ? parts.join('、') : '未配置食材') + '）';
  }

  function findModule(id) {
    for (const slot of (draft.slots || [])) for (const m of slot) if (m._id === id) return m;
    return null;
  }
  function removeModule(id) {
    draft.slots = (draft.slots || []).map(slot => slot.filter(m => m._id !== id));
  }
  function addModule(m) {
    if (!draft.slots.length) draft.slots.push([]);
    draft.slots[draft.slots.length - 1].push(m);
  }

  function autosize(t) {
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 'px';
  }

  function handleCustom(kind) {
    if (kind === 'time') {
      K.prompt('自定义时间模块（输入默认分钟数）', '5', v => {
        const min = parseFloat(v);
        if (!isNaN(min) && min > 0) { K.addCustomTime(Math.round(min * 60)); render(); }
        else if (v && v.trim()) K.toast('请输入有效的分钟数');
      });
    } else {
      const label = kind === 'tool' ? '厨具' : '动作';
      K.prompt('自定义' + label + '模块（输入名称）', '', v => {
        if (v && v.trim()) {
          if (kind === 'tool') K.addCustomTool(v.trim()); else K.addCustomAction(v.trim());
          render();
        }
      });
    }
  }

  function bindStep4() {
    const content = root.querySelector('.view');

    content.addEventListener('click', e => {
      const tab = e.target.closest('[data-tab]');
      if (tab) { toolboxTab = tab.dataset.tab; render(); return; }
      const tool = e.target.closest('[data-tool]');
      if (tool) { addModule(K.newModule('tool', { name: tool.dataset.tool })); render(); return; }
      const act = e.target.closest('[data-action]');
      if (act) { addModule(K.newModule('action', { name: act.dataset.action })); render(); return; }
      if (e.target.closest('[data-addtime]')) { addModule(K.newModule('time', { seconds: 600 })); render(); return; }
      const ats = e.target.closest('[data-addtime-sec]');
      if (ats) { addModule(K.newModule('time', { seconds: +ats.dataset.addtimeSec })); render(); return; }
      const cust = e.target.closest('[data-custom]');
      if (cust) { handleCustom(cust.dataset.custom); return; }
      if (e.target.closest('#w-add-slot')) { draft.slots.push([]); render(); return; }
      const delSlot = e.target.closest('[data-delslot]');
      if (delSlot) { draft.slots.splice(+delSlot.dataset.delslot, 1); render(); return; }
      const delMod = e.target.closest('[data-delmodule]');
      if (delMod) { removeModule(delMod.dataset.delmodule); render(); return; }
    });

    content.addEventListener('input', e => {
      const t = e.target;
      if (t.matches && t.matches('[data-timef]')) {
        const mod = t.closest('.module');
        const m = mod ? findModule(mod.dataset.key) : null;
        if (!m) return;
        if (t.dataset.timef === 'min') m.seconds = (Math.max(0, parseInt(t.value, 10) || 0)) * 60 + ((m.seconds || 0) % 60);
        else m.seconds = Math.floor((m.seconds || 0) / 60) * 60 + Math.min(59, Math.max(0, parseInt(t.value, 10) || 0));
        const titleEl = mod.querySelector('.module__title');
        if (titleEl) titleEl.textContent = K.fmtTimeName(m.seconds || 0);
        return;
      }
      if (t.matches && t.matches('.module-note')) autosize(t);
      const f = t.dataset.f;
      if (!f) return;
      const mod = t.closest('.module');
      const m = mod ? findModule(mod.dataset.key) : null;
      if (!m) return;
      if (f === 'sauceId') m.sauceId = (t.value === '') ? null : +t.value;
      else m[f] = (t.type === 'checkbox') ? t.checked : t.value;
    });

    content.querySelectorAll('.module-note').forEach(autosize);

    const area = document.getElementById('slots-area');
    if (area && (draft.slots || []).some(s => s.length)) {
      K.makeDraggable({
        root: area, itemSelector: '.module', handleSelector: '.module__handle',
        containerSelector: '.slot-modules', axis: 'x',
        onDrop: function () { rebuildSlots(); render(); }
      });
    }
    if (area && (draft.slots || []).length > 1) {
      K.makeDraggable({
        root: area, itemSelector: '.slot', handleSelector: '.slot__handle',
        containerSelector: '#slots-area', onDrop: function () { rebuildSlots(); render(); }
      });
    }
  }

  function rebuildSlots() {
    const area = document.getElementById('slots-area');
    if (!area) return;
    const slotEls = Array.from(area.querySelectorAll(':scope > .slot'));
    draft.slots = slotEls.map(sEl => {
      return Array.from(sEl.querySelectorAll(':scope > .slot-modules > .module')).map(el => findModule(el.dataset.key)).filter(Boolean);
    });
  }

  /* ============ 页头 / 下一步 ============ */
  function doSave() {
    if (!(draft.name || '').trim()) { K.toast('请先为菜谱命名'); return; }
    if ((draft.cookingMethod || '').trim()) K.rememberMethod(draft.cookingMethod.trim());
    (draft.sauces || []).forEach(s => (s.selected || []).forEach(n => K.bumpIngredientUse(n)));
    (draft.meats || []).forEach(m => { K.rememberUnit(m.unit); K.rememberProcess(m.process); });
    (draft.vegetables || []).forEach(v => { K.rememberUnit(v.unit); K.rememberProcess(v.process); });
    K.saveRecipe(draft);
    K.toast(editingId ? '已保存修改' : '菜谱已保存');
    K.navigate('recipes');
  }

  function bindHeader() {
    root.querySelector('.wz-back').addEventListener('click', () => {
      if (step > 1) { step--; render(); window.scrollTo(0, 0); }
      else {
        if (hasContent()) K.confirm('退出后本次内容将不会保存，确定退出？', () => K.navigate('recipes'));
        else K.navigate('recipes');
      }
    });
    const saveBtn = root.querySelector('.wz-save');
    if (saveBtn) saveBtn.addEventListener('click', doSave);

    const next = document.getElementById('w-next');
    if (next) next.addEventListener('click', onNext);
    const addSauce = document.getElementById('w-add-sauce');
    if (addSauce) addSauce.addEventListener('click', () => {
      draft.sauces.push(K.newSauce(draft.sauces[sauceIndex].purpose));
      sauceIndex = draft.sauces.length - 1;
      render(); window.scrollTo(0, 0);
    });
  }

  function onNext() {
    if (step === 1) {
      const name = (draft.name || '').trim();
      if (!name) { K.toast('请先为菜谱命名'); return; }
      if ((draft.cookingMethod || '').trim()) K.rememberMethod(draft.cookingMethod.trim());
      step = 2;
    } else if (step === 2) {
      step = 3;
    } else if (step === 3) {
      step = 4;
    } else if (step === 4) {
      doSave();
      return;
    }
    render();
    window.scrollTo(0, 0);
  }
})();
