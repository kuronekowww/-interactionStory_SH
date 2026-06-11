# 豆包代理与静态站点服务

用于给前端页面提供安全的同源转发接口，避免在浏览器暴露豆包 API Key。提示词也在服务端拼接，前端只提交玩家表现数据或玩家输入。

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

- `DOUBAO_API_KEY`：火山方舟/豆包 API Key
- `DOUBAO_API_URL`：默认 `https://ark.cn-beijing.volces.com/api/v3/responses`
- `DOUBAO_ACT1_MODEL`：第一幕评价使用的模型
- `DOUBAO_ACT2_MODEL`：第二幕策略判断使用的模型
- `ALLOWED_ORIGINS`：允许跨域访问代理的前端域名（逗号分隔）

## 3) 启动

```bash
npm start
```

默认地址：`http://localhost:8787`

这个服务会同时托管项目根目录的静态页面：

- `http://localhost:8787/`
- `http://localhost:8787/第二幕.html`

## 4) 前端接口

前端默认请求同源接口：

- `POST /api/doubao/act1`，body: `{ "reportStr": "..." }`
- `POST /api/doubao/act2`，body: `{ "strategyInput": "..." }`

生产部署时，把 `server` 目录作为 Node 服务部署，并配置上面的环境变量。
