# 厨房小助手（PWA 部署包）

这是可直接部署的静态 PWA 部署包，无需构建。上传到任意静态托管（GitHub Pages / Vercel / Netlify 等）即可用手机访问并「添加到主屏幕」安装。

## 目录结构

```
index.html           应用入口
manifest.webmanifest  PWA 清单
sw.js                Service Worker（离线缓存 + 更新）
version.json         版本信息（更新功能读取）
css/styles.css       样式
js/                  应用逻辑（views/ 为各页面）
icons/               PWA 图标
```

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库（如 kitchen-assistant）。
2. 把本文件夹内所有内容推送到仓库（放到仓库根目录，或 docs/ 目录）。
3. 仓库 Settings → Pages：Source 选 Deploy from a branch；Branch 选 main，目录选 / (root)（若放在 docs/ 则选 /docs）。
4. 保存后稍等，访问 https://<你的用户名>.github.io/<仓库名>/ 。
5. 手机浏览器打开后，用菜单里的「添加到主屏幕」即可安装为 App。

> 提示：本包已包含空的 .nojekyll 文件，避免 GitHub Pages 对内容的额外处理。

## 发布新版本（应用内「更新」功能依赖此流程）

应用内「设置 → 更新」会读取根目录的 version.json 与当前版本比较，发现新版本后通过 Service Worker 拉取新文件。发布新版本时：

1. 修改 version.json 里的 version（如 1.1.0 → 1.2.0）。
2. 同时修改 sw.js 里的 CACHE 名称（如 kitchen-assistant-v2 → kitchen-assistant-v3），这样浏览器才会重新缓存新文件。
3. 重新推送部署。

## 本地预览

进入本目录运行任意静态服务器即可，例如：npx serve . 或 python -m http.server 8080
然后打开 http://localhost:8080 。桌面 Chrome 地址栏右侧会出现安装按钮。
