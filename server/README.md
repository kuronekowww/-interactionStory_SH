# Dify 代理服务

用于给前端页面提供安全的转发接口，避免在浏览器暴露 Dify API Key，并解决 GitHub Pages 不能直连内网 Dify 的问题。

## 1) 安装依赖

```bash
cd server
npm install
```

## 2) 配置环境变量

```bash
cp .env.example .env
```

至少需要配置：

- `DIFY_BASE_URL`：内网 Dify 地址（含 `/v1`）
- `DIFY_API_KEY`：Dify 应用密钥
- `ALLOWED_ORIGINS`：允许访问代理的前端域名（逗号分隔）

## 3) 启动

```bash
npm start
```

默认地址：`http://localhost:8787`

## 4) 前端接入

前端默认请求：`http://localhost:8787/api/dify`

如果你把代理部署到了线上域名，可在 `index.html` 前注入：

```html
<script>
  window.__AI_PROXY_URL__ = "https://your-proxy-domain/api/dify";
</script>
```

再加载业务脚本即可。
