const STORAGE_KEY = "lesson3-progress";
const TAB_COUNT = 8;
const ANIMATION_SPEED = { fast: 200, medium: 500, slow: 900, typing: 600, agent: 1200 };
const TAB_FILES = {
  t0: "tabs/t0-models.html",
  t1: "tabs/t1-code.html",
  t2: "tabs/t2-workflow.html",
  t3: "tabs/t3-creative.html",
  t4: "tabs/t4-agent.html",
  t5: "tabs/t5-concepts.html",
  t6: "tabs/t6-devflow.html",
  t7: "tabs/t7-sideproject.html"
};
const MODEL_PRICING = {
  flagship: { input: 15, output: 75 },
  workhorse: { input: 3, output: 15 },
  speed: { input: 0.25, output: 1.25 }
};
const SPECTRUM_DATA = [
  { level: "Lv.1", type: "ChatBot", product: "ChatGPT 基本版", desc: "每步都要你下指令，AI 只回答不動手。最安全但最累。", risk: 20 },
  { level: "Lv.2", type: "Tool-using LLM", product: "GPT with Plugins", desc: "你問問題，AI 自己決定要不要呼叫工具。你審核工具結果。", risk: 35 },
  { level: "Lv.3", type: "Agent", product: "Claude Code / Cursor Agent", desc: "給目標就好。AI 自己規劃、執行、驗證。你看最終報告。", risk: 55 },
  { level: "Lv.4", type: "Multi-Agent", product: "CrewAI / AutoGen", desc: "多個 Agent 組隊分工。你設定團隊角色和目標，它們自己協調。", risk: 75 },
  { level: "Lv.5", type: "Autonomous Agent", product: "Hermes / Devin", desc: "設定完就放手。Agent 長期運行、自己學新技能、跨平台工作。", risk: 95 }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const escapeHtml = str => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { tabs: [], quizScores: {}, lastTab: "t0" }; }
  catch { return { tabs: [], quizScores: {}, lastTab: "t0" }; }
}
function saveProgress(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }

const progress = loadProgress();
const tabCache = {};

