/* 设置页：版本信息 / 更新 / 数据管理 */
(function () {
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
    const url = baseUrl
      ? baseUrl + '/version.json?t=' + Date.now()
      : './version.json?t=' + Date.now();
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

  K.renderSettings = function (root) {
    K.cleanupCurrent = function () {};
    root.innerHTML =
      '<div class="view" style="padding-bottom:140px;">' +
        '<div class="page-head"><div class="page-title">设置</div></div>' +
        '<div style="text-align:center;padding:28px 0 12px;">' +
          '<div style="width:76px;height:76px;border-radius:22px;background:#FFB7C5;margin:0 auto;display:flex;align-items:center;justify-content:center;">' + K.icon('pot', 40) + '</div>' +
          '<div style="font-size:20px;font-weight:800;margin-top:14px;">厨房小助手</div>' +
          '<div style="font-size:13px;color:#B4B4BE;margin-top:6px;">记录菜谱 · 配置酱汁 · 按步骤烹饪</div>' +
        '</div>' +

        '<div class="section-title">' + K.icon('info', 18) + '版本信息</div>' +
        '<div class="card">' +
          '<div class="setting-row" style="margin:0 0 10px;"><span class="sr-label">当前版本</span><span class="sr-val">v' + K.APP_VERSION + '</span></div>' +
          '<div class="setting-row" style="margin:0 0 10px;"><span class="sr-label">存储方式</span><span class="sr-val">本机存储</span></div>' +
          '<div class="setting-row" style="margin:0;"><span class="sr-label">安装方式</span><span class="sr-val">PWA 可安装</span></div>' +
        '</div>' +

        '<div class="section-title">' + K.icon('reset', 18) + '更新</div>' +
        '<div class="card">' +
          '<button class="btn btn--primary btn--block" id="update-current">' + K.icon('reset', 18) + '检查更新（当前网址）</button>' +
          '<div style="margin:14px 0 8px;font-size:13px;color:#7C7C86;">或从指定网址拉取最新版本：</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<input class="field__input" id="update-url-input" placeholder="https://…" style="flex:1;">' +
            '<button class="btn btn--mint" id="update-url">从网址更新</button>' +
          '</div>' +
        '</div>' +

        '<div class="section-title">' + K.icon('note', 18) + '数据管理</div>' +
        '<div class="card">' +
          '<button class="btn btn--block" id="export-btn" style="background:#EFFAF3;color:#1E5C3C;">' + K.icon('check', 18) + '备份（导出全部数据）</button>' +
          '<button class="btn btn--block" id="import-btn" style="background:#FFF1F4;color:#C2495F;margin-top:10px;">' + K.icon('plus', 18) + '导入（选择性恢复备份）</button>' +
          '<input type="file" id="import-file" accept="application/json,.json" style="display:none">' +
        '</div>' +

        '<div style="text-align:center;font-size:12px;color:#B4B4BE;padding:10px 0;">数据保存在本机浏览器，卸载或清除数据前请先备份。</div>' +
      '</div>';

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

    document.getElementById('export-btn').addEventListener('click', () => {
      const data = K.exportData();
      const name = '厨房小助手备份_' + new Date().toISOString().slice(0, 10) + '.json';
      K.download(name, JSON.stringify(data, null, 2));
      K.toast('已导出备份文件');
    });

    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
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
  };

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
        '<label class="import-row"><input type="checkbox" id="import-prefs" checked><span>导入个性偏好（自定义配料 / 单位）</span></label>' +
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
})();
