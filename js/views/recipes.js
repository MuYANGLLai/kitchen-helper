/* 菜谱页：添加 + 分类筛选 + 三列网格 + 编辑 */
(function () {
  let methodFilter = null;      // string | null
  let ingredientFilter = null;  // string | null
  let openFilter = null;        // 'method' | 'ingredient' | null

  function distinctMethods(recipes) {
    const set = [];
    recipes.forEach(r => { const m = (r.cookingMethod || '').trim(); if (m && set.indexOf(m) < 0) set.push(m); });
    return set;
  }
  function distinctIngredients(recipes) {
    const set = [];
    recipes.forEach(r => {
      (r.meats || []).forEach(x => { const n = (x.name || '').trim(); if (n && set.indexOf(n) < 0) set.push(n); });
      (r.vegetables || []).forEach(x => { const n = (x.name || '').trim(); if (n && set.indexOf(n) < 0) set.push(n); });
    });
    return set;
  }

  function filtered(recipes) {
    return recipes.filter(r => {
      if (methodFilter) {
        if ((r.cookingMethod || '').trim() !== methodFilter) return false;
      }
      if (ingredientFilter) {
        const names = [];
        (r.meats || []).forEach(x => names.push((x.name || '').trim()));
        (r.vegetables || []).forEach(x => names.push((x.name || '').trim()));
        if (names.indexOf(ingredientFilter) < 0) return false;
      }
      return true;
    });
  }

  function tile(r) {
    const ph = '<div class="recipe-tile__ph ' + K.phClass(r.id) + '">' + (r.photo ? '' : '🍲') + '</div>';
    const img = r.photo ? '<img class="recipe-tile__img" src="' + r.photo + '" alt="">' : ph;
    return '<button class="recipe-tile" data-id="' + r.id + '">' +
      img +
      '<div class="recipe-tile__name">' + K.esc(r.name || '未命名菜谱') + '</div>' +
      '<div class="recipe-tile__meta">' + K.esc(r.cookingMethod || '') + '</div>' +
    '</button>';
  }

  function render() {
    const root = document.getElementById('recipe-view');
    const recipes = K.getRecipes();
    const list = filtered(recipes);

    // 网格
    const grid = document.getElementById('recipe-grid');
    if (!list.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1;">' + K.icon('recipe', 42) +
        '<div style="margin-top:10px;">' + (recipes.length ? '没有符合条件的菜谱' : '还没有菜谱，点击上方「添加菜谱」开始') + '</div></div>';
    } else {
      grid.innerHTML = list.map(tile).join('');
    }

    // 筛选面板
    const panel = document.getElementById('filter-panel');
    if (!openFilter) { panel.innerHTML = ''; }
    else {
      const opts = openFilter === 'method' ? distinctMethods(recipes) : distinctIngredients(recipes);
      const cur = openFilter === 'method' ? methodFilter : ingredientFilter;
      const chips = ['<button class="chip' + (!cur ? ' active' : '') + '" data-v="">全部</button>']
        .concat(opts.map(o => '<button class="chip' + (cur === o ? ' active' : '') + '" data-v="' + K.esc(o) + '">' + K.esc(o) + '</button>'))
        .join('');
      panel.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 2px;">' + chips + '</div>';
    }

    // 筛选按钮状态
    const pm = document.getElementById('pill-method');
    const pi = document.getElementById('pill-ingredient');
    pm.classList.toggle('active', !!methodFilter);
    pi.classList.toggle('active', !!ingredientFilter);
    pm.textContent = methodFilter || '烹饪方式';
    pi.textContent = ingredientFilter || '主料食材';
  }

  K.renderRecipes = function (root) {
    K.cleanupCurrent = function () {};
    methodFilter = null; ingredientFilter = null; openFilter = null;

    root.innerHTML =
      '<div class="view" id="recipe-view">' +
        '<div class="page-head">' +
          '<div class="page-title">菜谱</div>' +
          '<button class="btn btn--primary" id="add-recipe">' + K.icon('plus', 18) + '添加菜谱</button>' +
        '</div>' +
        '<div class="filter-row">' +
          '<button class="pill" id="pill-method">烹饪方式</button>' +
          '<button class="pill" id="pill-ingredient">主料食材</button>' +
        '</div>' +
        '<div id="filter-panel"></div>' +
        '<div class="grid-3" id="recipe-grid"></div>' +
      '</div>';

    document.getElementById('add-recipe').addEventListener('click', () => K.navigate('wizard', {}));

    const pm = document.getElementById('pill-method');
    const pi = document.getElementById('pill-ingredient');
    pm.addEventListener('click', () => { openFilter = openFilter === 'method' ? null : 'method'; render(); });
    pi.addEventListener('click', () => { openFilter = openFilter === 'ingredient' ? null : 'ingredient'; render(); });

    const panel = document.getElementById('filter-panel');
    panel.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const v = chip.dataset.v || '';
      if (openFilter === 'method') methodFilter = v || null;
      else if (openFilter === 'ingredient') ingredientFilter = v || null;
      openFilter = null;
      render();
    });

    const grid = document.getElementById('recipe-grid');
    grid.addEventListener('click', e => {
      const tile = e.target.closest('.recipe-tile');
      if (tile) K.navigate('wizard', { id: tile.dataset.id });
    });

    render();
  };
})();