const tipData = {
  "hover-rule": { title: "Hover 互動", plain: "把滑鼠移到任何點點底線的詞上面，會跳出黑色卡片解釋。", example: "像現在這樣 :)", why: "白話 + 例子 + 為什麼重要——三層解釋，看完就懂。" },
  "ide-style": { title: "IDE 整合派", plain: "AI 工具住在你的程式編輯器裡，邊寫邊問邊改。", example: "Cursor、Windsurf、GitHub Copilot 都是這派。", why: "適合『一邊寫一邊雕』的場景，能即時看程式碼變化，控制感最高。" },
  "cli-style": { title: "CLI Agent 派", plain: "AI 工具住在你的終端機，你給它任務它自己做完。", example: "Claude Code、Aider、OpenAI Codex CLI 都是這派。", why: "適合『整包丟給它』的任務，不用一直盯著它寫每一行，但要學會描述任務。" },
  "terminal": { title: "終端機 (Terminal)", plain: "黑底白字、用打字操作電腦的視窗。Mac 是 Terminal，Windows 是 PowerShell/cmd。", example: "你看過電影裡駭客打 code 那種畫面，就是這個。", why: "工程師日常工具。會用 CLI 等於會用『電腦的後門』，能做的事比 GUI 多很多。" },
  "cc-agentic": { title: "Agentic Loop", plain: "Agent 收到指令後，自動拆解子任務、呼叫工具、評估結果、循環直到完成。", example: "你說『重構這檔案』→ 它自己讀檔、規劃、改碼、跑測試、修 bug，全自動。", why: "這是 Claude Code 跟普通聊天機器人最大的差異——它會自己 loop 到完成。" },
  "cc-context": { title: "Context Engineering", plain: "自動讀取 CLAUDE.md、相關檔案、git history，組裝最佳上下文。", example: "你沒貼任何程式碼，但它自己去翻 git log 看最近改了什麼。", why: "好的 context = 好的回答。自動收集比你手動貼精準且完整。" },
  "cc-permission": { title: "Permission System", plain: "改檔案前會先問你同意；accept_edits 模式可自動接受。", example: "它說『要改 utils.py 第 30 行，可以嗎？』你按 Y 才改。", why: "安全閥。新手建議開，熟了再用 accept_edits 加速。" },
  "cc-remote": { title: "Remote Control", plain: "Claude Code 在電腦跑，你用手機 web 介面看進度、給指令。", example: "通勤時用手機補一句『順便加單元測試』，回家就改好了。", why: "AI 任務通常要 5-30 分鐘，不用一直坐在電腦前等。" },
  "cc-cloud": { title: "Cloud Agents", plain: "Claude Code 直接在 Anthropic 的雲端跑，不是你電腦。", example: "晚上下指令『跑完這 20 個任務』，關電腦睡覺，早上看結果。", why: "解放你本機算力，也能跑超長任務不怕電腦休眠。" },
  "cc-skills": { title: "Skills 系統", plain: "把專業知識封進資料夾，需要時 AI 自己讀。", example: "做完一次完美的週報後寫成 Skill，下次說『寫週報』它就用一樣格式。", why: "讓 AI 真的『懂你的領域』，而不是每次都從零教它。" },
  "cc-mcp": { title: "MCP 連結器", plain: "讓 Claude Code 能直接讀 Gmail、Drive、Slack 這些外部工具。", example: "說『讀我 Drive 那份規格，照著實作』，它真的會打開 Drive 讀。", why: "不用複製貼上、不用截圖，AI 直接接到你的工作環境。" },
  "cc-subagent": { title: "Sub-agent", plain: "把大任務拆成幾個小 Agent 同時跑，互不干擾。", example: "『同時做這 3 個功能』→ 三個 sub-agent 各做一個，做完再合起來。", why: "速度快，而且每個 sub-agent 用獨立 context，不會互相干擾。" },
  "cur-tab": { title: "Tab 自動補全", plain: "你打字到一半按 Tab，AI 把整段補完。比 Copilot 更敢猜。", example: "你寫到 function calc，按 Tab 它直接寫完整個 calculate 函數。", why: "輸入速度 3-5 倍，但要學會『不要全收』，只收對的。" },
  "cur-cmd": { title: "Cmd+K / Ctrl+K", plain: "選一段程式碼按 Cmd+K，輸入指令叫 AI 改這段。", example: "選一個函數按 Cmd+K，打『加 try-catch』，它就只改那段。", why: "比起『重寫整個檔案』，能精準修改範圍更安全。" },
  "cur-composer": { title: "Composer 2", plain: "Cursor 3 的多檔協作面板，能同時改多個檔案。", example: "說『把 user 改成 customer』，它會掃所有檔案一次改完。", why: "重構類任務本來就跨檔，一檔一檔改容易漏。" },
  "cur-agent": { title: "Agents Window", plain: "Cursor 3 新功能：給目標讓 Agent 自己跑，可以本地或雲端。", example: "『實作這個 issue』→ Agent 自己讀 issue、寫程式、跑測試。", why: "從『AI 副駕駛』升級到『AI 自主開發』。" },
  "cur-bugbot": { title: "Bugbot", plain: "你開 PR 時自動跳出來審查，找 bug 和品質問題。", example: "PR 開了 30 秒後 Bugbot 留言：『這裡少了 null check』。", why: "等同免費的 senior code reviewer，PR 進 main 前多一道濾網。" },
  "cur-design": { title: "Design Mode", plain: "直接在 UI 上點選元素就能編輯樣式和內容，所見即所得。", example: "點一個按鈕 → 直接改顏色、文字、間距，不用翻 code。", why: "非工程師也能微調 UI；工程師省掉『找這個元素在哪』的時間。" },
  "rcaf-r": { title: "R · Role 角色", plain: "告訴 AI 它是誰、用什麼立場回答。", example: "『你是資深前端工程師』vs 沒講——回答風格差很多。", why: "鎖定 AI 的口吻、深度、慣用詞，省掉一堆來回追問。" },
  "rcaf-c": { title: "C · Context 背景", plain: "把 AI 不知道的背景講清楚——專案是什麼、目標、限制。", example: "『這是一個給長輩用的 app，按鈕要大』vs 不講——出來的東西完全不同。", why: "AI 不會通靈，背景越清楚答案越貼。" },
  "rcaf-a": { title: "A · Action 任務", plain: "明確說你要它做什麼，動詞開頭。", example: "『列出 5 個方案』比『有什麼方案』精準。", why: "模糊指令 → 模糊回答。動詞 + 數量 + 對象，三個都要有。" },
  "rcaf-f": { title: "F · Format 格式", plain: "講你要什麼樣式的輸出——表格、清單、程式碼、JSON。", example: "『用 Markdown 表格』vs 沒講——可能寫一坨段落要你自己整理。", why: "省掉『再幫我整理成表格』的二次來回。" },
  "n8n-node": { title: "節點 (Node)", plain: "n8n 工作流的最小單位。每個節點做一件事——讀資料、發 email、呼叫 API。", example: "「讀 Google Sheet」是一個節點，「寄信」是另一個節點。", why: "節點化讓非工程師也能組裝邏輯，把線條連對就會動。" },
  "n8n-trigger": { title: "Trigger 觸發節點", plain: "Workflow 的起點，決定『什麼時候觸發』。", example: "Webhook 收到請求、定時、收到 email、Slack 訊息——都能當 trigger。", why: "Workflow 必須有人按開關才會跑，trigger 就是那個開關。" },
  "n8n-action": { title: "Action 動作節點", plain: "做事的節點——讀寫資料、呼叫 API、運算。", example: "讀 Sheet、發 Slack、查資料庫、轉檔案格式都是 action。", why: "Trigger 之後 workflow 真正『做事』的部分都在 action。" },
  "n8n-aiagent": { title: "AI Agent 節點", plain: "n8n 內建的 LLM 節點，可以塞進 workflow 裡做判斷或生成。", example: "客服信進來 → AI Agent 判斷類別 + 寫回覆 → 寄出。", why: "讓 workflow 從『純規則』升級到『會判斷』，能處理非結構化文字。" },
  "n8n-output": { title: "Output 輸出節點", plain: "Workflow 的終點，把結果送到外部——email、Slack、資料庫。", example: "判斷完的回覆寄信、處理完的資料寫回 Sheet。", why: "再厲害的 workflow 沒有輸出等於沒做事。" },
  "n8n-cost": { title: "成本比較", plain: "n8n 自架免費（只付主機費），Zapier 按 task 收費很快就貴。", example: "每月 5000 次執行：n8n ~$5（VPS），Zapier ~$50+。", why: "學生、小團隊用 n8n 省非常多，而且不被平台綁住。" },
  "agent-chatmodel": { title: "Chat Model", plain: "Agent 的大腦——一個 LLM，可以選 GPT-4、Claude、本地 Llama。", example: "便宜任務用 Haiku、複雜任務用 Opus，依場景換。", why: "Agent 的智商和成本就看這顆模型，可換才有彈性。" },
  "agent-memory": { title: "Memory", plain: "讓 Agent 記得跟同一使用者之前的對話。", example: "用戶昨天說自己叫小美，今天再來 Agent 直接喊『小美你好』。", why: "沒有 memory，Agent 永遠是金魚腦，每次都從零開始。" },
  "agent-tools": { title: "Tools", plain: "Agent 能呼叫的外部能力——查網路、寄信、跑計算、查資料庫。", example: "問『明天天氣』→ Agent 自己呼叫天氣 API → 回答。", why: "沒 tools 的 Agent 只能聊天；有 tools 才能真的做事。" },
  "agent-parser": { title: "Output Parser", plain: "把 LLM 的自然語言輸出轉成結構化資料（JSON、欄位）。", example: "LLM 寫一段話 → Parser 抽出『類別=投訴, 緊急度=高』。", why: "後面節點需要結構化資料才能處理，Parser 是橋樑。" },
  "sd-process": { title: "Stable Diffusion 繪圖過程", plain: "AI 從一張全是雜訊的圖開始，一步步『去噪』，最後變成你要的圖。", example: "想成米開朗基羅那句話：『雕像本來就在石頭裡，我只是把不要的部分去掉。』", why: "懂這個過程，才能知道為什麼可以用 ControlNet、LoRA 在某個階段介入。" },
  "comfy-checkpoint": { title: "Checkpoint（模型檔）", plain: "整個 AI 的『大腦本體』，包含 UNet+CLIP+VAE 三大元件，通常 2-7GB。", example: "SD 1.5、SDXL、Flux、Pony Diffusion 都是不同的 checkpoint。", why: "Checkpoint 決定畫風基底——寫實、動漫、油畫風格從這裡選。" },
  "comfy-clip": { title: "CLIP Text Encode", plain: "把你的文字 prompt 翻譯成 AI 看得懂的『向量』。", example: "「a cat in space」→ 一串 768 維的數字向量。", why: "AI 不懂文字，只懂數字。CLIP 是文字進 AI 的門口。" },
  "comfy-latent": { title: "Latent（潛在空間）", plain: "AI 不直接畫像素，先在壓縮過的空間畫（比像素小 48 倍），最後再還原。", example: "想成草圖階段——先在小張草稿紙畫，最後才放大成正式畫。", why: "在 latent 算比直接算像素快數十倍，這就是 SD 能在家用顯卡跑的關鍵。" },
  "comfy-ksampler": { title: "KSampler（採樣器）", plain: "真正『畫圖』的節點。從雜訊一步步去噪，畫成你要的東西。", example: "Steps=20 就是去噪 20 次；CFG 控制有多聽 prompt 的話。", why: "整個 pipeline 最重要的節點。也是吃時間和 GPU 的大頭。" },
  "comfy-vae": { title: "VAE Decode", plain: "把 latent（壓縮空間）的結果還原成真正的像素圖。", example: "latent 算完是個 64×64 的矩陣，VAE 把它變成 512×512 的圖。", why: "沒 VAE 就只能看 latent 的鬼影。VAE 是出口的翻譯官。" },
  "comfy-lora": { title: "LoRA", plain: "輕量級的『風格外掛』，可以微調 checkpoint 但不用換整個模型。", example: "想畫指定角色 → 載入該角色 LoRA → 套用，幾秒就好。", why: "Checkpoint 幾 GB，LoRA 幾十 MB——可以混搭多個風格而不爆顯卡。" },
  "comfy-controlnet": { title: "ControlNet", plain: "用一張圖控制構圖——姿勢、深度、邊緣輪廓都能照搬。", example: "丟一張 V 字手勢的圖 → 生出來的人物會一樣 V 字手勢。", why: "純文字描述構圖很難，ControlNet 讓你『看圖辦事』。" },
  "comfy-ipadapter": { title: "IP-Adapter", plain: "用一張圖當『風格 prompt』。", example: "想要某張畫的色調？丟給 IP-Adapter，它會把那種風格套到新圖上。", why: "比文字描述風格精準，組合型風格能複製。" },
  "comfy-upscale": { title: "Upscale 放大", plain: "把生成的小圖放大成高解析度。", example: "512×512 生成 → 用 ESRGAN 放大到 2048×2048。", why: "直接生 2K 太吃顯卡也容易壞圖；先生小再放大穩定多了。" },
  "agent-loop": { title: "循環推理", plain: "Agent 不是一次回答完就結束，是『想 → 做 → 看結果 → 再想』反覆做到目標達成。", example: "查天氣失敗 → 換工具再查 → 還是失敗 → 跟使用者說對不起。", why: "這個 loop 是 Agent 跟普通 LLM 最大差異——能自我修正。" },
  "react": { title: "ReAct", plain: "Reasoning + Acting 的縮寫。先推理再行動，行動完看結果再推理。", example: "Thought：要查天氣 → Action：呼叫 weather API → Observation：明天下雨。", why: "現代幾乎所有 Agent 框架（LangChain、AutoGen）都基於這個。" },
  "agent-brain": { title: "Brain (LLM)", plain: "Agent 的推理核心，決定下一步做什麼。", example: "GPT-4、Claude、Gemini 等任何 LLM 都能當 brain。", why: "Brain 的智商決定 Agent 的智商上限。但 brain 也是最貴的部分。" },
  "agent-mem-comp": { title: "Memory 記憶", plain: "短期記憶：這次對話。長期記憶：跨對話的事實、偏好。", example: "短期：剛剛說 A → 接著用 A。長期：使用者偏好 → 永遠記得。", why: "沒記憶的 Agent = 失憶症患者，每次都要重新介紹自己。" },
  "agent-tools-comp": { title: "Tool Belt", plain: "Agent 能呼叫的外部工具列表——搜尋、寄信、跑 code、查資料庫。", example: "工具腰帶上掛越多東西能力越強，但選錯工具會出事。", why: "Tools 決定 Agent 能在真實世界做什麼，光想沒用要能動手。" },
  "agent-vs-chatbot": { title: "Agent vs ChatBot", plain: "ChatBot 你問一句答一句；Agent 給目標自己跑到完成。", example: "ChatBot：『天氣如何？』→ 回答。Agent：『明天下雨就提醒我』→ 自己查+自己通知。", why: "理解這個差異才知道什麼任務該用哪種。" },
  "agent-spectrum": { title: "自主程度光譜", plain: "從完全手動到完全自主，中間有很多層次。", example: "Tab 補全(低自主) → Cmd+K(中) → Agent(高) → 全自動(最高)。", why: "不是越自主越好，要看任務風險和你的信任程度選對層級。" },
  "mcp-host": { title: "Host", plain: "你直接互動的 AI 介面。", example: "Claude Desktop、Cursor、Claude Code 都是 host。", why: "Host 統一介面，外面的 server 怎麼接它都不用改。" },
  "mcp-client": { title: "Client", plain: "Host 內部負責跟一個 MCP Server 講話的小模組。", example: "Claude Desktop 同時開 Slack server 和 Notion server，就有兩個 client。", why: "Client 把網路通訊細節包起來，Host 不用管 protocol 細節。" },
  "mcp-server": { title: "Server", plain: "提供能力的那一方——可以是 SaaS、本地工具、自家資料庫。", example: "Slack 官方 MCP server、自己寫的內部 wiki MCP server。", why: "工具方寫一次 server，所有 host 都能用——不用為每個 AI 重寫。" },
  "mcp-tools": { title: "Tools 工具", plain: "Server 提供的『可執行動作』。", example: "send_message、create_issue、query_database。", why: "Agent 能不能做事看 tools 開了多少。" },
  "mcp-resources": { title: "Resources 資源", plain: "Server 提供的『可讀取資料』。", example: "讀檔案、讀某個 API 的 endpoint。", why: "讓 AI 能查上下文，不用每次都複製貼上。" },
  "mcp-prompts": { title: "Prompts 提示模板", plain: "Server 預先寫好的提示模板。", example: "Slack server 提供「總結頻道」的 prompt 範本。", why: "標準化常用任務，使用者不用每次重寫 prompt。" },
  "mcp-stdio": { title: "stdio 傳輸", plain: "透過標準輸入/輸出跟 MCP Server 溝通，適合本地工具。", example: "Claude Code 啟動一個本地 process，透過 stdin/stdout 傳 JSON。", why: "本地用最簡單，不用開 port、不用網路設定。" },
  "mcp-http": { title: "HTTP/SSE 傳輸", plain: "透過 HTTP + Server-Sent Events 溝通，適合遠端 server。", example: "雲端的 Slack MCP server 用 HTTPS 接收請求，SSE 推送結果。", why: "遠端部署必備，可以跨網路、加驗證、多人共用。" },
  "mcp-jsonrpc": { title: "JSON-RPC 2.0", plain: "MCP 底層用的通訊格式——標準化的請求/回應 JSON。", example: '{"jsonrpc":"2.0","method":"tools/call","params":{...},"id":1}', why: "用成熟標準，任何語言都能實作 client 或 server。" },
  "skill-cross": { title: "跨平台 Skill", plain: "同一份 Skill 資料夾，可以同時被 Claude Code、Cursor、Codex 讀。", example: "你公司寫的「報告格式 Skill」一份檔案多家工具共用。", why: "避免每家工具一套——選工具的成本變低。" },
  "skill-md": { title: "SKILL.md", plain: "Skill 的入口檔，第一行寫『什麼時候該用這個 skill』。", example: "「當使用者要寫週報時，使用此 skill。包含格式、範例、輔助腳本。」", why: "AI 看這個檔決定要不要用 → 寫得清楚才會被觸發。" },
  "skill-scripts": { title: "scripts/", plain: "輔助腳本——Python、shell、JS 都行。", example: "週報 Skill 裡有個 extract_metrics.py，從 GitHub 抓本週 commit 統計。", why: "把 AI 不擅長的『精確計算』交給程式做，AI 只負責編排。" },
  "skill-refs": { title: "references/", plain: "詳細參考資料，需要時 AI 才讀。", example: "公司詳細的編碼規範、客戶資料 schema 放這裡。", why: "比 SKILL.md 更深的細節，避免主檔太長。" },
  "skill-l1": { title: "L1 · Metadata", plain: "永遠載入的最少資訊——只有 skill 名字 + 觸發條件。", example: "~50 字，告訴 AI『有這個 skill 存在』。", why: "成本超低，就算十幾個 skill 一起載也沒事。" },
  "skill-l2": { title: "L2 · SKILL.md", plain: "AI 決定要用這個 skill 後才完整讀。", example: "幾 K token，包含怎麼做、範例、注意事項。", why: "只在『真的要用時』才付這個成本，省 token。" },
  "skill-l3": { title: "L3 · 深層檔案", plain: "scripts/、references/、assets/——AI 真的需要才開。", example: "做到一半發現要查規範，才打開 references/coding-style.md。", why: "三層設計就是『按需付費』，跟 lazy loading 同樣概念。" },
  "hermes-mem": { title: "持久記憶", plain: "Hermes 用本地資料庫存記憶，不會像 ChatGPT 每段對話清空。", example: "你跟 Hermes 講你叫 Paul，三個月後它還記得。", why: "真正能『陪你成長』的 Agent，需要記得歷史。" },
  "hermes-skill": { title: "自動 Skill 生成", plain: "Hermes 學會做某事後，會自動寫成 Skill 給未來的自己用。", example: "教它一次怎麼整理週報 → 寫成 weekly-report skill → 之後直接用。", why: "從『AI 是工具』變成『AI 是會自學的助手』，越用越強。" },
  "hermes-gateway": { title: "多平台 Gateway", plain: "同一個 Hermes 能在 Discord、Slack、Web、Telegram 同時出現。", example: "Discord 跟它聊的事，Slack 還記得；它認得是同一個你。", why: "Agent 的人格和記憶跨平台，不用每個平台重新訓練。" },
  "workflow-review": { title: "人工審查", plain: "AI 產出的東西一定要人看過才上線，不能盲信。", example: "AI 寫完 code → 你 review → 確認沒問題 → 才 merge。", why: "AI 會犯錯，而且犯的錯常常是『看起來對但邏輯錯』，不審查很危險。" },
  "workflow-decompose": { title: "任務拆解", plain: "把大任務拆成小步驟，每步交給 AI 做比一次丟整個任務好。", example: "『做一個完整網站』→ 拆成：設計 → 前端 → 後端 → 測試，逐步完成。", why: "小任務 AI 準確率高；大任務一次丟容易跑偏又難修正。" }
};

