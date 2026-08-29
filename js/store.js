/* 数据层：常量定义 + localStorage 持久化 + 偏好 + 导入导出 */
(function () {
  const LS_RECIPES = 'kitchen.recipes.v1';
  const LS_HISTORY = 'kitchen.history.v1';
  const LS_METHODS = 'kitchen.methods.v1';
  const LS_PREFS = 'kitchen.prefs.v1';

  const APP_VERSION = '1.12.1';

  /* ------- 常量 ------- */
  const SEASONINGS = [
    { key: '葱', variants: ['葱结', '葱花', '葱段'], unit: '条' },
    { key: '姜', variants: ['姜片', '姜条', '姜末'], unit: '片' },
    { key: '蒜', variants: ['蒜末', '蒜瓣'], unit: '瓣', unitOptions: ['瓣', '头'] },
    { key: '小米辣', variants: [], unit: '颗' },
    { key: '香菜', variants: [], unit: '把' },
    { key: '大葱', variants: [], unit: '段' }
  ];

  const SAUCE_CATEGORIES = [
    { key: '常用', open: true, items: ['盐', '生抽', '蚝油', '食用油', '淀粉', '清水', '料酒'] },
    { key: '咸鲜', open: false, items: ['食盐', '生抽', '老抽', '蚝油', '味精', '鸡精'] },
    { key: '甜味', open: false, items: ['白糖', '冰糖', '红糖', '蜂蜜'] },
    { key: '香料', open: false, items: ['白胡椒粉', '黑胡椒粉', '八角', '桂皮', '香叶', '花椒', '麻椒', '干辣椒', '五香粉', '十三香', '孜然粉', '辣椒粉'] },
    { key: '复合酱料', open: false, items: ['豆瓣酱', '黄豆酱', '甜面酱', '番茄酱', '芝麻酱', '花生酱', '芝麻香油', '辣椒油', '花椒油', '熟白芝麻'] }
  ];

  /* 酱料可选单位（'无' 表示无单位） */
  const DEFAULT_UNITS = ['勺', '少许', '无'];

  const TOOLS = ['炒锅', '汤锅', '平底煎锅', '电饭煲', '压力锅', '空气炸锅'];
  const ACTIONS = ['炒', '蒸', '煎', '腌制', '调味', '煮', '焯水'];
  const ACTION_NEEDS_SAUCE = { '腌制': '腌制', '调味': '调味' };

  const SEED_METHODS = ['炒', '蒸', '煎', '煮', '炖', '烤', '炸', '凉拌', '焖', '卤', '红烧', '清蒸', '爆炒', '干煸', '煲汤', '白灼', '盐焗', '酱烧', '香煎', '砂锅'];

  const WELCOME = [
    { quote: '厨房有温度，日子才有滋味。', sub: '好好吃饭，认真生活。' },
    { quote: '一餐一饭，皆是生活的小确幸。', sub: '今天也要为自己好好做一顿。' },
    { quote: '热爱可抵岁月漫长，美食可抚凡人心。', sub: '下厨吧，从一道菜开始。' },
    { quote: '人间烟火气，最抚凡人心。', sub: '愿你三餐四季，温暖有趣。' },
    { quote: '把日子过成喜欢的样子，从厨房开始。', sub: '慢慢来，比较快。' },
    { quote: '食物有记忆，味道有故事。', sub: '为在乎的人，做一桌好菜。' },
    { quote: '最好的调味料，是一颗用心的心。', sub: '今天也别忘了吃饭。' },
    { quote: '烟火向星辰，所愿皆成真。', sub: '先填饱肚子，再谈理想。' }
  ];

  /* ------- 工具 ------- */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  /* ------- 偏好 ------- */
  function defaultPrefs() { return { customSauceItems: {}, customUnits: [], ingredientUsage: {}, unitHistory: [], processHistory: [], customTools: [], customActions: [], customTimes: [] }; }
  function getPrefs() {
    const p = load(LS_PREFS, null);
    const d = defaultPrefs();
    if (!p || typeof p !== 'object') return d;
    d.customSauceItems = p.customSauceItems || {};
    d.customUnits = p.customUnits || [];
    d.ingredientUsage = p.ingredientUsage || {};
    d.unitHistory = p.unitHistory || [];
    d.processHistory = p.processHistory || [];
    d.customTools = p.customTools || [];
    d.customActions = p.customActions || [];
    d.customTimes = p.customTimes || [];
    d.toolboxTools = p.toolboxTools || null;
    d.toolboxActions = p.toolboxActions || null;
    d.toolboxTimes = p.toolboxTimes || null;
    d.sauceCategories = p.sauceCategories || null;
    return d;
  }
  function savePrefs(p) { save(LS_PREFS, p); }

  function rememberList(arr, val, max) {
    val = (val || '').trim();
    if (!val) return arr;
    const list = [val].concat(arr.filter(x => x !== val));
    return list.slice(0, max || 40);
  }
  function rememberUnit(u) { const p = getPrefs(); p.unitHistory = rememberList(p.unitHistory, u); savePrefs(p); }
  function rememberProcess(pr) { const p = getPrefs(); p.processHistory = rememberList(p.processHistory, pr); savePrefs(p); }
  function getUnitHistory() { return getPrefs().unitHistory || []; }
  function getProcessHistory() { return getPrefs().processHistory || []; }

  function getAllUnits() {
    const cu = getPrefs().customUnits || [];
    return DEFAULT_UNITS.concat(cu.filter(u => DEFAULT_UNITS.indexOf(u) < 0));
  }
  function addCustomUnit(u) {
    u = (u || '').trim();
    if (!u) return;
    const p = getPrefs();
    if (p.customUnits.indexOf(u) < 0 && DEFAULT_UNITS.indexOf(u) < 0) p.customUnits.push(u);
    savePrefs(p);
  }

  /* 酱汁分类：动态（一级分类 + 二级配料 + 默认展开） */
  function getSauceCategories() {
    const p = getPrefs();
    if (p.sauceCategories) return p.sauceCategories;
    return SAUCE_CATEGORIES.map(c => {
      const items = c.items.slice();
      (p.customSauceItems[c.key] || []).forEach(n => { if (items.indexOf(n) < 0) items.push(n); });
      return { key: c.key, open: c.open, items: items };
    });
  }
  function saveSauceCategories(list) { const p = getPrefs(); p.sauceCategories = list; savePrefs(p); }

  /* 某分类的配料（手动排序） */
  function getCategoryItems(catKey) {
    const cat = getSauceCategories().find(c => c.key === catKey);
    return cat ? cat.items.slice() : [];
  }

  function addCustomSauceItem(catKey, name) {
    name = (name || '').trim();
    if (!name) return;
    const list = getSauceCategories();
    const cat = list.find(c => c.key === catKey);
    if (cat && cat.items.indexOf(name) < 0) { cat.items.push(name); saveSauceCategories(list); }
  }

  /* 模块工具箱：动态（厨具/动作/时间，含排序删除） */
  function toolboxList(key, defaults) {
    const p = getPrefs();
    if (p[key] && Array.isArray(p[key])) return p[key].slice();
    const customKey = key === 'toolboxTools' ? 'customTools' : (key === 'toolboxActions' ? 'customActions' : 'customTimes');
    return defaults.concat((p[customKey] || []).filter(x => defaults.indexOf(x) < 0));
  }
  function getToolboxTools() { return toolboxList('toolboxTools', TOOLS); }
  function getToolboxActions() { return toolboxList('toolboxActions', ACTIONS); }
  function getToolboxTimes() { return toolboxList('toolboxTimes', [600]); }
  function saveToolboxTools(list) { const p = getPrefs(); p.toolboxTools = list; savePrefs(p); }
  function saveToolboxActions(list) { const p = getPrefs(); p.toolboxActions = list; savePrefs(p); }
  function saveToolboxTimes(list) { const p = getPrefs(); p.toolboxTimes = list; savePrefs(p); }

  function addCustomTool(name) { name = (name || '').trim(); if (!name) return; const l = getToolboxTools(); if (l.indexOf(name) < 0) { l.push(name); saveToolboxTools(l); } }
  function addCustomAction(name) { name = (name || '').trim(); if (!name) return; const l = getToolboxActions(); if (l.indexOf(name) < 0) { l.push(name); saveToolboxActions(l); } }
  function addCustomTime(seconds) { seconds = Math.round(seconds || 0); if (seconds <= 0) return; const l = getToolboxTimes(); if (l.indexOf(seconds) < 0) { l.push(seconds); saveToolboxTimes(l); } }

  function bumpIngredientUse(name) {
    name = (name || '').trim();
    if (!name) return;
    const p = getPrefs();
    p.ingredientUsage[name] = (p.ingredientUsage[name] || 0) + 1;
    savePrefs(p);
  }

  /* ------- 菜谱 CRUD ------- */
  function normalizeModule(m) {
    if (m.type === 'note') {
      // 旧版「备注」模块迁移为带备注的工具模块
      return { type: 'tool', name: '备注', sauceId: null, seconds: 0, note: m.text || m.note || '', _id: m._id || uid() };
    }
    return {
      type: m.type || 'tool',
      name: m.name || '',
      sauceId: m.sauceId != null ? m.sauceId : null,
      seconds: m.seconds || 0,
      note: m.note || '',
      popup: m.popup !== false,
      showSauce: m.showSauce !== false,
      _id: m._id || uid()
    };
  }
  function ensureSlots(recipe) {
    if (!recipe.slots) recipe.slots = recipe.modules ? [recipe.modules] : [];
    recipe.slots = (recipe.slots || []).map(slot => (slot || []).map(normalizeModule));
    return recipe;
  }

  function getRecipes() { return load(LS_RECIPES, []).map(ensureSlots); }
  function getRecipe(id) { return getRecipes().find(r => r.id === id) || null; }
  function saveRecipe(recipe) {
    ensureSlots(recipe);
    const list = getRecipes();
    const idx = list.findIndex(r => r.id === recipe.id);
    if (idx >= 0) list[idx] = recipe; else list.push(recipe);
    save(LS_RECIPES, list);
  }
  function deleteRecipe(id) { save(LS_RECIPES, getRecipes().filter(r => r.id !== id)); }

  function newRecipe() {
    const seasonings = {};
    SEASONINGS.forEach(s => { seasonings[s.key] = { sel: false, variant: s.variants[0] || null, unit: s.unitOptions ? s.unitOptions[0] : null }; });
    return {
      id: uid(), name: '', cookingMethod: '', photo: null,
      meats: [], vegetables: [], seasonings: seasonings,
      sauces: [], slots: [], createdAt: Date.now(), useCount: 0
    };
  }
  function newSauce(purpose) { return { purpose: purpose || '腌制', selected: [], amounts: {} }; }
  function newModule(type, extra) { return Object.assign({ type: type, name: '', sauceId: null, seconds: 0, note: '', _id: uid() }, extra || {}); }

  function emptyMeat() { return { name: '', qty: '', unit: '', process: '', thaw: false }; }
  function emptyVeg() { return { name: '', qty: '', unit: '', process: '' }; }

  /* ------- 使用频率 ------- */
  function bumpRecipeUse(id) {
    const list = getRecipes();
    const r = list.find(x => x.id === id);
    if (r) { r.useCount = (r.useCount || 0) + 1; save(LS_RECIPES, list); }
  }

  /* ------- 烹饪方式联想历史 ------- */
  function getMethodHistory() { return load(LS_METHODS, []); }
  function getMethods() {
    const used = load(LS_METHODS, []);
    return used.concat(SEED_METHODS.filter(m => used.indexOf(m) < 0));
  }
  function rememberMethod(m) {
    m = (m || '').trim();
    if (!m) return;
    const used = load(LS_METHODS, []);
    const list = [m].concat(used.filter(x => x !== m));
    save(LS_METHODS, list.slice(0, 40));
  }

  /* ------- 烹饪历史 ------- */
  function getHistory() { return load(LS_HISTORY, []); }
  function addHistory(entry) { const h = getHistory(); h.unshift(entry); save(LS_HISTORY, h); }
  function updateHistory(id, patch) {
    const h = getHistory();
    const it = h.find(x => x.id === id);
    if (it) { Object.assign(it, patch); save(LS_HISTORY, h); }
  }
  function deleteHistory(id) { save(LS_HISTORY, getHistory().filter(x => x.id !== id)); }

  /* ------- 清除数据 ------- */
  function clearRecipes() { save(LS_RECIPES, []); }
  function clearHistory() { save(LS_HISTORY, []); }
  function clearPrefs() { save(LS_PREFS, defaultPrefs()); }
  function clearMethods() { save(LS_METHODS, []); }

  /* ------- 查找 ------- */
  function seasoningByKey(key) { return SEASONINGS.find(s => s.key === key) || null; }

  function seasoningUnit(recipe, key) {
    if (key === '蒜' && recipe.seasonings && recipe.seasonings['蒜'] && recipe.seasonings['蒜'].unit) {
      return recipe.seasonings['蒜'].unit;
    }
    const s = seasoningByKey(key);
    return s ? s.unit : '';
  }

  function selectedSeasonings(recipe) {
    const out = [];
    SEASONINGS.forEach(s => {
      const st = recipe.seasonings[s.key];
      if (st && st.sel) out.push({ key: s.key, variant: st.variant, unit: seasoningUnit(recipe, s.key) });
    });
    return out;
  }

  /* 某份酱汁的详细信息（名称 + 用量 + 单位），mult 为份数倍率 */
  function mulQty(q, m) {
    const n = parseFloat(q);
    if (isNaN(n)) return q;
    const v = n * m;
    return (Math.round(v * 100) / 100).toString();
  }
  function sauceDetails(recipe, idx, mult) {
    mult = mult || 1;
    const sauce = recipe.sauces && recipe.sauces[idx];
    if (!sauce) return '';
    const parts = [];
    (sauce.selected || []).forEach(n => {
      const a = sauce.amounts[n];
      const qty = (a && typeof a === 'object' && a.qty) ? a.qty : '';
      const unit = (a && typeof a === 'object' && a.unit && a.unit !== '无') ? a.unit : '';
      parts.push(n + (qty ? ' ' + mulQty(qty, mult) + unit : ''));
    });
    selectedSeasonings(recipe).forEach(s => {
      const a = sauce.amounts[s.key];
      const qty = (typeof a === 'string' ? a : (a && typeof a === 'object' ? a.qty : '')) || '';
      if (!qty) return; // 调味料未填写数量则不显示
      parts.push((s.variant || s.key) + ' ' + mulQty(qty, mult) + s.unit);
    });
    return parts.join('、');
  }

  /* ------- 导出 / 导入 ------- */
  function exportData() {
    return {
      app: '厨房小助手',
      version: 2,
      exportedAt: Date.now(),
      recipes: getRecipes(),
      prefs: getPrefs(),
      methods: getMethodHistory()
    };
  }
  function importData(data, opts) {
    opts = opts || {};
    let count = 0;
    if (opts.recipes && data.recipes && data.recipes.length) {
      const list = getRecipes();
      data.recipes.forEach(r => {
        if (opts.selectedIds && opts.selectedIds.indexOf(r.id) < 0) return;
        const nr = ensureSlots(K.clone(r));
        if (list.find(x => x.id === nr.id)) nr.id = uid();
        nr.slots = nr.slots.map(slot => slot.map(m => Object.assign({ _id: uid() }, m)));
        list.push(nr);
        count++;
      });
      save(LS_RECIPES, list);
    }
    if (opts.prefs && data.prefs) {
      const p = getPrefs();
      Object.keys(data.prefs.customSauceItems || {}).forEach(k => {
        p.customSauceItems[k] = p.customSauceItems[k] || [];
        (data.prefs.customSauceItems[k] || []).forEach(n => { if (p.customSauceItems[k].indexOf(n) < 0) p.customSauceItems[k].push(n); });
      });
      (data.prefs.customUnits || []).forEach(u => { if (p.customUnits.indexOf(u) < 0 && DEFAULT_UNITS.indexOf(u) < 0) p.customUnits.push(u); });
      Object.keys(data.prefs.ingredientUsage || {}).forEach(k => { p.ingredientUsage[k] = (p.ingredientUsage[k] || 0) + (data.prefs.ingredientUsage[k] || 0); });
      (data.prefs.customTools || []).forEach(n => { if (p.customTools.indexOf(n) < 0) p.customTools.push(n); });
      (data.prefs.customActions || []).forEach(n => { if (p.customActions.indexOf(n) < 0) p.customActions.push(n); });
      (data.prefs.customTimes || []).forEach(s => { if (p.customTimes.indexOf(s) < 0) p.customTimes.push(s); });
      if (data.prefs.toolboxTools) p.toolboxTools = data.prefs.toolboxTools;
      if (data.prefs.toolboxActions) p.toolboxActions = data.prefs.toolboxActions;
      if (data.prefs.toolboxTimes) p.toolboxTimes = data.prefs.toolboxTimes;
      if (data.prefs.sauceCategories) p.sauceCategories = data.prefs.sauceCategories;
      savePrefs(p);
    }
    if (opts.methods && data.methods) {
      (data.methods || []).forEach(m => rememberMethod(m));
    }
    return count;
  }

  /* ------- 暴露 ------- */
  window.K = window.K || {};
  Object.assign(K, {
    APP_VERSION,
    SEASONINGS, SAUCE_CATEGORIES, TOOLS, ACTIONS, ACTION_NEEDS_SAUCE, SEED_METHODS, WELCOME,
    DEFAULT_UNITS,
    uid, getRecipes, getRecipe, saveRecipe, deleteRecipe, newRecipe, newSauce, newModule, emptyMeat, emptyVeg,
    getMethodHistory, getMethods, rememberMethod,
    getHistory, addHistory, updateHistory, deleteHistory,
    seasoningByKey, seasoningUnit, selectedSeasonings, sauceDetails,
    getPrefs, savePrefs, getAllUnits, addCustomUnit, addCustomSauceItem, getCategoryItems, bumpIngredientUse,
    getUnitHistory, getProcessHistory, rememberUnit, rememberProcess,
    getSauceCategories, saveSauceCategories,
    addCustomTool, addCustomAction, addCustomTime, getToolboxTools, getToolboxActions, getToolboxTimes,
    saveToolboxTools, saveToolboxActions, saveToolboxTimes,
    bumpRecipeUse, exportData, importData, clearRecipes, clearHistory, clearPrefs, clearMethods
  });
})();
