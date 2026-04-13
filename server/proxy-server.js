const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const port = Number(process.env.PORT || 8787);
const difyBaseUrl = process.env.DIFY_BASE_URL;
const difyApiKey = process.env.DIFY_API_KEY;
const difyUser = process.env.DIFY_USER || "player-act1";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (!difyBaseUrl || !difyApiKey) {
  console.error("缺少环境变量：DIFY_BASE_URL 或 DIFY_API_KEY");
  process.exit(1);
}

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin(origin, callback) {
      // 允许 curl / postman 无 origin 的请求，便于联调
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: ${origin}`));
    },
  })
);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/dify", async (req, res) => {
  try {
    const reportStr = req.body && req.body.reportStr;
    if (!reportStr || typeof reportStr !== "string") {
      return res.status(400).json({ error: "reportStr 必填，且必须是字符串" });
    }

    const upstreamResponse = await fetch(`${difyBaseUrl}/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: { user_gamePerformance: reportStr },
        response_mode: "blocking",
        user: difyUser,
      }),
    });

    const text = await upstreamResponse.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch (e) {
      payload = { raw: text };
    }

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error: "Dify upstream request failed",
        upstreamStatus: upstreamResponse.status,
        detail: payload,
      });
    }

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({
      error: "Proxy internal error",
      detail: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Dify 代理已启动: http://localhost:${port}`);
});