// ═══════ TOOLTIP SYSTEM ═══════
const tooltipEl = document.createElement("div");
tooltipEl.className = "rich-tooltip";
document.body.appendChild(tooltipEl);

function showTooltip(target) {
  const key = target.dataset.tipKey;
  const d = tipData[key];
  if (!d) return;
  tooltipEl.innerHTML = `<div class="rt-title">${d.title}</div><div class="rt-text">${d.plain}</div>${d.example ? `<div class="rt-section"><div class="rt-label">EXAMPLE</div><div class="rt-text">${d.example}</div></div>` : ""}${d.why ? `<div class="rt-section"><div class="rt-label">WHY IT MATTERS</div><div class="rt-text">${d.why}</div></div>` : ""}`;
  positionTooltip(target);
  requestAnimationFrame(() => tooltipEl.classList.add("visible"));
}

function positionTooltip(target) {
  const rect = target.getBoundingClientRect();
  tooltipEl.style.left = "0px";
  tooltipEl.style.top = "0px";
  tooltipEl.style.display = "block";
  const tipRect = tooltipEl.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  let top = rect.top - tipRect.height - 12;
  if (top < 10) top = rect.bottom + 12;
  if (left < 10) left = 10;
  if (left + tipRect.width > window.innerWidth - 10) left = window.innerWidth - tipRect.width - 10;
  tooltipEl.style.left = left + "px";
  tooltipEl.style.top = top + "px";
}

function hideTooltip() { tooltipEl.classList.remove("visible"); }

document.addEventListener("mouseover", e => { const t = e.target.closest(".tip"); if (t) showTooltip(t); });
document.addEventListener("mouseout", e => { const t = e.target.closest(".tip"); if (t) hideTooltip(); });
window.addEventListener("scroll", hideTooltip);
window.addEventListener("resize", hideTooltip);

// ═══════ READING PROGRESS BAR ═══════
const readingBar = document.getElementById("progressBar");
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (readingBar) readingBar.style.width = pct + "%";
});

// ═══════ PROGRESS INDICATOR ═══════
function updateProgressIndicator() {
  let indicator = document.getElementById("progressIndicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "progressIndicator";
    indicator.style.cssText = "position:fixed;bottom:16px;right:16px;background:var(--ink);color:var(--paper);padding:8px 14px;font-family:'JetBrains Mono',monospace;font-size:11px;z-index:200;border:2px solid var(--accent);box-shadow:3px 3px 0 var(--accent);";
    document.body.appendChild(indicator);
  }
  const totalTabs = document.querySelectorAll(".tab-btn").length;
  indicator.textContent = `${progress.tabs.length}/${totalTabs} tabs`;
}

// ═══════ DYNAMIC TAB LOADING ═══════
async function loadTabContent(tabId) {
  if (tabCache[tabId]) return;
  const panel = document.getElementById(tabId);
  if (!panel) return;
  const file = TAB_FILES[tabId];
  if (!file) return;
  panel.innerHTML = '<div class="tab-loading"><div class="loading-spinner"></div><span>載入中...</span></div>';
  try {
    const resp = await fetch(file);
    if (!resp.ok) throw new Error(resp.status);
    panel.innerHTML = await resp.text();
    tabCache[tabId] = true;
    initTab(tabId);
  } catch (err) {
    panel.innerHTML = `<div class="tab-loading"><span>載入失敗 (${err.message})</span></div>`;
  }
}

// ═══════ TAB SYSTEM ═══════
function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (btn) btn.classList.add("active");
  const panel = document.getElementById(tabId);
  if (panel) panel.classList.add("active");
  if (!progress.tabs.includes(tabId)) progress.tabs.push(tabId);
  progress.lastTab = tabId;
  saveProgress(progress);
  updateProgressIndicator();
  loadTabContent(tabId);
  const bar = document.querySelector(".tab-nav");
  if (bar) window.scrollTo({ top: bar.offsetTop - 100, behavior: "smooth" });
}

document.querySelectorAll(".tab-btn").forEach(tab => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

// ═══════ ACCORDION (EVENT DELEGATION) ═══════
document.addEventListener("click", e => {
  const trigger = e.target.closest(".accordion-trigger");
  if (!trigger) return;
  const content = trigger.nextElementSibling;
  if (!content || !content.classList.contains("accordion-content")) return;
  const isOpen = content.classList.contains("open");
  if (isOpen) {
    content.style.maxHeight = content.scrollHeight + "px";
    requestAnimationFrame(() => { content.style.maxHeight = "0"; });
    content.classList.remove("open");
    trigger.classList.remove("open");
  } else {
    content.classList.add("open");
    trigger.classList.add("open");
    content.style.maxHeight = content.scrollHeight + "px";
    content.addEventListener("transitionend", function handler() {
      if (content.classList.contains("open")) content.style.maxHeight = "none";
      content.removeEventListener("transitionend", handler);
    });
  }
});

// ═══════ SCROLL REVEAL ═══════
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("visible"); });
}, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

function observeReveals(root) {
  (root || document).querySelectorAll(".reveal:not(.visible)").forEach(el => revealObserver.observe(el));
}

// ═══════ QUIZ SYSTEM (reusable) ═══════
function initQuiz(container, scenarios, storagePrefix) {
  const promptEl = container.querySelector(".scenario-prompt");
  const fbEl = container.querySelector(".scenario-feedback");
  const optsEl = container.querySelector(".scenario-options");
  const counterEl = container.querySelector(".scenario-counter");
  const nextBtn = container.querySelector(".scenario-next");
  const prevBtn = container.querySelector(".scenario-prev");
  if (!promptEl || !optsEl) return;
  let current = 0;

  function render() {
    const s = scenarios[current];
    promptEl.innerHTML = s.prompt;
    if (fbEl) fbEl.classList.remove("show");
    optsEl.innerHTML = "";
    s.options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "scenario-option";
      b.textContent = opt.text;
      b.onclick = () => {
        optsEl.querySelectorAll(".scenario-option").forEach((el, j) => {
          el.classList.add(s.options[j].correct ? "correct" : "wrong");
        });
        if (fbEl) {
          fbEl.innerHTML = `<span class="fb-label">${opt.correct ? "CORRECT" : "NOT QUITE"}</span>${opt.fb}`;
          fbEl.classList.add("show");
        }
        if (opt.correct) { progress.quizScores[storagePrefix + current] = true; saveProgress(progress); }
      };
      optsEl.appendChild(b);
    });
    if (counterEl) counterEl.textContent = `${current + 1} / ${scenarios.length}`;
  }

  if (nextBtn) nextBtn.onclick = () => { current = (current + 1) % scenarios.length; render(); };
  if (prevBtn) prevBtn.onclick = () => { current = (current - 1 + scenarios.length) % scenarios.length; render(); };
  render();
}

// ═══════ TAB INIT DISPATCHER ═══════
function initTab(tabId) {
  const panel = document.getElementById(tabId);
  if (!panel) return;
  panel.querySelectorAll(".accordion-content").forEach(el => {
    if (!el.style.maxHeight) {
      el.style.maxHeight = "0";
      el.style.overflow = "hidden";
      el.style.transition = "max-height 0.35s ease";
    }
  });
  observeReveals(panel);
  const initMap = { t0: initT0, t1: initT1, t2: initT2, t3: initT3, t4: initT4, t5: initT5, t6: initT6, t7: initT7 };
  if (initMap[tabId]) initMap[tabId](panel);
}

