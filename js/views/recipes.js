/* 菜谱页：添加 + 分类筛选 + 三列网格 + 编辑 + 删除 */
(function () {
  let methodFilter = null;
  let ingredientFilter = null;
  let openFilter = null;
  let deleteMode = false;
  let deleteSel = [];

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
      if (methodFilter && (r.cookingMethod || '').trim() !== methodFilter) return false;
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
    const img = r.photo ? '<img class="recipe-tile__img" src="' + r.photo + '" alt="">' : '<div class="recipe-tile__ph ' + K.phClass(r.id) + '">🍲</div>';
    if (deleteMode) {
      const sel = deleteSel.indexOf(r.id) >= 0;
      return '<button class="recipe-tile' + (sel ? ' selected' : '') + '" data-id="' + r.id + '">' +
        img +
        '<span class="select-check">' + (sel ? K.icon('check', 15) : '') + '</span>' +
        '<div class="recipe-tile__name">' + K.esc(r.name || '未命名菜谱') + '</div>' +
        '<div class="recipe-tile__meta">' + K.esc(r.cookingMethod || '') + '</div>' +
      '</button>';
    }
    return '<button class="recipe-tile" data-id="' + r.id + '">' +
      img +
      '<div class="recipe-tile__name">' + K.esc(r.name || '未命名菜谱') + '</div>' +
      '<div class="recipe-tile__meta">' + K.esc(r.cookingMethod || '') + '</div>' +
    '</button>';
  }

  function render() {
    const recipes = K.getRecipes();
    const list = filtered(recipes);

    const addBtn = document.getElementById('add-recipe');
    const delBtn = document.getElementById('delete-toggle');
    if (addBtn) addBtn.style.display = deleteMode ? 'none' : '';
    if (delBtn) {
      delBtn.innerHTML = deleteMode ? '完成' : K.icon('trash', 17) + '删除';
      delBtn.classList.toggle('btn--primary', deleteMode);
      delBtn.classList.toggle('btn--soft', !deleteMode);
    }
    const footer = document.getElementById('delete-footer');
    if (footer) {
      footer.classList.toggle('hidden', !deleteMode);
      const confirm = footer.querySelector('#delete-confirm');
      if (confirm) { confirm.textContent = '删除选中（' + deleteSel.length + '）'; confirm.disabled = !deleteSel.length; }
    }

    const grid = document.getElementById('recipe-grid');
    if (!list.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1;">' + K.icon('recipe', 42) +
        '<div style="margin-top:10px;">' + (recipes.length ? '没有符合条件的菜谱' : '还没有菜谱，点击上方「添加菜谱」开始') + '</div></div>';
    } else {
      grid.innerHTML = list.map(tile).join('');
    }

    const panel = document.getElementById('filter-panel');
    if (!openFilter) panel.innerHTML = '';
    else {
      const opts = openFilter === 'method' ? distinctMethods(recipes) : distinctIngredients(recipes);
      const cur = openFilter === 'method' ? methodFilter : ingredientFilter;
      const chips = ['<button class="chip' + (!cur ? ' active' : '') + '" data-v="">全部</button>']
        .concat(opts.map(o => '<button class="chip' + (cur === o ? ' active' : '') + '" data-v="' + K.esc(o) + '">' + K.esc(o) + '</button>'))
        .join('');
      panel.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 2px;">' + chips + '</div>';
    }

    const pm = document.getElementById('pill-method');
    const pi = document.getElementById('pill-ingredient');
    pm.classList.toggle('active', !!methodFilter);
    pi.classList.toggle('active', !!ingredientFilter);
    pm.textContent = methodFilter || '烹饪方式';
    pi.textContent = ingredientFilter || '主料食材';
  }

  K.renderRecipes = function (root) {
    K.cleanupCurrent = function () {};
    methodFilter = null; ingredientFilter = null; openFilter = null; deleteMode = false; deleteSel = [];

    root.innerHTML =
      '<div class="view" id="recipe-view" style="padding-bottom:130px;">' +
        '<div class="page-head">' +
          '<div class="page-title">菜谱</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button class="btn btn--primary" id="add-recipe">' + K.icon('plus', 18) + ' 添加菜谱</button>' +
            '<button class="btn btn--soft" id="delete-toggle">' + K.icon('trash', 17) + ' 删除</button>' +
          '</div>' +
        '</div>' +
        '<div class="filter-row">' +
          '<button class="pill" id="pill-method">烹饪方式</button>' +
          '<button class="pill" id="pill-ingredient">主料食材</button>' +
        '</div>' +
        '<div id="filter-panel"></div>' +
        '<div class="grid-3" id="recipe-grid"></div>' +
      '</div>' +
      '<div class="page-footer hidden" id="delete-footer">' +
        '<button class="btn btn--soft" id="delete-cancel">取消</button>' +
        '<button class="btn btn--primary" id="delete-confirm" disabled>删除选中（0）</button>' +
      '</div>';

    document.getElementById('add-recipe').addEventListener('click', () => K.navigate('wizard', {}));
    document.getElementById('delete-toggle').addEventListener('click', () => { deleteMode = !deleteMode; deleteSel = []; render(); });

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
      if (!tile) return;
      const id = tile.dataset.id;
      if (deleteMode) {
        const i = deleteSel.indexOf(id);
        if (i >= 0) deleteSel.splice(i, 1); else deleteSel.push(id);
        render();
      } else {
        K.navigate('wizard', { id: id });
      }
    });

    document.getElementById('delete-cancel').addEventListener('click', () => {
      deleteMode = false; deleteSel = [];
      render();
    });

    document.getElementById('delete-confirm').addEventListener('click', () => {
      if (!deleteSel.length) return;
      K.confirm('删除选中的 ' + deleteSel.length + ' 个菜谱？此操作不可恢复。', () => {
        deleteSel.forEach(id => K.deleteRecipe(id));
        deleteMode = false; deleteSel = [];
        K.toast('已删除');
        render();
      });
    });

    render();
  };
})();
