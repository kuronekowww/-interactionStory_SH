const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const port = Number(process.env.PORT || 8787);
const doubaoApiUrl = process.env.DOUBAO_API_URL || "https://ark.cn-beijing.volces.com/api/v3/responses";
const doubaoApiKey = process.env.DOUBAO_API_KEY;
const act1Model = process.env.DOUBAO_ACT1_MODEL || "doubao-seed-2-0-mini-260215";
const act2Model = process.env.DOUBAO_ACT2_MODEL || "doubao-seed-2-0-lite-260215";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (!doubaoApiKey) {
  console.error("缺少环境变量：DOUBAO_API_KEY");
  process.exit(1);
}

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: ${origin}`));
    },
  })
);

app.use(express.static(path.join(__dirname, "..")));

app.get("/health", (req, res) => {
  res.json({ ok: true, provider: "doubao" });
});

function buildAct1Prompt(reportStr) {
  return `# Role: 贝克街互动剧本生成引擎

# Context
玩家作为福尔摩斯的学徒，刚刚完成了《蓝宝石案》第一幕。系统收集了玩家的表现数据。你需要生成两部分内容：
1. 初始评价：福尔摩斯和华生基于数据对玩家的评价（幕后小剧场）。
2. 互动分支：提供3个玩家回复选项，并生成对应的后续回应剧情。

# Input Data
玩家表现数据：
${reportStr}

# Character Settings
福尔摩斯 (Sherlock Holmes):
- 核心态度：极度自负、智性恋、优雅的傲慢、典型的“Tsundere”（口嫌体正直）。
- 对待玩家：
  - 把玩家当做“甚至不如苏格兰场警察敏锐”的普通人，所以对玩家的任何一点进步都感到“意外”。语言口语化，称呼玩家为“小队长”。
  - 避免攻击性：不要说“蠢”，要说“思维被迷雾笼罩”。
  - 面对求夸奖：如果玩家撒娇或求夸，他会表现得不耐烦但实际上会给出认可（“好了好了，别像个讨糖吃的孩子”）。

华生 (Dr. Watson):
- 核心态度：温暖的守护者、捧哏、情感翻译机。
- 功能：负责把福尔摩斯的冷嘲热讽翻译成“他其实很欣赏你”。

# Generation Logic
## Part 1: 初始评价 (Initial Dialogue)
基于数据生成。如果玩家有错，福尔摩斯调侃其弯路；如果全对，福尔摩斯表示“勉强合格”。

## Part 2: 玩家选项与回应 (Options & Responses)
生成 3 个情感正向的选项，分别对应不同性格的玩家，并生成对应的后续对话：

选项 1：【寻求认可/撒娇委屈型】
- 后续回应：华生会立刻安慰；福尔摩斯虽然嘴硬，但最后会给出一句含蓄肯定。

选项 2：【自信满满/开心骄傲型】
- 后续回应：福尔摩斯会打击一下玩家的嚣张气焰，但嘴角是上扬的；华生会笑着附和玩家。

选项 3：【谦虚崇拜/认真学习型】
- 后续回应：福尔摩斯会收起嘲讽，给出一句比较正经的导师寄语。

# Output Format
你必须且仅输出一个 JSON 对象，不要输出 markdown 代码块，不要输出额外解释。
结构如下：
{
  "initial_dialogue": [ { "speaker": "角色名", "content": "对话内容" } ],
  "options": [
    {
      "id": 1,
      "text": "选项文案",
      "response_dialogue": [ { "speaker": "角色名", "content": "对话内容" } ]
    }
  ]
}`;
}

function buildAct2Prompt(strategyInput) {
  return `# Role: Sherlock_Game_Engine_V2

## Profile
你是一个文字冒险游戏的后端剧情引擎。你的核心任务是处理玩家在《蓝宝石案》中的输入，判断其意图，并根据判定结果生成对应的剧情反馈或失败惩罚。

## Context: Current Case State
1. 基础信息
- 时间/地点：12月27日早晨（圣诞节后），贝克街221B。
- 人物：福尔摩斯、华生、彼得森（杂役）、玩家（“小队长”）。
- 前情：彼得森在街头捡到一只鹅和一顶破帽子（失主受惊逃跑）。鹅归彼得森处理，帽子留作推演道具。

2. 关键物品与推演结论
- 物品：一顶破旧的黑色硬毡帽。
- 失主侧写（已确立的事实）：
  - 姓名：亨利·贝克（Henry Baker）。
  - 经济状况：曾富裕（买得起昂贵帽子）现落魄（三年未换帽）。
  - 家庭状况：夫妻关系冷淡（帽子积灰无人理），家中无煤气（帽子上有蜡烛油滴）。
  - 个人习惯：近期刚剪发，涂抹柠檬发乳，有酗酒迹象。

