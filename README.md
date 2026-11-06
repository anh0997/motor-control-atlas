# ⚙️ 馬達控制方法圖鑑（Motor Control Atlas）

勤益科大 電機碩一乙 丁國英（4B512143）的課程專案：把 V/f、FOC、DTC、SVPWM 等馬達控制與調變方法整理成「一種方法一頁」的圖鑑，搭配互動模擬。

- 網站：https://你的帳號.github.io/motor-control-atlas/
- 規則文件：[CLAUDE.md](./CLAUDE.md)（AI 開發前必讀）、[AGENTS.md](./AGENTS.md)

## 特色

- **資料驅動**：首頁卡片、比較表、方法頁資訊列、上一頁/下一頁都由 `data/methods.js` 自動產生。
- **固定結構**：每頁依序有一句話理解、控制原理、關鍵公式、互動模擬（選用）、控制架構、優點與限制、DSP 實作要點、參考文獻。
- **互動模擬**：V/f 曲線、Clarke/Park 轉換、SVPWM 六邊形，只要一行 `<div class="widget" data-widget="…">` 就能放進頁面。
- **自動檢查**：`python3 tools/check.py` 會依 CLAUDE.md 檢查命名、結構、允許值與外部資源。

## 如何新增一個方法

對 AI 說：

> 請依照 CLAUDE.md 新增「模型預測控制（MPC）」方法頁，分類是預測控制，適用感應馬達與 PMSM。

AI 會：複製模板 → 填 8 個固定區塊 → 在 `data/methods.js` 登記 → 執行 `tools/check.py`。首頁與比較表自動更新。

## 本機預覽

直接用瀏覽器開啟 `index.html` 即可，不需要任何安裝。

## 更新紀錄

- 2026-11-06：建立專案、CLAUDE.md / AGENTS.md、檢查程式；收錄 V/f、FOC、DTC、SVPWM 四個方法與三個互動模擬