// ═══════ T0: MODELS ═══════
function initT0(panel) {
  if (panel.dataset.init) return;
  panel.dataset.init = "1";

  panel.querySelectorAll(".tier-card").forEach(card => {
    card.addEventListener("click", () => {
      const wasExpanded = card.classList.contains("expanded");
      panel.querySelectorAll(".tier-card.expanded").forEach(c => c.classList.remove("expanded"));
      if (!wasExpanded) card.classList.add("expanded");
    });
  });

  const modelOptions = panel.querySelectorAll(".model-option");
  const recPanel = panel.querySelector(".model-recommendation");
  modelOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      modelOptions.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      if (recPanel) { recPanel.innerHTML = opt.dataset.rec || ""; recPanel.classList.add("show"); }
    });
  });

  const calcInputs = panel.querySelectorAll(".calc-input");
  const calcResult = panel.querySelector(".calc-result");
  calcInputs.forEach(input => {
    input.addEventListener("input", () => {
      const tier = panel.querySelector(".calc-tier")?.value || "workhorse";
      const tokensPerDay = parseInt(panel.querySelector(".calc-tokens")?.value) || 0;
      const daysPerMonth = parseInt(panel.querySelector(".calc-days")?.value) || 20;
      const pricing = MODEL_PRICING[tier];
      const monthlyCost = ((tokensPerDay * daysPerMonth) / 1000000) * ((pricing.input + pricing.output) / 2);
      if (calcResult) calcResult.textContent = `\u2248 $${monthlyCost.toFixed(2)} / \u6708`;
    });
  });

  const reasonBtn = panel.querySelector(".reasoning-play");
  const reasonOutput = panel.querySelector(".reasoning-output");
  if (reasonBtn && reasonOutput) {
    reasonBtn.addEventListener("click", async () => {
      reasonBtn.disabled = true;
      reasonOutput.innerHTML = "";
      const tokens = ["\u5206\u6790\u554f\u984c\u7d50\u69cb...", "\u8003\u616e\u908a\u754c\u60c5\u6cc1...", "\u9a57\u8b49\u5047\u8a2d...", "\u63a8\u5c0e\u6700\u4f73\u65b9\u6848..."];
      for (const token of tokens) {
        const span = document.createElement("span");
        span.className = "thinking-token";
        span.textContent = token + " ";
        reasonOutput.appendChild(span);
        await sleep(ANIMATION_SPEED.slow);
      }
      const answer = document.createElement("div");
      answer.className = "reasoning-answer";
      answer.textContent = "\u2192 \u7d50\u8ad6\uff1a\u4f7f\u7528 Dynamic Programming \u53ef\u4ee5\u5c07\u6642\u9593\u8907\u96dc\u5ea6\u5f9e O(2^n) \u964d\u5230 O(n\u00b2)";
      reasonOutput.appendChild(answer);
      reasonBtn.disabled = false;
    });
  }
}

// ═══════ T1: CODE ═══════
const SCENARIOS_T1 = [
  { prompt: "你接到一個任務：『把這個 800 行的舊 Python 檔重構成模組化的設計，並加上完整單元測試。』你會用哪個工具？", options: [
    { text: "Cursor — 一邊看一邊改", correct: false, fb: "可以但不是最佳。Cursor 適合互動雕琢，但 800 行重構任務範圍大、目標明確、可以批次處理——交給 CLI Agent 自己跑更省時間。" },
    { text: "Claude Code — 整包丟給它", correct: true, fb: "✓ 對。大型範圍 + 目標明確 + 可批次驗證（測試）的任務，最適合 CLI Agent。" },
    { text: "ChatGPT — 複製貼上問", correct: false, fb: "千萬不要。ChatGPT 看不到你整個專案、看不到依賴、看不到 import——重構必出 bug。" }
  ]},
  { prompt: "你正在寫一個 React component，有個函數寫到一半想要 AI 幫你加上錯誤處理。你會用？", options: [
    { text: "Cursor 的 Cmd+K", correct: true, fb: "✓ 對。範圍小 + 在編輯當下 + 即時可見，正是 Cursor Cmd+K 的甜蜜點。" },
    { text: "Claude Code 跑 agent", correct: false, fb: "殺雞用牛刀。Agent 適合長任務，這種小範圍快速雕琢，IDE 整合更快。" },
    { text: "Tab 自動補全", correct: false, fb: "Tab 是『我打它補』。這題是『指定方向叫它改一段』——要用 Cmd+K。" }
  ]},
  { prompt: "你想學一個完全沒寫過的新框架（例如 Rust）。你會用 AI 工具嗎？怎麼用？", options: [
    { text: "讓 AI 直接幫我寫完，我複製就好", correct: false, fb: "✗ 大忌。學新東西最忌『跳過理解』。" },
    { text: "我自己寫，遇到不懂才問 AI 解釋", correct: true, fb: "✓ 對。學習階段 AI 是『字典 + 解題輔助』，不是『代寫』。" },
    { text: "完全不用 AI，自己摸索最扎實", correct: false, fb: "卡住時用 AI 解釋觀念、debug 錯誤訊息——比翻 10 篇 Stack Overflow 快太多。" }
  ]},
  { prompt: "前端頁面有個按鈕顏色不對、間距太寬，你想快速調整 UI 細節。最適合的工具？", options: [
    { text: "Cursor Design Mode", correct: true, fb: "✓ 對。Design Mode 所見即所得，微調 UI 最直覺。" },
    { text: "Claude Code CLI", correct: false, fb: "CLI 適合邏輯重的任務，單純調 CSS 間距用 Design Mode 更快。" },
    { text: "手動開 DevTools 改", correct: false, fb: "可以但改完還要回去找 code。Design Mode 一步到位。" }
  ]},
  { prompt: "你要從零建立一個完整的 CI/CD pipeline。最佳工具？", options: [
    { text: "Cursor Composer", correct: false, fb: "Composer 擅長跨檔案重構，但 CI/CD 涉及實際跑指令驗證。" },
    { text: "Claude Code CLI", correct: true, fb: "✓ 對。CI/CD 需要讀結構、寫設定、跑指令驗證——CLI Agent 最適合。" },
    { text: "ChatGPT 問範例再自己改", correct: false, fb: "CI/CD 跟專案結構高度耦合，通用範例很難直接用。" }
  ]},
  { prompt: "你的專案有多個 repo，需要協調修改跨 repo 的 interface。最佳工具？", options: [
    { text: "Cursor multi-root workspace", correct: true, fb: "✓ 對。Cursor 支援 multi-root workspace，跨 repo 重構最方便。" },
    { text: "Claude Code 一個一個 repo 處理", correct: false, fb: "可以但容易不同步。" },
    { text: "手動在每個 repo 分別改", correct: false, fb: "最容易出錯。interface 對不上就 runtime error。" }
  ]}
];

const PROMPT_EXAMPLES = {
  bad: { input: "幫我寫個登入功能", output: "// AI 沒辦法判斷背景，會給你最通用的版本：\n\nfunction login(username, password) {\n  if (username && password) { return true; }\n  return false;\n}\n\n⚠️ 問題：框架？後端？加密？錯誤處理？\n... 你還要再來回問 5 次才能用" },
  good: { input: "[R] 你是資深 React 工程師。\n[C] Next.js 14 + TypeScript + Supabase Auth\n[A] 寫 LoginForm.tsx：表單驗證(zod)、loading、錯誤顯示、redirect\n[F] TypeScript + Tailwind，附 3 句設計重點。", output: "// app/login/LoginForm.tsx\n'use client';\nimport { useState } from 'react';\nimport { z } from 'zod';\n...\n✓ 一次到位，可以直接用。" }
};

const TERMINAL_SCRIPT = [
  { type: "thinking", text: "⏳ Reading project structure..." },
  { type: "tool", text: '🔧 Tool: list_files("src/")' },
  { type: "result", text: "   → utils.py (847 lines), main.py, config.py" },
  { type: "thinking", text: "⏳ Analyzing utils.py for module boundaries..." },
  { type: "tool", text: '🔧 Tool: read_file("src/utils.py")' },
  { type: "result", text: "   → Found 3 logical groups: string_utils, math_utils, file_utils" },
  { type: "thinking", text: "⏳ Creating module files..." },
  { type: "tool", text: '🔧 Tool: write_file("src/string_utils.py")' },
  { type: "result", text: "   → ✓ Created (12 functions, 156 lines)" },
  { type: "tool", text: '🔧 Tool: write_file("src/math_utils.py")' },
  { type: "result", text: "   → ✓ Created (8 functions, 203 lines)" },
  { type: "tool", text: '🔧 Tool: write_file("src/file_utils.py")' },
  { type: "result", text: "   → ✓ Created (15 functions, 488 lines)" },
  { type: "thinking", text: "⏳ Running tests to verify..." },
  { type: "tool", text: '🔧 Tool: run_command("python -m pytest")' },
  { type: "result", text: "   → ✓ 47 passed, 0 failed" },
  { type: "result", text: "✅ Done! Refactored utils.py → 3 modules. All tests pass." }
];

const TYPING_SCRIPT = [
  { typed: "def ", ghost: "", pause: 300 },
  { typed: "def calculate_", ghost: "total(items: list[dict]) -> float:", pause: 600 },
  { typed: "def calculate_total(items: list[dict]) -> float:", ghost: "", pause: 200, tab: true },
  { typed: "def calculate_total(items: list[dict]) -> float:\n    ", ghost: 'total = sum(item["price"] * item["qty"] for item in items)', pause: 700 },
  { typed: 'def calculate_total(items: list[dict]) -> float:\n    total = sum(item["price"] * item["qty"] for item in items)', ghost: "", pause: 200, tab: true },
  { typed: 'def calculate_total(items: list[dict]) -> float:\n    total = sum(item["price"] * item["qty"] for item in items)\n    ', ghost: "return round(total * 1.05, 2)", pause: 600 },
  { typed: 'def calculate_total(items: list[dict]) -> float:\n    total = sum(item["price"] * item["qty"] for item in items)\n    return round(total * 1.05, 2)', ghost: "", pause: 200, tab: true }
];

