# CLAUDE.md — 馬達控制方法圖鑑（Motor Control Atlas）

> 這份文件寫給 AI 助理（Claude、Codex、Cursor 等）看。**開始任何修改前，請先讀完整份文件。**
> `AGENTS.md` 只是指向本檔，規則以本檔為準。

## 1. 專案目的

勤益科大 電機碩一乙 丁國英 的「馬達控制方法圖鑑」。
把電機驅動常見的控制與調變方法（V/f、FOC、DTC、SVPWM…）整理成**一種方法一頁**的圖鑑，搭配互動模擬，方便複習「DSP 於驅動器應用」相關課程與閱讀論文。

最終目標：之後只要對 AI 說「依照 CLAUDE.md 新增 ○○ 方法」，AI 就能產出一頁**格式、風格、深度都與既有頁面一致**的新頁面，首頁與比較表自動更新。

## 2. 技術限制（必須遵守）

- 純靜態網站：HTML + CSS + 原生 JavaScript，直接部署在 GitHub Pages。
- **不使用**框架、建置工具、npm 套件、CDN、外部字型、MathJax／KaTeX。數學式一律用 HTML（`<sub>`、`<sup>`、`·`、`√`）寫在 `.formula` 元件中。
- 網站文字使用**繁體中文**；專有名詞與變數保留英文（如 FOC、i<sub>d</sub>、PI 控制器）。
- `tools/check.py` 是開發用檢查程式（只用 Python 標準函式庫），不屬於網站本身。

## 3. 檔案結構

```
motor-control-atlas/
├── index.html              # 首頁：方法卡片（由 data/methods.js 自動產生，勿手動加卡片）
├── compare.html            # 比較表（由 data/methods.js 自動產生，勿手動加列）
├── CLAUDE.md               # 本文件（唯一規則來源）
├── AGENTS.md               # 指向 CLAUDE.md
├── README.md               # 給人看的說明＋更新紀錄
├── data/
│   └── methods.js          # ★ 方法清單與允許值（唯一資料來源）
├── assets/
│   ├── style.css           # 全站唯一樣式表
│   ├── main.js             # 首頁卡片、分類篩選、比較表、方法頁資訊列、上一頁/下一頁
│   └── widgets.js          # 互動模擬元件（第 9 節）
├── methods/
│   ├── vf-control.html
│   ├── foc.html
│   ├── dtc.html
│   └── svpwm.html
├── templates/
│   └── method-template.html   # ★ 新方法頁一律從這裡複製
└── tools/
    └── check.py            # 規則自動檢查（第 11 節）
```

## 4. 命名規則

| 項目 | 規則 | 範例 |
|---|---|---|
| 方法頁檔名 | `英文縮寫或短名.html`，全小寫、用 `-` 連接、不含週次或日期 | `mpc.html`、`sensorless-smo.html` |
| slug | 與檔名相同，不含 `.html` | `mpc` |
| 位置 | 一律放在 `methods/` | `methods/mpc.html` |
| `<body data-method>` | 等於 slug | `<body data-method="mpc">` |
| `<title>` | `縮寫｜中文名稱｜馬達控制方法圖鑑` | `MPC｜模型預測控制｜馬達控制方法圖鑑` |

## 5. `data/methods.js` 格式

檔案中有三個允許值清單，**欄位值必須來自這些清單**；要新增分類或馬達種類，先改清單並在 README 更新紀錄說明。

```js
window.CATEGORIES = ["純量控制", "向量控制", "直接控制", "調變技術", "預測控制", "無感測估測"];
window.MOTORS     = ["感應馬達", "PMSM", "BLDC"];
window.LEVELS     = ["低", "中", "高"];
```

每個方法一筆，加入 `window.METHODS` 陣列（顯示順序 = 先依 `CATEGORIES` 順序，同分類內依陣列順序）：

