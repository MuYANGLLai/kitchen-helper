# 厨房小助手 v1.12.1（PWA 部署包）

可直接部署的静态 PWA，无需构建。上传到任意静态托管（GitHub Pages / Vercel / Netlify 等）即可用手机访问并「添加到主屏幕」安装。

## 部署到 GitHub Pages
1. 新建 GitHub 仓库（如 kitchen-assistant）。
2. 把本文件夹（1.12.1）内所有内容推送到仓库根目录。
3. Settings → Pages：Source 选 Deploy from a branch，Branch 选 main，目录选 / (root)。
4. 访问 https://<你的用户名>.github.io/<仓库名>/ ，手机用「添加到主屏幕」安装。

> 提示：本包已包含空的 .nojekyll 文件。

## 发布新版本
应用内「设置 → 更新」读取根目录 version.json 与当前版本比较，发现新版本后通过 Service Worker 拉取新文件。发布新版本时：
1. 修改 version.json 里的 version。
2. 同时修改 sw.js 里的 CACHE 名称（如 kitchen-assistant-v11 → kitchen-assistant-v12）。
3. 重新打包到以新版本号命名的文件夹（如 ../1.13.0/）并推送部署。

## 本地预览
进入本目录运行任意静态服务器即可，例如：npx serve . 或 python -m http.server 8080，然后打开 http://localhost:8080 。