function initT1(panel) {
  if (panel.dataset.init) return;
  panel.dataset.init = "1";

  const quizContainer = panel.querySelector(".quiz-container");
  if (quizContainer) initQuiz(quizContainer, SCENARIOS_T1, "t1_");

  panel.querySelectorAll(".prompt-tab").forEach(btn => {
    btn.onclick = () => {
      panel.querySelectorAll(".prompt-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const type = btn.dataset.prompt;
      const input = panel.querySelector(".prompt-input");
      const output = panel.querySelector(".prompt-output");
      if (input) input.textContent = PROMPT_EXAMPLES[type].input;
      if (output) output.textContent = PROMPT_EXAMPLES[type].output;
    };
  });
  const firstPromptTab = panel.querySelector(".prompt-tab");
  if (firstPromptTab) firstPromptTab.click();

  let terminalRunning = false;
  const termBody = panel.querySelector(".terminal-body");
  const termPlayBtn = panel.querySelector(".terminal-play");
  const termResetBtn = panel.querySelector(".terminal-reset");

  async function playTerminal() {
    if (terminalRunning || !termBody) return;
    terminalRunning = true;
    termBody.innerHTML = '<div class="terminal-line prompt-line">$ claude "\u5e6b\u6211\u91cd\u69cb utils.py\uff0c\u62c6\u6210\u4e09\u500b\u6a21\u7d44"</div>';
    for (const line of TERMINAL_SCRIPT) {
      const div = document.createElement("div");
      div.className = `terminal-line ${line.type}`;
      div.textContent = line.text;
      termBody.appendChild(div);
      termBody.scrollTop = termBody.scrollHeight;
      await sleep(line.type === "thinking" ? 800 : line.type === "tool" ? ANIMATION_SPEED.medium : 350);
    }
    terminalRunning = false;
  }

  if (termPlayBtn) termPlayBtn.onclick = playTerminal;
  if (termResetBtn) termResetBtn.onclick = () => {
    terminalRunning = false;
    if (termBody) termBody.innerHTML = '<div class="terminal-line prompt-line">$ claude "\u5e6b\u6211\u91cd\u69cb utils.py"</div>';
  };

  let typingRunning = false;
  const typingPlayBtn = panel.querySelector(".typing-play");
  const typingCode = panel.querySelector(".typing-code");

  async function playTyping() {
    if (typingRunning || !typingCode) return;
    typingRunning = true;
    typingCode.innerHTML = '<span class="cursor"></span>';
    for (const frame of TYPING_SCRIPT) {
      if (!typingRunning) break;
      let html = escapeHtml(frame.typed);
      if (frame.ghost) {
        html += `<span class="ghost">${escapeHtml(frame.ghost)}</span><span class="tab-badge">Tab \u23ce</span>`;
      }
      html += '<span class="cursor"></span>';
      typingCode.innerHTML = html;
      await sleep(frame.pause);
      if (frame.tab) await sleep(ANIMATION_SPEED.fast);
    }
    typingRunning = false;
  }

  if (typingPlayBtn) typingPlayBtn.onclick = playTyping;

  // Match Game
  panel.querySelectorAll(".match-tool").forEach(tool => {
    tool.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", tool.dataset.tool); tool.style.opacity = "0.5"; });
    tool.addEventListener("dragend", () => { tool.style.opacity = ""; });
  });
  panel.querySelectorAll(".match-drop").forEach(drop => {
    drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("dragover"); });
    drop.addEventListener("dragleave", () => { drop.classList.remove("dragover"); });
    drop.addEventListener("drop", e => {
      e.preventDefault();
      drop.classList.remove("dragover");
      const toolId = e.dataTransfer.getData("text/plain");
      drop.textContent = toolId;
      drop.dataset.placed = toolId;
      drop.classList.add("filled");
      const toolEl = panel.querySelector(`.match-tool[data-tool="${toolId}"]`);
      if (toolEl) toolEl.classList.add("placed");
    });
  });

  const matchCheckBtn = panel.querySelector(".match-check");
  const matchResetBtn = panel.querySelector(".match-reset");
  const matchResult = panel.querySelector(".match-result");
  if (matchCheckBtn) matchCheckBtn.onclick = () => {
    let correct = 0;
    panel.querySelectorAll(".match-slot").forEach(slot => {
      const drop = slot.querySelector(".match-drop");
      if (drop && drop.dataset.placed === slot.dataset.answer) { correct++; drop.style.borderColor = "var(--green)"; drop.style.background = "rgba(0,200,83,0.1)"; }
      else if (drop && drop.dataset.placed) { drop.style.borderColor = "var(--accent)"; drop.style.background = "rgba(255,87,34,0.1)"; }
    });
    if (matchResult) { matchResult.className = `match-result show ${correct === 4 ? "correct" : "partial"}`; matchResult.textContent = correct === 4 ? "\u5168\u5c0d\uff01" : `${correct}/4 \u6b63\u78ba`; }
  };
  if (matchResetBtn) matchResetBtn.onclick = () => {
    panel.querySelectorAll(".match-drop").forEach(d => { d.textContent = ""; d.dataset.placed = ""; d.classList.remove("filled"); d.style.borderColor = ""; d.style.background = ""; });
    panel.querySelectorAll(".match-tool").forEach(t => t.classList.remove("placed"));
    if (matchResult) { matchResult.className = "match-result"; matchResult.textContent = ""; }
  };

  // CLAUDE.md Builder
  const claudeFields = panel.querySelectorAll(".claude-field");
  const claudePreview = panel.querySelector(".claude-preview");
  claudeFields.forEach(field => {
    field.addEventListener("input", () => {
      if (!claudePreview) return;
      let output = "# CLAUDE.md\n\n";
      claudeFields.forEach(f => { if (f.value.trim()) output += `## ${f.dataset.label}\n${f.value.trim()}\n\n`; });
      claudePreview.textContent = output;
    });
  });

  // Context Window Visualizer
  const ctxSlider = panel.querySelector(".context-slider");
  const ctxSegments = panel.querySelector(".context-segments");
  if (ctxSlider && ctxSegments) {
    ctxSlider.addEventListener("input", () => {
      const val = parseInt(ctxSlider.value);
      const system = Math.min(val * 0.1, 20);
      const context = Math.min(val * 0.4, 60);
      const output = val - system - context;
      ctxSegments.innerHTML = `<div class="ctx-seg ctx-system" style="flex:${system}"><span>System ${system.toFixed(0)}%</span></div><div class="ctx-seg ctx-context" style="flex:${context}"><span>Context ${context.toFixed(0)}%</span></div><div class="ctx-seg ctx-output" style="flex:${output}"><span>Output ${output.toFixed(0)}%</span></div>`;
    });
    ctxSlider.dispatchEvent(new Event("input"));
  }
}

// ═══════ T2: WORKFLOW ═══════
function initT2(panel) {
  if (panel.dataset.init) return;
  panel.dataset.init = "1";

  let n8nPlaying = false;
  const n8nPlayBtn = panel.querySelector(".n8n-play");
  const n8nResetBtn = panel.querySelector(".n8n-reset");

  async function playN8n() {
    if (n8nPlaying) return;
    n8nPlaying = true;
    const nodes = panel.querySelectorAll(".n8n-node");
    const steps = panel.querySelectorAll(".trace-step");
    nodes.forEach(n => { n.style.opacity = "0.3"; n.style.transform = ""; n.style.boxShadow = ""; });
    steps.forEach(f => f.classList.remove("highlight"));
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].style.opacity = "1";
      nodes[i].style.boxShadow = "4px 4px 0 var(--accent)";
      nodes[i].style.transform = "translate(-2px, -2px)";
      if (steps[i]) steps[i].classList.add("highlight");
      await sleep(ANIMATION_SPEED.slow);
      nodes[i].style.transform = "";
      nodes[i].style.boxShadow = "";
    }
    n8nPlaying = false;
  }

  if (n8nPlayBtn) n8nPlayBtn.onclick = playN8n;
  if (n8nResetBtn) n8nResetBtn.onclick = () => {
    n8nPlaying = false;
    panel.querySelectorAll(".n8n-node").forEach(n => { n.style.opacity = ""; n.style.transform = ""; n.style.boxShadow = ""; });
    panel.querySelectorAll(".trace-step").forEach(f => f.classList.remove("highlight"));
  };

  panel.querySelectorAll(".n8n-node").forEach(node => {
    node.addEventListener("click", () => {
      node.style.boxShadow = "4px 4px 0 var(--accent)";
      node.style.transform = "translate(-2px, -2px)";
      setTimeout(() => { node.style.boxShadow = ""; node.style.transform = ""; }, 1500);
    });
  });

  // RAG Pipeline
  panel.querySelectorAll(".rag-phase-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      panel.querySelectorAll(".rag-phase-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const phase = btn.dataset.phase;
      panel.querySelectorAll(".rag-node").forEach(node => { node.classList.toggle("active", node.dataset.phase === phase); });
    });
  });

  // Cost Calculator
  const costInputs = panel.querySelectorAll(".cost-input");
  const costResult = panel.querySelector(".cost-result");
  costInputs.forEach(input => {
    input.addEventListener("input", () => {
      const hours = parseInt(panel.querySelector(".cost-manual-hours")?.value) || 0;
      const rate = parseInt(panel.querySelector(".cost-hourly-rate")?.value) || 30;
      const auto = parseInt(panel.querySelector(".cost-automation")?.value) || 5;
      const manualCost = hours * rate * 4;
      if (costResult) costResult.innerHTML = `<strong>\u6bcf\u6708\u7701 $${Math.max(0, manualCost - auto)}</strong> (\u624b\u52d5 $${manualCost} vs \u81ea\u52d5 $${auto})`;
    });
  });

  // Workflow Cards
  panel.querySelectorAll(".workflow-card").forEach(card => {
    card.addEventListener("click", () => {
      const was = card.classList.contains("expanded");
      panel.querySelectorAll(".workflow-card.expanded").forEach(c => c.classList.remove("expanded"));
      if (!was) card.classList.add("expanded");
    });
  });
}

// ═══════ T3: CREATIVE ═══════
const WALK_STEPS = [
  { title: "STEP 01 \u00b7 Load Checkpoint", text: "AI \u628a\u6574\u500b\u300e\u5927\u8166\u300f\u8f09\u5165\u8a18\u61b6\u9ad4\u3002Checkpoint \u6c7a\u5b9a\u756b\u98a8\u57fa\u5e95\u3002" },
  { title: "STEP 02 \u00b7 CLIP Text Encode", text: "\u4f60\u6253\u7684 prompt \u88ab\u7ffb\u8b6f\u6210 AI \u770b\u5f97\u61c2\u7684\u300e\u5411\u91cf\u300f\u3002" },
  { title: "STEP 03 \u00b7 Empty Latent", text: "\u5efa\u7acb\u5168\u662f\u96dc\u8a0a\u7684\u300e\u756b\u5e03\u300f\uff0cAI \u5728\u58d3\u7e2e\u904e\u7684 latent \u7a7a\u9593\u64cd\u4f5c\u3002" },
  { title: "STEP 04 \u00b7 KSampler \u63a1\u6a23", text: "\u771f\u6b63\u7684\u300e\u756b\u5716\u300f\u968e\u6bb5\u3002\u5f9e\u96dc\u8a0a\u4e00\u6b65\u6b65\u53bb\u566a\u3002CFG \u63a7\u5236\u6709\u591a\u807d prompt\u3002" },
  { title: "STEP 05 \u00b7 VAE Decode", text: "\u628a latent \u7ffb\u8b6f\u56de\u771f\u6b63\u7684\u50cf\u7d20\u5716\u3002\u5b8c\u6210\u3002" }
];