```js
{
  slug: "mpc",                         // 與檔名一致
  abbr: "MPC",                         // 縮寫，10 字元內
  name: "模型預測控制",                 // 中文名稱，10 字以內
  nameEn: "Model Predictive Control",  // 英文全名
  category: "預測控制",                 // 必須在 CATEGORIES 內
  motors: ["感應馬達", "PMSM"],         // 必須在 MOTORS 內，1～3 個
  summary: "一句話說明這個方法。",       // 40 字以內
  metrics: {                           // 控制方法必填；「調變技術」類填 null
    dynamic: "高",                     // 動態響應      LEVELS
    lowSpeed: "中",                    // 低速性能      LEVELS
    complexity: "高",                  // 實作複雜度    LEVELS
    sensor: "不需要位置感測器"           // 位置感測需求  自由文字，15 字內
  },
  widget: null                         // 有互動元件就填 widgets.js 中的名稱，否則 null
}
```

## 6. 新增一個方法頁的標準流程（AI 請照順序做）

1. 確認分類、適用馬達在允許值清單內；不在就先依第 5 節新增。
2. 複製 `templates/method-template.html` → `methods/<slug>.html`。
3. 修改 `<title>`、`<body data-method>`、`<h1>`（中文名稱）、副標（英文全名）。
4. 依第 7 節填入固定區塊，**順序與 id 不可更動**。
5. 在 `data/methods.js` 的 `METHODS` 加入一筆（第 5 節）。
6. **不要**修改 `index.html`、`compare.html`、`main.js`：卡片、比較表、資訊列、上一頁/下一頁會自動更新。
7. 若需要互動元件，依第 9 節處理。
8. 執行 `python3 tools/check.py`，必須顯示全部通過。
9. 在 `README.md` 的「更新紀錄」加一行。

## 7. 方法頁的固定結構

頁首（`<header class="method-header">`）包含 `<h1>`、英文副標，以及空的 `<div id="method-meta"></div>`（由 `main.js` 依資料自動填入分類、適用馬達、性能等級，**不要手寫**）。

接著依序放以下 `<section>`：

| 順序 | id | 標題 | 內容要求 | 必填 |
|---|---|---|---|---|
| 1 | `overview` | 📌 一句話理解 | 一段 `.lead` 白話說明＋`.key-points` 3～4 點 | ✅ |
| 2 | `principle` | 🧠 控制原理 | 2～4 段；可用 `.callout` | ✅ |
| 3 | `formula` | 📐 關鍵公式 | 2～4 個 `.formula`，每個下方有一行 `.formula-note` 說明符號 | ✅ |
| 4 | `demo` | 🎛️ 互動模擬 | 放一個 `<div class="widget" data-widget="名稱"></div>`＋一句操作說明 | 選用 |
| 5 | `architecture` | 🔁 控制架構 | 用 `<ol class="flow">` 依訊號流向列出方塊，4～8 個 | ✅ |
| 6 | `pros-cons` | ⚖️ 優點與限制 | `.pros-cons` 內左右兩個 `<ul>`，各 2～4 點 | ✅ |
| 7 | `dsp` | 💻 DSP 實作要點 | `<ol class="steps">` 3～5 點，寫「在 DSP 上要注意什麼」 | ✅ |
| 8 | `refs` | 📚 參考文獻 | `<ol class="refs">` 1～3 筆 | ✅ |

最後保留 `<nav id="method-nav"></nav>`（自動產生上一頁/下一頁）。

## 8. 內容與正確性規則（重要）

- **不可編造**公式、數據、論文。不確定的內容寫「（待補）」並告知使用者。
- 參考文獻只列**真實存在且可查證**的教科書或論文，格式：`作者, "題目," 期刊/出版社, 卷(期), 頁碼, 年份.`
- 公式符號全站一致：電角度 `θ<sub>e</sub>`、極對數 `p`、定子電阻 `R<sub>s</sub>`、直流匯流排電壓 `V<sub>dc</sub>`、`*` 表示命令值（如 `i<sub>q</sub>*`）。Clarke 轉換採**振幅不變**形式。
- 性能等級（`metrics`）是**相對比較**，以 V/f＝基準的低端、FOC＝高端為參考來評，並在 `principle` 或 `pros-cons` 中能找到支持理由。
- 語氣像講義：短句、先結論後細節，避免口語與過度形容詞。