3. 剧情转折（Current Crisis）
- 突发事件：彼得森在清理鹅的嗉子时，发现了“蓝宝石”（The Blue Carbuncle）。
- 案件性质升级：从简单的“失物招领”升级为“莫尔卡伯爵夫人宝石失窃大案”。
- 案件背景：管子工约翰·霍纳已被错误指控。为了查清真相，必须找到鹅和帽子的原主人——亨利·贝克。
- 唯一线索：手中这顶破帽子。
- 当前难题：如何在数万名伦敦市民中找到唯一的“亨利·贝克”。

2. 关键设定
- 正确解法：利用大众媒介（晚报）刊登失物招领启事，诱使失主主动上门。
- 逻辑核心：与其在干草堆里找针，不如拿一块磁铁把针吸出来。

## Task Workflow
1. 分析输入：根据判定规则将用户输入归类为 CORRECT、STRATEGY 或 CHAT。
2. 生成内容：根据类别生成对应的文本内容（福尔摩斯的台词 或 报纸惩罚）。
3. 格式输出：输出标准的 JSON 对象。

## Classification & Generation Rules
### 1. 判定类别：CORRECT (正确策略)
- 判定规则：用户明确提出了利用“报纸”“广告”“媒体”或“失物招领”来寻找失主。
- 关键词：登报、晚报、广告、招领、启事。
- 生成：写入 payload.message，语调兴奋、干练、赞许。

### 2. 判定类别：STRATEGY (错误/低效策略)
- 判定规则：提出行动但不属于登报。
- 生成字段：
  - newspaper_headline: 必须带【】的夸张标题
  - newspaper_body: 混乱后果，80字以内
  - editor_comment: 主编讽刺点评

### 3. 判定类别：CHAT (闲聊/无效)
- 判定规则：问候、元游戏发言、无意义字符、情绪宣泄。
- 生成：payload.message，40字以内；暗示“纸张”“传播”“全伦敦的眼睛”，严禁直接出现“报纸”或“招领”字样。

## Output JSON Structure
不要用 answer 包裹，必须只输出 JSON：
{
  "status": "CORRECT | STRATEGY | CHAT",
  "payload": {
    "message": "String",
    "newspaper_headline": "String",
    "newspaper_body": "String",
    "editor_comment": "String"
  }
}

input: ${strategyInput}`;
}

function extractJsonFromDoubao(data) {
  let modelText = data.output_text || "";

  if (!modelText && Array.isArray(data.output)) {
    for (const item of data.output) {
      const contentList = item && item.content;
      if (!Array.isArray(contentList)) continue;
      for (const content of contentList) {
        if (content && (content.type === "output_text" || content.type === "text") && content.text) {
          modelText += content.text;
        }
      }
    }
  }

  if (!modelText) {
    throw new Error("Doubao response has no output text");
  }

  const jsonMatch = modelText.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : modelText);
}

async function callDoubao(model, prompt) {
  const upstreamResponse = await fetch(doubaoApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${doubaoApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      thinking: { type: "disabled" },
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
    }),
  });

  const text = await upstreamResponse.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (error) {
    payload = { raw: text };
  }

  if (!upstreamResponse.ok) {
    const error = new Error("Doubao upstream request failed");
    error.status = upstreamResponse.status;
    error.payload = payload;
    throw error;
  }

  return extractJsonFromDoubao(payload);
}

app.post("/api/doubao/act1", async (req, res) => {
  try {
    const reportStr = req.body && req.body.reportStr;
    if (!reportStr || typeof reportStr !== "string") {
      return res.status(400).json({ error: "reportStr 必填，且必须是字符串" });
    }
    const result = await callDoubao(act1Model, buildAct1Prompt(reportStr));
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({
      error: "Act1 proxy error",
      detail: error.message,
      upstream: error.payload,
    });
  }
});

app.post("/api/doubao/act2", async (req, res) => {
  try {
    const strategyInput = req.body && req.body.strategyInput;
    if (!strategyInput || typeof strategyInput !== "string") {
      return res.status(400).json({ error: "strategyInput 必填，且必须是字符串" });
    }
    const result = await callDoubao(act2Model, buildAct2Prompt(strategyInput));
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({
      error: "Act2 proxy error",
      detail: error.message,
      upstream: error.payload,
    });
  }
});

app.listen(port, () => {
  console.log(`豆包代理与静态站点已启动: http://localhost:${port}`);
});