function initT3(panel) {
  if (panel.dataset.init) return;
  panel.dataset.init = "1";

  panel.querySelectorAll(".walk-btn").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.walk);
      panel.querySelectorAll(".walk-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      panel.querySelectorAll(".comfy-node").forEach(n => n.classList.remove("active"));
      const nodes = panel.querySelectorAll(".comfy-node");
      if (nodes[idx - 1]) nodes[idx - 1].classList.add("active");
      const explainer = panel.querySelector(".walk-explainer");
      if (explainer) explainer.innerHTML = `<strong style="color:var(--yellow);">${WALK_STEPS[idx - 1].title}</strong><br>${WALK_STEPS[idx - 1].text}`;
    };
  });
  const firstWalk = panel.querySelector(".walk-btn");
  if (firstWalk) firstWalk.click();

  const cfgSlider = panel.querySelector(".cfg-slider");
  const stepsSlider = panel.querySelector(".steps-slider");
  if (cfgSlider) {
    cfgSlider.oninput = e => {
      const v = parseFloat(e.target.value);
      const valEl = panel.querySelector(".cfg-val");
      const explEl = panel.querySelector(".cfg-explain");
      if (valEl) valEl.textContent = v.toFixed(1);
      if (explEl) {
        if (v < 4) explEl.textContent = `CFG ${v}\uff1aAI \u81ea\u7531\u767c\u63ee\uff0c\u53ef\u80fd\u504f\u96e2 prompt\u3002`;
        else if (v < 9) explEl.textContent = `CFG ${v}\uff1a\u5e73\u8861\u9ede\u3002\u591a\u6578\u60c5\u5883\u7684\u751c\u871c\u5e36\u3002`;
        else if (v < 14) explEl.textContent = `CFG ${v}\uff1a\u5f88\u807d prompt \u4f46\u958b\u59cb\u50f5\u786c\u3002`;
        else explEl.textContent = `CFG ${v}\uff1a\u592a\u807d\u8a71\uff0c\u5e38\u51fa\u73fe\u98fd\u548c\u7206\u8272\u3002`;
      }
    };
  }
  if (stepsSlider) {
    stepsSlider.oninput = e => {
      const v = parseInt(e.target.value);
      const valEl = panel.querySelector(".steps-val");
      const explEl = panel.querySelector(".steps-explain");
      if (valEl) valEl.textContent = v;
      if (explEl) {
        if (v < 12) explEl.textContent = `${v} \u6b65\uff1a\u5f88\u5feb\u4f46\u7d30\u7bc0\u4e0d\u8db3\u3002`;
        else if (v < 25) explEl.textContent = `${v} \u6b65\uff1a\u6a19\u6e96\u7bc4\u570d\uff0c\u591a\u6578\u5716\u5920\u7d30\u3002`;
        else if (v < 40) explEl.textContent = `${v} \u6b65\uff1a\u7d30\u7bc0\u6eff\uff0c\u6642\u9593 \u00d7${(v/20).toFixed(1)}\u3002`;
        else explEl.textContent = `${v} \u6b65\uff1a\u908a\u969b\u6548\u76ca\u905e\u6e1b\u3002`;
      }
    };
  }

  // Diffusion Visualizer
  const diffBtn = panel.querySelector(".diffusion-play");
  const diffCanvas = panel.querySelector(".diffusion-canvas");
  if (diffBtn && diffCanvas) {
    diffBtn.addEventListener("click", async () => {
      diffBtn.disabled = true;
      for (let i = 0; i <= 10; i++) {
        const noise = 1 - (i / 10);
        diffCanvas.style.filter = `blur(${noise * 15}px) grayscale(${noise * 100}%)`;
        diffCanvas.style.opacity = 0.3 + (i / 10) * 0.7;
        await sleep(ANIMATION_SPEED.medium);
      }
      diffBtn.disabled = false;
    });
  }

  // Latent Counter
  const latentBtn = panel.querySelector(".latent-counter-btn");
  const latentDisplay = panel.querySelector(".latent-counter-display");
  if (latentBtn && latentDisplay) {
    latentBtn.addEventListener("click", async () => {
      latentBtn.disabled = true;
      const start = 512 * 512 * 3;
      const end = 64 * 64 * 4;
      for (let i = 0; i <= 30; i++) {
        const current = Math.round(start - (start - end) * (i / 30));
        latentDisplay.textContent = `${current.toLocaleString()} \u2192 \u58d3\u7e2e ${(start / current).toFixed(1)}x`;
        await sleep(50);
      }
      latentDisplay.textContent = `${end.toLocaleString()} (\u58d3\u7e2e ${(start/end).toFixed(0)}x)`;
      latentBtn.disabled = false;
    });
  }

  // Pipeline Builder Quiz (drag reorder)
  const sortable = panel.querySelector(".pipeline-sortable");
  if (sortable) {
    let draggedEl = null;
    sortable.addEventListener("dragstart", e => { draggedEl = e.target.closest(".pipeline-node"); if (draggedEl) draggedEl.style.opacity = "0.4"; });
    sortable.addEventListener("dragend", () => { if (draggedEl) draggedEl.style.opacity = ""; draggedEl = null; });
    sortable.addEventListener("dragover", e => e.preventDefault());
    sortable.addEventListener("drop", e => {
      e.preventDefault();
      const target = e.target.closest(".pipeline-node");
      if (target && draggedEl && target !== draggedEl) {
        const rect = target.getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) sortable.insertBefore(draggedEl, target);
        else sortable.insertBefore(draggedEl, target.nextSibling);
      }
    });
    const checkBtn = panel.querySelector(".pipeline-check");
    if (checkBtn) checkBtn.onclick = () => {
      let ok = true;
      sortable.querySelectorAll(".pipeline-node").forEach((node, i) => {
        const correct = parseInt(node.dataset.order) === i;
        node.classList.toggle("correct", correct);
        node.classList.toggle("wrong", !correct);
        if (!correct) ok = false;
      });
      const r = panel.querySelector(".pipeline-result");
      if (r) r.textContent = ok ? "\u2713 \u5b8c\u7f8e\u9806\u5e8f\uff01" : "\u9806\u5e8f\u4e0d\u5c0d\uff0c\u518d\u8a66\uff01";
    };
  }
}

// ═══════ T4: AGENT ═══════
const AGENT_SCRIPTS = {
  weather: [
    { thought: "目標是查明天天氣 + 提醒帶傘。先呼叫天氣 API。", action: "weather_api(city='Taipei', date='2026-05-08')", obs: "{ rain: true, temp: 18 }", loop: "已查到下雨，下一步：通知。" },
    { thought: "明天會下大雨，需要提醒使用者。", action: "send_notification(title='帶傘提醒', body='明天 18°C 有大雨')", obs: "{ status: 'sent' }", loop: "通知已送達，目標達成。" },
    { final: "✓ 任務完成：明天台北會下雨，提醒已寄出。" }
  ],
  report: [
    { thought: "需要本週 AI 新聞。先搜尋。", action: "web_search('AI news this week 2026')", obs: "找到 47 篇相關新聞", loop: "資料太多，需篩選摘要。" },
    { thought: "把新聞分類抽重要 3 則。", action: "summarize(articles=top_47, count=3)", obs: "3 點摘要產生", loop: "摘要好了，寄信。" },
    { thought: "寄摘要到使用者信箱。", action: "send_email(to=user, subject='本週 AI 摘要')", obs: "{ sent: true }", loop: "已寄出。" },
    { final: "✓ 完成：3 點摘要已寄到 email。" }
  ],
  bug: [
    { thought: "先讀程式碼了解問題。", action: "read_file('script.py')", obs: "第 87 行呼叫 undefined 的 calc_total()", loop: "函數沒定義或拼錯。" },
    { thought: "搜尋專案類似函數。", action: "grep('calc', project)", obs: "找到 calculate_total() 在 utils.py", loop: "拼錯了，要修。" },
    { thought: "修正拼字 + 加 import。", action: "edit_file('script.py', line=87)", obs: "{ saved: true }", loop: "跑測試確認。" },
    { thought: "跑測試。", action: "run_tests()", obs: "10 passed, 0 failed", loop: "全綠。" },
    { final: "✓ Bug 已修：calc_total → calculate_total，測試全過。" }
  ],
  trip: [
    { thought: "規劃台北兩天一夜：景點、住宿、交通。", action: "search('台北 景點 兩天')", obs: "找到 23 個熱門景點", loop: "篩選成兩天路線。" },
    { thought: "依地理分群。", action: "cluster_by_district(spots)", obs: "Day1: 士林+陽明山, Day2: 西門+迪化", loop: "加餐廳住宿。" },
    { thought: "插入餐廳和住宿。", action: "find_hotels_near('士林')", obs: "推薦 3 間 hotel、6 間餐廳", loop: "選最佳組合。" },
    { final: "✓ 行程完成：Day1 士林陽明山；Day2 迪化西門。" }
  ]
};