## 9. 互動元件（`assets/widgets.js`）

| 名稱 | 用途 | 使用頁面 |
|---|---|---|
| `vf-curve` | V/f 曲線、低頻電壓提升、弱磁區 | vf-control |
| `park` | abc → αβ → dq 轉換，觀察 i<sub>d</sub>、i<sub>q</sub> 為直流量 | foc |
| `svpwm-hex` | 電壓向量六邊形、扇區、T<sub>1</sub>/T<sub>2</sub>/T<sub>0</sub> | svpwm |

- 頁面只需放 `<div class="widget" data-widget="名稱"></div>`，`widgets.js` 會自動建立控制項與畫布。
- 新增元件：在 `widgets.js` 的 `WIDGETS` 物件註冊一個函式 `(root) => {}`，只能用 `style.css` 的顏色變數（透過 `cssVar()` 讀取），並更新本表。**新增元件前需先向使用者說明理由。**
- 元件必須能在 375px 寬度正常操作，且數值計算要和該頁 `formula` 區塊一致。

## 10. 視覺風格

- 關鍵字：**工程講義、乾淨、資訊密度適中**。單欄，內容最寬 820px，自動支援深色模式。
- 顏色只能用 `style.css` 中 `:root` 的變數；**HTML 中不可寫 inline style、不可新增顏色**。
- 可用元件（都定義在 `style.css`）：

| 元件 | 寫法 | 用途 |
|---|---|---|
| 重點清單 | `<ul class="key-points">` | overview |
| 提示框 / 警告框 | `<div class="callout">` / `<div class="callout warn">` | 補充、易錯處 |
| 公式 | `<div class="formula">…</div><p class="formula-note">…</p>` | formula |
| 流程方塊 | `<ol class="flow"><li>…</li></ol>` | architecture |
| 優缺點 | `<div class="pros-cons"><ul class="pros">…</ul><ul class="cons">…</ul></div>` | pros-cons |
| 步驟 | `<ol class="steps"><li><strong>小標</strong>說明</li></ol>` | dsp |
| 文獻 | `<ol class="refs">` | refs |
| 表格 | `<div class="table-wrap"><table>…</table></div>` | 開關表、參數比較（外層 div 防止手機橫向捲動） |
| 程式碼 | `<pre><code>…</code></pre>` | 虛擬碼 |

- 需要新元件：先加到 `style.css` 並更新本表，不要只在單一頁面自訂樣式。

## 11. AI 修改時的規則

- ✅ 可以：新增方法頁、修正錯字與公式錯誤、補充內容、改善既有元件樣式。
- ⚠️ 需先說明理由：修改 `main.js`／`widgets.js`、新增元件、新增分類、更動檔案結構。
- ❌ 不可以：刪除既有方法頁、更改已發布頁面的檔名、引入外部資源、在首頁或比較表手動加 HTML。
- 每次修改後執行 `python3 tools/check.py` 並在 `README.md` 更新紀錄加一行。

## 12. 完成前檢查清單（`tools/check.py` 會自動檢查標 🤖 的項目）

- [ ] 🤖 每個方法頁的檔名、`data-method`、`methods.js` 的 slug 三者一致
- [ ] 🤖 必填 section 齊全且順序正確；`demo` 若存在，位置在 `formula` 與 `architecture` 之間
- [ ] 🤖 分類、馬達、等級都在允許值清單內；summary ≤ 40 字
- [ ] 🤖 `data-widget` 名稱都已在 `widgets.js` 註冊，且與 `methods.js` 的 `widget` 欄位一致
- [ ] 🤖 沒有 inline style、沒有外部 `http(s)://` 資源
- [ ] 用瀏覽器開 `index.html`：新卡片出現、比較表出現新列、上一頁/下一頁正確
- [ ] 手機寬度（約 375px）沒有橫向捲軸，互動元件可操作
