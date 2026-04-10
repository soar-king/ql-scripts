const FEISHU_WEBHOOK = process.env.FEISHU_WEBHOOK || "";
const FEISHU_AT_OPENID = process.env.FEISHU_AT_OPENID || "";
const RATE_LIMIT_SEC = parseInt(process.env.FEISHU_RATE_LIMIT || "30", 10);

// 限流时间戳记录
let lastSendTime = 0;

// 限流校验
function checkRateLimit() {
  const now = Date.now();
  if (now - lastSendTime < RATE_LIMIT_SEC * 1000) {
    throw new Error(`推送限流中，请${RATE_LIMIT_SEC}秒后再试`);
  }
  lastSendTime = now;
}

// 文本截断
function cutText(str, maxLen = 800) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "\n...内容过长已截断";
}

// 纯文本推送 + @人
async function feishuText(content, isFail = false) {
  if (!FEISHU_WEBHOOK) return Promise.reject("未配置 FEISHU_WEBHOOK");
  checkRateLimit();

  let text = cutText(content);
  if (isFail && FEISHU_AT_OPENID) {
    const atTags = FEISHU_AT_OPENID.split(",")
      .map(id => `<at open_id="${id.trim()}"></at>`)
      .join(" ");
    text += "\n" + atTags;
  }

  const res = await fetch(FEISHU_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg_type: "text", content: { text } })
  });
  return res.json();
}

// MD卡片推送
async function feishuCard(title, mdContent, status = "正常") {
  if (!FEISHU_WEBHOOK) return Promise.reject("未配置 FEISHU_WEBHOOK");
  checkRateLimit();

  const colorMap = {
    "成功": "success",
    "失败": "danger",
    "运行中": "warning",
    "正常": "default"
  };

  const content = cutText(mdContent, 1200);
  const body = {
    msg_type: "interactive",
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: "plain_text", content: title },
        template: colorMap[status] || "default"
      },
      elements: [{ tag: "div", text: { tag: "lark_md", content } }]
    }
  };

  const res = await fetch(FEISHU_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

// 全局任务包装器：自动捕获异常+全生命周期通知
async function runTaskWithNotify(taskName, fn) {
  const startTime = new Date().toLocaleString();
  try {
    await feishuCard(`【${taskName}】开始运行`, ` 启动时间：${startTime}`, "运行中");
    await fn();
    const endTime = new Date().toLocaleString();
    await feishuCard(`【${taskName}】执行成功`, `✅ 开始：${startTime}\n结束：${endTime}`, "成功");
  } catch (error) {
    const errMsg = error.message || "未知错误";
    const stack = error.stack || "无堆栈信息";
    const endTime = new Date().toLocaleString();

    console.error(" 任务异常：", errMsg, "\n堆栈：", stack);

    await feishuText(`【${taskName}】失败\n时间：${endTime}\n错误：${errMsg}`, true);
    await feishuCard(`【${taskName}】异常告警`,
      ` 时间：${endTime}\n💥 错误：${errMsg}\n📜 堆栈：\n${stack}`,
      "失败"
    );
  }
}

module.exports = {
  feishuText,
  feishuCard,
  runTaskWithNotify
};