function initT4(panel) {
  if (panel.dataset.init) return;
  panel.dataset.init = "1";

  let agentRunning = false;

  function setStage(panel, id, cls, txt) {
    const el = panel.querySelector(`#${id}, .${id}`);
    if (!el) return;
    el.classList.remove("active", "done");
    if (cls) el.classList.add(cls);
    const p = el.querySelector("p");
    if (p) p.textContent = txt;
  }

  function resetAgent() {
    ["rsReason", "rsAct", "rsObs", "rsLoop"].forEach(id => setStage(panel, id, "", "\u2014"));
    const trace = panel.querySelector(".agent-trace");
    if (trace) trace.innerHTML = '<div class="trace-line"><span class="timestamp">[00:00]</span> \u7cfb\u7d71\u5c31\u7dd2\uff0c\u7b49\u5f85\u76ee\u6a19 ...</div>';
  }

  async function runAgent() {
    if (agentRunning) return;
    agentRunning = true;
    resetAgent();
    const goalEl = panel.querySelector(".agent-goal");
    if (!goalEl) { agentRunning = false; return; }
    const script = AGENT_SCRIPTS[goalEl.value];
    const trace = panel.querySelector(".agent-trace");
    if (!trace) { agentRunning = false; return; }
    trace.innerHTML = "";
    let t = 0;

    function tlog(type, txt) {
      const ts = `[${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}]`;
      const div = document.createElement("div");
      div.className = `trace-line ${type}`;
      div.innerHTML = `<span class="timestamp">${ts}</span> ${txt}`;
      trace.appendChild(div);
      trace.scrollTop = trace.scrollHeight;
      t += Math.floor(Math.random() * 3) + 1;
    }

    tlog("", "<strong>\u76ee\u6a19\uff1a</strong>" + goalEl.selectedOptions[0].text);
    for (const step of script) {
      if (step.final) { tlog("final", step.final); setStage(panel, "rsLoop", "done", "\u2713 \u5b8c\u6210"); break; }
      setStage(panel, "rsReason", "active", step.thought);
      tlog("thought", "<strong>THINK:</strong> " + step.thought);
      await sleep(ANIMATION_SPEED.agent);
      setStage(panel, "rsReason", "done", step.thought);
      setStage(panel, "rsAct", "active", step.action);
      tlog("action", "<strong>ACT:</strong> " + step.action);
      await sleep(1000);
      setStage(panel, "rsAct", "done", step.action);
      setStage(panel, "rsObs", "active", step.obs);
      tlog("observation", "<strong>OBS:</strong> " + step.obs);
      await sleep(1000);
      setStage(panel, "rsObs", "done", step.obs);
      setStage(panel, "rsLoop", "active", step.loop);
      await sleep(800);
    }
    agentRunning = false;
  }

  const runBtn = panel.querySelector(".agent-run");
  const resetBtn = panel.querySelector(".agent-reset");
  if (runBtn) runBtn.onclick = runAgent;
  if (resetBtn) resetBtn.onclick = resetAgent;

  // Spectrum Slider
  const specSlider = panel.querySelector(".spectrum-slider");
  const specCard = panel.querySelector(".spectrum-card");
  function updateSpectrum(val) {
    const d = SPECTRUM_DATA[val - 1];
    if (!specCard) return;
    specCard.innerHTML = `<div class="spectrum-level">${d.level}</div><div class="spectrum-type">${d.type}</div><div class="spectrum-product">${d.product}</div><div class="spectrum-desc">${d.desc}</div><div class="spectrum-risk"><span class="risk-label">\u98a8\u96aa\uff1a</span><span class="risk-bar"><span class="risk-fill" style="width:${d.risk}%"></span></span> ${d.risk < 40 ? "\u4f4e" : d.risk < 70 ? "\u4e2d" : "\u9ad8"}</div>`;
  }
  if (specSlider) { specSlider.oninput = e => updateSpectrum(parseInt(e.target.value)); updateSpectrum(1); }

  // Quantization Calculator
  const quantInputs = panel.querySelectorAll(".quant-input");
  const quantResult = panel.querySelector(".quant-result");
  quantInputs.forEach(input => {
    input.addEventListener("input", () => {
      const params = parseFloat(panel.querySelector(".quant-params")?.value) || 7;
      const bits = parseInt(panel.querySelector(".quant-bits")?.value) || 16;
      const vram = (params * bits / 8).toFixed(1);
      if (quantResult) quantResult.textContent = `\u2248 ${vram} GB VRAM`;
    });
  });

  // Architecture Explorer
  panel.querySelectorAll(".arch-node").forEach(node => {
    node.addEventListener("click", () => {
      panel.querySelectorAll(".arch-node").forEach(n => n.classList.remove("active"));
      node.classList.add("active");
      const info = panel.querySelector(".arch-info");
      if (info) info.textContent = node.dataset.info || "";
    });
  });

  // Stateful vs Stateless
  panel.querySelectorAll(".state-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      panel.querySelectorAll(".state-toggle-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const demo = panel.querySelector(".state-demo");
      if (demo) demo.dataset.mode = btn.dataset.mode;
    });
  });
}

// ═══════ T5: CONCEPTS ═══════
function initT5(panel) {
  if (panel.dataset.init) return;
  panel.dataset.init = "1";

  // Concept Cards
  panel.querySelectorAll(".concept-card").forEach(card => {
    const body = card.querySelector(".concept-body");
    if (body) { body.style.maxHeight = "0"; body.style.overflow = "hidden"; body.style.transition = "max-height 0.4s ease"; }
    card.addEventListener("click", e => {
      if (card.classList.contains("expanded")) {
        if (e.target.closest(".concept-header")) {
          if (body) { body.style.maxHeight = body.scrollHeight + "px"; requestAnimationFrame(() => { body.style.maxHeight = "0"; }); }
          card.classList.remove("expanded");
        }
        return;
      }
      panel.querySelectorAll(".concept-card.expanded").forEach(c => {
        const b = c.querySelector(".concept-body");
        if (b) { b.style.maxHeight = b.scrollHeight + "px"; requestAnimationFrame(() => { b.style.maxHeight = "0"; }); }
        c.classList.remove("expanded");
      });
      card.classList.add("expanded");
      if (body) {
        body.style.maxHeight = body.scrollHeight + "px";
        body.addEventListener("transitionend", function handler() {
          if (card.classList.contains("expanded")) body.style.maxHeight = "none";
          body.removeEventListener("transitionend", handler);
        });
      }
    });
  });

  // Flashcards
  let flippedCount = 0;
  const totalCards = panel.querySelectorAll(".flashcard").length;
  panel.querySelectorAll(".flashcard").forEach(card => {
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
      flippedCount = panel.querySelectorAll(".flashcard.flipped").length;
      const counter = panel.querySelector(".flashcard-count");
      if (counter) counter.textContent = `${flippedCount} / ${totalCards} \u5df2\u7ffb`;
    });
  });
  const flashReset = panel.querySelector(".flashcard-reset-btn");
  if (flashReset) flashReset.onclick = () => {
    panel.querySelectorAll(".flashcard").forEach(c => c.classList.remove("flipped"));
    flippedCount = 0;
    const counter = panel.querySelector(".flashcard-count");
    if (counter) counter.textContent = `0 / ${totalCards} \u5df2\u7ffb`;
  };

  // MCP Connection Simulator
  const mcpBtn = panel.querySelector(".mcp-sim-btn");
  const mcpNodes = panel.querySelectorAll(".mcp-sim-node");
  if (mcpBtn) {
    mcpBtn.addEventListener("click", async () => {
      mcpBtn.disabled = true;
      for (let i = 0; i < mcpNodes.length; i++) {
        mcpNodes[i].classList.add("active");
        await sleep(ANIMATION_SPEED.medium);
      }
      await sleep(ANIMATION_SPEED.slow);
      mcpNodes.forEach(n => n.classList.add("connected"));
      mcpBtn.disabled = false;
    });
  }

  // N*M Problem Visualizer
  panel.querySelectorAll(".nm-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      panel.querySelectorAll(".nm-toggle-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const chaos = panel.querySelector(".nm-chaos");
      const mcp = panel.querySelector(".nm-mcp");
      if (chaos) chaos.classList.toggle("show", btn.dataset.view === "chaos");
      if (mcp) mcp.classList.toggle("show", btn.dataset.view === "mcp");
    });
  });

  // JSON-RPC Builder
  const rpcFields = panel.querySelectorAll(".rpc-field");
  const rpcPreview = panel.querySelector(".rpc-preview");
  rpcFields.forEach(field => {
    field.addEventListener("input", () => {
      if (!rpcPreview) return;
      const method = panel.querySelector(".rpc-method")?.value || "tools/call";
      const params = panel.querySelector(".rpc-params")?.value || "{}";
      const obj = { jsonrpc: "2.0", method: method, params: params, id: 1 };
      try { obj.params = JSON.parse(params); } catch {}
      rpcPreview.textContent = JSON.stringify(obj, null, 2);
    });
  });

  // Progressive Disclosure
  panel.querySelectorAll(".disclosure-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = panel.querySelector(btn.dataset.target);
      if (target) { target.classList.toggle("show"); btn.classList.toggle("open"); }
    });
  });
}

// ═══════ T6: DEV FLOW ═══════
const SCENARIOS_T6 = [
  { prompt: "你遇到一個 bug，直接跟 AI 說：『這壞了，幫我修。』沒有給任何其他資訊。這樣做對嗎？", options: [
    { text: "沒問題，AI 夠聰明會自己看", correct: false, fb: "✗ AI 不是通靈師——沒有 error log、沒有重現步驟，它只能猜。" },
    { text: "不好，應該附上 error + context", correct: true, fb: "✓ 對。附上錯誤訊息、重現步驟、環境版本，AI 才能精準定位。" },
    { text: "可以，但要多問幾次", correct: false, fb: "多問幾次不會讓 AI 通靈。垃圾進垃圾出。" }
  ]},
  { prompt: "你用 RCAF 框架寫了結構化 prompt。好處？", options: [
    { text: "只是形式，沒什麼差別", correct: false, fb: "差非常多。結構化 prompt 能讓第一次可用結果從 ~30% 提升到 ~80%。" },
    { text: "大幅減少來回次數，一次到位", correct: true, fb: "✓ 對。RCAF 把資訊一次給齊，省時間、省 token。" },
    { text: "AI 會變得比較有禮貌", correct: false, fb: "跟禮貌無關。重點是資訊完整度。" }
  ]},
  { prompt: "程式出錯了，正確的 debug 流程是？", options: [
    { text: "直接叫 AI 修，修不好換 prompt", correct: false, fb: "盲目丟給 AI 容易越修越壞。" },
    { text: "先叫 AI 解釋錯誤原因，理解後再修", correct: true, fb: "✓ 對。先理解再修。" },
    { text: "不用 AI，全部自己 debug", correct: false, fb: "AI 解釋 error 的能力很強，不用白不用。但要理解了再動手。" }
  ]}
];

