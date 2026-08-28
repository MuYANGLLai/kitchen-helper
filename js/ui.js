/* 通用 UI 工具 */
(function () {
  /* Toast */
  K.toast = function (msg) {
    let root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; }, 1600);
    setTimeout(() => el.remove(), 1900);
  };

  /* 文件 -> 压缩后的 dataURL */
  K.fileToDataURL = function (file, cb) {
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = function () {
        try {
          const max = 900;
          let w = img.width, h = img.height;
          if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r); }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          cb(canvas.toDataURL('image/jpeg', 0.82));
        } catch (e) { cb(reader.result); }
      };
      img.onerror = function () { cb(reader.result); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  /* 秒 -> mm:ss / h:mm:ss */
  K.fmtDuration = function (sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const pad = n => (n < 10 ? '0' : '') + n;
    return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
  };

  /* 时间戳 -> 中文日期时间 */
  K.fmtDateTime = function (ts) {
    const d = new Date(ts);
    const week = ['日', '一', '二', '三', '四', '五', '六'];
    const pad = n => (n < 10 ? '0' : '') + n;
    const now = new Date();
    const sameYear = d.getFullYear() === now.getFullYear();
    const datePart = sameYear ? (d.getMonth() + 1) + '月' + d.getDate() + '日' : d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    return datePart + ' 周' + week[d.getDay()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  };

  K.fmtClock = function (d) {
    const pad = n => (n < 10 ? '0' : '') + n;
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  };

  /* HTML 转义 */
  K.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /* 深拷贝 */
  K.clone = function (o) {
    if (typeof structuredClone === 'function') return structuredClone(o);
    return JSON.parse(JSON.stringify(o));
  };

  /* 照片占位色 */
  K.phClass = function (seed) {
    let n = 0;
    const s = String(seed || '');
    for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 997;
    return 'ph-' + (n % 6);
  };

  /* 自定义确认框 */
  K.confirm = function (message, onYes, onNo) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:300;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease;';
    wrap.innerHTML =
      '<div style="background:#fff;border-radius:22px;padding:24px 20px;width:min(320px,80vw);box-shadow:0 10px 30px rgba(0,0,0,.2);">' +
      '<div style="font-size:16px;font-weight:700;line-height:1.6;text-align:center;color:#3F3F46;">' + K.esc(message) + '</div>' +
      '<div style="display:flex;gap:10px;margin-top:20px;">' +
      '<button class="btn btn--soft" style="flex:1;" data-a="no">取消</button>' +
      '<button class="btn btn--primary" style="flex:1;" data-a="yes">确定</button>' +
      '</div></div>';
    document.body.appendChild(wrap);
    const close = (ans) => { wrap.remove(); if (ans === 'yes') onYes && onYes(); else onNo && onNo(); };
    wrap.addEventListener('click', e => {
      const a = e.target.closest('[data-a]');
      if (a) close(a.dataset.a);
      else if (e.target === wrap) close('no');
    });
  };

  /* 下载文本文件（备份导出） */
  K.download = function (filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 300);
  };

  /* 读取文本文件（导入备份） */
  K.readFileAsText = function (file, cb) {
    const reader = new FileReader();
    reader.onload = function () { cb(reader.result); };
    reader.onerror = function () { cb(null); };
    reader.readAsText(file);
  };

  /* 输入提示框（自定义单位 / 自定义配料 / 更新网址） */
  K.prompt = function (message, defaultValue, cb) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:300;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease;';
    wrap.innerHTML =
      '<div style="background:#fff;border-radius:22px;padding:22px 20px;width:min(320px,84vw);box-shadow:0 10px 30px rgba(0,0,0,.2);">' +
      '<div style="font-size:15px;font-weight:700;line-height:1.5;color:#3F3F46;margin-bottom:12px;">' + K.esc(message) + '</div>' +
      '<input style="width:100%;border:none;outline:none;background:#F4F4F6;border-radius:12px;padding:12px 14px;font-size:15px;font-family:inherit;" id="prompt-input" value="' + K.esc(defaultValue || '') + '">' +
      '<div style="display:flex;gap:10px;margin-top:16px;">' +
      '<button class="btn btn--soft" style="flex:1;" data-a="no">取消</button>' +
      '<button class="btn btn--primary" style="flex:1;" data-a="yes">确定</button>' +
      '</div></div>';
    document.body.appendChild(wrap);
    const input = wrap.querySelector('#prompt-input');
    setTimeout(() => input.focus(), 30);
    const close = ans => {
      const v = input.value;
      wrap.remove();
      if (ans === 'yes') cb(v);
      else cb(null);
    };
    wrap.addEventListener('click', e => {
      const a = e.target.closest('[data-a]');
      if (a) close(a.dataset.a);
      else if (e.target === wrap) close('no');
    });
  };

  /* 历史文本联想（输入框自动补全已输入过的文本） */
  K.setupSuggest = function (input, getHistory, onPick) {
    const parent = input.parentElement;
    parent.classList.add('autocomplete');
    let listEl = null;
    const hide = function () { if (listEl) { listEl.remove(); listEl = null; } };
    const show = function (items) {
      hide();
      listEl = document.createElement('div');
      listEl.className = 'autocomplete__list';
      if (!items.length) listEl.innerHTML = '<div class="autocomplete__empty">暂无联想</div>';
      else listEl.innerHTML = items.map(x => '<div class="autocomplete__item" data-v="' + K.esc(x) + '">' + K.esc(x) + '</div>').join('');
      parent.appendChild(listEl);
    };
    input.addEventListener('focus', function () { if (!input.value.trim()) show(getHistory()); });
    input.addEventListener('input', function () {
      const v = input.value.trim();
      show(v ? getHistory().filter(x => x.indexOf(v) >= 0) : getHistory());
    });
    input.addEventListener('blur', function () { setTimeout(hide, 160); });
    parent.addEventListener('click', function (e) {
      const it = e.target.closest('.autocomplete__item');
      if (it) { input.value = it.dataset.v; if (onPick) onPick(it.dataset.v); hide(); }
    });
  };
})();
