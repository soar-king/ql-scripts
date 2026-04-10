# ql-scripts

添加三个变量：
FEISHU_WEBHOOK
FEISHU_AT_OPENID
FEISHU_RATE_LIMIT（默认30）

✅ 环境变量配置，无硬编码
✅ 自定义限流间隔，防消息轰炸
✅ 文本/卡片双模式推送
✅ 超长内容自动截断，避免溢出
✅ 失败自动@指定人员（多ID支持）
✅ 全局try-catch，无需手动写异常捕获
✅ 任务启动/成功/失败全流程通知
✅ 控制台打印完整错误堆栈，方便排错