function initT6(panel) {
  if (panel.dataset.init) return;
  panel.dataset.init = "1";

  // Scenario Quiz
  const quizContainer = panel.querySelector(".quiz-container");
  if (quizContainer) initQuiz(quizContainer, SCENARIOS_T6, "t6_");

  // RCAF Builder
  const rcafFields = ["rcafR", "rcafC", "rcafA", "rcafF"];
  function updateRcafPreview() {
    const preview = panel.querySelector(".rcaf-preview");
    if (!preview) return;
    const r = panel.querySelector(".rcaf-r")?.value?.trim() || "";
    const c = panel.querySelector(".rcaf-c")?.value?.trim() || "";
    const a = panel.querySelector(".rcaf-a")?.value?.trim() || "";
    const f = panel.querySelector(".rcaf-f")?.value?.trim() || "";
    if (!r && !c && !a && !f) { preview.innerHTML = '<span class="rcaf-placeholder">\u2190 \u5728\u5de6\u908a\u586b\u5beb\uff0c\u9019\u88e1\u6703\u5373\u6642\u7522\u51fa...</span>'; return; }
    let output = "";
    if (r) output += `[Role] ${r}\n\n`;
    if (c) output += `[Context] ${c}\n\n`;
    if (a) output += `[Action] ${a}\n\n`;
    if (f) output += `[Format] ${f}`;
    preview.textContent = output;
  }

  rcafFields.forEach(cls => {
    const el = panel.querySelector(`.${cls}, #${cls}`);
    if (el) el.addEventListener("input", updateRcafPreview);
  });

  // RCAF Presets
  panel.querySelectorAll(".rcaf-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = JSON.parse(btn.dataset.preset || "{}");
      Object.entries(preset).forEach(([key, val]) => {
        const el = panel.querySelector(`.rcaf-${key}, #rcaf${key.toUpperCase()}`);
        if (el) el.value = val;
      });
      updateRcafPreview();
    });
  });

  const rcafCopy = panel.querySelector(".rcaf-copy");
  if (rcafCopy) rcafCopy.onclick = () => {
    const preview = panel.querySelector(".rcaf-preview");
    if (preview && preview.textContent) {
      navigator.clipboard.writeText(preview.textContent).then(() => {
        rcafCopy.textContent = "\u2713 \u5df2\u8907\u88fd\uff01";
        setTimeout(() => { rcafCopy.textContent = "\ud83d\udccb \u8907\u88fd Prompt"; }, 1500);
      });
    }
  };

  // Temperature Playground
  const tempSlider = panel.querySelector(".temp-slider");
  const tempOutputs = panel.querySelector(".temp-outputs");
  if (tempSlider && tempOutputs) {
    const examples = {
      0: ["\u7b54\u6848\u662f 42\u3002", "\u7b54\u6848\u662f 42\u3002", "\u7b54\u6848\u662f 42\u3002"],
      0.5: ["\u7b54\u6848\u662f 42\uff0c\u4f86\u81ea\u300a\u9280\u6cb3\u4fbf\u8eca\u6307\u5357\u300b\u3002", "\u7b54\u6848\u662f 42\u3002\u9019\u500b\u6578\u5b57\u4f86\u81ea Douglas Adams\u3002", "\u7b54\u6848\u662f 42\uff0c\u5b87\u5b99\u7684\u7d42\u6975\u7b54\u6848\u3002"],
      1: ["\u7b54\u6848\u662f 42\uff01\u5c31\u50cf\u751f\u6d3b\u4e00\u6a23\u8352\u8b2c\u3002", "\u6df1\u601d\u7684\u96fb\u8166\u82b1\u4e86\u5e7e\u767e\u842c\u5e74\u7b97\u51fa\u4e86\u2026 42\u3002", "42\u3002\u4f46\u554f\u984c\u672c\u8eab\u662f\u4ec0\u9ebc\uff1f"]
    };
    tempSlider.oninput = e => {
      const v = parseFloat(e.target.value);
      const valEl = panel.querySelector(".temp-val");
      if (valEl) valEl.textContent = v.toFixed(1);
      const key = v <= 0.2 ? 0 : v <= 0.7 ? 0.5 : 1;
      const outputs = examples[key];
      tempOutputs.innerHTML = outputs.map((o, i) => `<div class="temp-sample">\u7b2c${i+1}\u6b21: ${o}</div>`).join("");
    };
  }

  // Debug Flow Quiz (reuse quiz system)
  const debugQuiz = panel.querySelector(".debug-quiz-container");
  if (debugQuiz) {
    const debugScenarios = [
      { prompt: "TypeError: Cannot read properties of undefined (reading 'map') — \u4f60\u7684\u7b2c\u4e00\u6b65\uff1f", options: [
        { text: "\u76f4\u63a5\u52a0 ?. optional chaining", correct: false, fb: "\u9019\u53ea\u662f\u6b62\u75db\u85e5\uff0c\u771f\u6b63\u554f\u984c\u662f\u70ba\u4ec0\u9ebc\u662f undefined\u3002" },
        { text: "\u627e\u51fa\u54ea\u500b\u8b8a\u6578\u662f undefined\uff0c\u8ffd\u6eaf\u4f86\u6e90", correct: true, fb: "\u2713 \u5c0d\u3002\u5148\u77e5\u9053\u300c\u8ab0\u300d\u662f undefined\uff0c\u518d\u554f\u300c\u70ba\u4ec0\u9ebc\u300d\u3002" },
        { text: "\u91cd\u555f\u4e26\u770b\u770b\u6703\u4e0d\u6703\u6d88\u5931", correct: false, fb: "\u9019\u4e0d\u662f\u96a8\u6a5f bug\uff0c\u91cd\u555f\u4e0d\u6703\u89e3\u6c7a\u3002" }
      ]}
    ];
    initQuiz(debugQuiz, debugScenarios, "t6_debug_");
  }

  // Rate Limit Simulator
  const rateBtn = panel.querySelector(".rate-sim-btn");
  const rateBar = panel.querySelector(".rate-bar-fill");
  const rateStatus = panel.querySelector(".rate-status");
  if (rateBtn && rateBar) {
    rateBtn.addEventListener("click", async () => {
      rateBtn.disabled = true;
      for (let i = 0; i <= 100; i += 10) {
        rateBar.style.width = i + "%";
        if (rateStatus) rateStatus.textContent = i < 80 ? `${i}% \u4f7f\u7528\u4e2d` : i < 100 ? `${i}% \u2014 \u63a5\u8fd1\u4e0a\u9650\uff01` : "429 Too Many Requests!";
        rateBar.style.background = i < 60 ? "var(--green)" : i < 90 ? "var(--yellow)" : "var(--accent)";
        await sleep(300);
      }
      await sleep(1000);
      rateBar.style.width = "0%";
      if (rateStatus) rateStatus.textContent = "\u5df2\u91cd\u7f6e";
      rateBtn.disabled = false;
    });
  }
}

// ═══════ T7: SIDE PROJECT ═══════
const PROJECT_IDEAS = [
  "AI \u65e5\u8a18\u52a9\u7406 — \u6bcf\u5929\u5beb\u65e5\u8a18\uff0cAI \u5e6b\u4f60\u7e3d\u7d50\u9031\u8da8\u52e2",
  "LINE Bot \u8a18\u5e33 — \u50b3\u8a0a\u606f\u81ea\u52d5\u5206\u985e\u8a18\u5e33",
  "GitHub PR \u6458\u8981\u5668 — Webhook + AI \u81ea\u52d5\u5beb PR \u6458\u8981",
  "AI \u98df\u8b5c\u63a8\u85a6 — \u62cd\u51b0\u7bb1\u7167\u7247\uff0cAI \u5efa\u8b70\u98df\u8b5c",
  "\u5b78\u7fd2\u5361\u7247\u7522\u751f\u5668 — \u8cbc\u7b46\u8a18\u81ea\u52d5\u8f49 Anki \u5361\u7247",
  "\u81ea\u52d5\u9031\u5831\u7522\u751f\u5668 — \u8b80 Git log + Slack \u7522\u51fa\u9031\u5831"
];

function initT7(panel) {
  if (panel.dataset.init) return;
  panel.dataset.init = "1";

  // Project Idea Spinner
  const spinBtn = panel.querySelector(".spin-btn");
  const spinDisplay = panel.querySelector(".spin-display");
  if (spinBtn && spinDisplay) {
    spinBtn.addEventListener("click", async () => {
      spinBtn.disabled = true;
      const rounds = 15;
      for (let i = 0; i < rounds; i++) {
        spinDisplay.textContent = PROJECT_IDEAS[Math.floor(Math.random() * PROJECT_IDEAS.length)];
        spinDisplay.style.opacity = 0.5;
        await sleep(80 + i * 20);
      }
      spinDisplay.textContent = PROJECT_IDEAS[Math.floor(Math.random() * PROJECT_IDEAS.length)];
      spinDisplay.style.opacity = 1;
      spinBtn.disabled = false;
    });
  }

  // Homework Checklist (localStorage)
  const CHECKLIST_KEY = "lesson3-checklist";
  const checklistEl = panel.querySelector(".homework-checklist");
  if (checklistEl) {
    const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "{}");
    checklistEl.querySelectorAll("input[type=checkbox]").forEach(cb => {
      const id = cb.dataset.id;
      if (saved[id]) cb.checked = true;
      cb.addEventListener("change", () => {
        saved[id] = cb.checked;
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(saved));
        updateChecklistProgress();
      });
    });
    function updateChecklistProgress() {
      const total = checklistEl.querySelectorAll("input[type=checkbox]").length;
      const done = checklistEl.querySelectorAll("input[type=checkbox]:checked").length;
      const prog = panel.querySelector(".checklist-progress");
      if (prog) prog.textContent = `${done}/${total} \u5b8c\u6210`;
    }
    updateChecklistProgress();
  }

  // Presentation Timer
  const timerDisplay = panel.querySelector(".timer-display");
  const timerStart = panel.querySelector(".timer-start");
  const timerReset = panel.querySelector(".timer-reset");
  let timerInterval = null;
  let timerSeconds = 0;
  const TIMER_DURATION = 5 * 60;

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  if (timerStart && timerDisplay) {
    timerStart.onclick = () => {
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; timerStart.textContent = "\u25b6 \u958b\u59cb"; return; }
      timerStart.textContent = "\u23f8 \u66ab\u505c";
      timerInterval = setInterval(() => {
        timerSeconds++;
        const remaining = TIMER_DURATION - timerSeconds;
        timerDisplay.textContent = formatTime(Math.max(0, remaining));
        if (remaining <= 0) { clearInterval(timerInterval); timerInterval = null; timerDisplay.textContent = "00:00"; timerDisplay.classList.add("expired"); }
        else if (remaining <= 60) timerDisplay.classList.add("warning");
      }, 1000);
    };
  }
  if (timerReset && timerDisplay) {
    timerReset.onclick = () => {
      clearInterval(timerInterval);
      timerInterval = null;
      timerSeconds = 0;
      timerDisplay.textContent = formatTime(TIMER_DURATION);
      timerDisplay.classList.remove("warning", "expired");
      if (timerStart) timerStart.textContent = "\u25b6 \u958b\u59cb";
    };
  }

  // Project Gallery
  panel.querySelectorAll(".project-card").forEach(card => {
    card.addEventListener("click", () => {
      const was = card.classList.contains("expanded");
      panel.querySelectorAll(".project-card.expanded").forEach(c => c.classList.remove("expanded"));
      if (!was) card.classList.add("expanded");
    });
  });
}

// ═══════ BOOT ═══════
updateProgressIndicator();
observeReveals(document);
const savedTab = progress.lastTab || "t0";
switchTab(savedTab);

