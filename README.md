# 塞尔维亚 Loto 选号助手 Web App

这是从原 Expo / React Native 项目迁移出的纯前端 Web App / PWA 版本。

## 功能

- 自选 7 个号码，范围 01–39
- 机选 7 个不重复号码
- 清除当前选号
- 保存选号到历史记录
- 从历史记录重新使用号码
- 从历史记录出现过的号码中随机生成组合
- 删除单条历史记录
- 清空全部历史记录
- 号码统计
- 收藏号码
- 分享号码；不支持系统分享时会自动复制到剪贴板
- PWA：支持添加到手机主屏幕，支持基础离线缓存

## 部署到 GitHub Pages

把本文件夹里的所有文件上传到仓库根目录，然后在 GitHub Pages 中选择该分支部署即可。

```bash
git add .
git commit -m "add serbia lotto web app"
git push
```

如果使用自定义域名，请按 GitHub Pages 的要求额外添加 `CNAME` 文件。
