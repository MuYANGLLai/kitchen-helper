/* 首页：日期时间 + 心灵鸡汤 + 开始烹饪 + 烹饪历史 */
(function () {
  let clockTimer = null;

  function renderHistory() {
    const list = K.getHistory();
    const box = document.getElementById('home-history');
    if (!box) return;
    if (!list.length) {
      box.innerHTML = '<div class="empty">' + K.icon('history', 42) + '<div style="margin-top:10px;">还没有烹饪记录</div></div>';
      return;
    }
    box.innerHTML = list.map(h => {
      const names = (h.recipeNames && h.recipeNames.length ? h.recipeNames : ['菜谱']).join(' · ');
      const thumb = h.photo
        ? '<img src="' + h.photo + '" alt="">'
        : '<span>' + K.icon('bowl', 26) + '</span>';
      return '<div class="history-item" data-id="' + h.id + '">' +
        '<div class="hi-thumb">' + thumb + '</div>' +
        '<div class="hi-body">' +
          '<div class="hi-time">' + K.esc(K.fmtDateTime(h.time)) + '</div>' +
          '<div class="hi-recipes">' + K.esc(names) + '</div>' +
          '<div style="display:flex;gap:8px;margin-top:8px;">' +
            '<button class="hi-add" data-a="photo">' + K.icon('camera', 14) + (h.photo ? '更换照片' : '上传照片') + '</button>' +
            '<button class="hi-add" data-a="del" style="color:#E0556A;">' + K.icon('trash', 14) + '删除</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  K.renderHome = function (root) {
    if (clockTimer) clearInterval(clockTimer);

    const now = new Date();
    const week = ['日', '一', '二', '三', '四', '五', '六'];
    const dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
    const weekStr = '周' + week[now.getDay()];
    const q = K.WELCOME[Math.floor(Math.random() * K.WELCOME.length)];

    root.innerHTML =
      '<div class="view">' +
        '<div class="home-top">' +
          '<div>' +
            '<div class="home-date">' + dateStr + '</div>' +
            '<div class="home-time">' + weekStr + ' · <span id="home-clock">' + K.fmtClock(now) + '</span></div>' +
          '</div>' +
          '<div style="font-size:34px;">🍳</div>' +
        '</div>' +

        '<div class="welcome-card">' +
          '<div class="quote">“' + K.esc(q.quote) + '”</div>' +
          '<div class="quote-sub">' + K.esc(q.sub) + '</div>' +
        '</div>' +

        '<div class="start-card" id="start-cooking">' +
          '<div class="start-emoji">🔥</div>' +
          '<div>' +
            '<div class="start-title">开始烹饪</div>' +
            '<div class="start-sub">选择菜谱，跟着步骤下厨</div>' +
          '</div>' +
          '<div class="start-arrow">' + K.icon('arrowRight', 26) + '</div>' +
        '</div>' +

        '<div class="section-title">' + K.icon('history', 19) + '烹饪历史</div>' +
        '<div id="home-history"></div>' +
      '</div>';

    clockTimer = setInterval(() => {
      const el = document.getElementById('home-clock');
      if (el) el.textContent = K.fmtClock(new Date());
    }, 1000);

    document.getElementById('start-cooking').addEventListener('click', () => K.navigate('cooking'));

    renderHistory();

    const hist = document.getElementById('home-history');
    hist.addEventListener('click', e => {
      const btn = e.target.closest('[data-a]');
      const item = e.target.closest('.history-item');
      if (!btn || !item) return;
      const id = item.dataset.id;
      if (btn.dataset.a === 'del') {
        K.confirm('删除这条烹饪记录？', () => { K.deleteHistory(id); renderHistory(); });
      } else if (btn.dataset.a === 'photo') {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = () => {
          const f = input.files && input.files[0];
          if (!f) return;
          K.fileToDataURL(f, dataUrl => { K.updateHistory(id, { photo: dataUrl }); renderHistory(); });
        };
        input.click();
      }
    });

    K.cleanupCurrent = function () { if (clockTimer) clearInterval(clockTimer); clockTimer = null; };
  };
})();
