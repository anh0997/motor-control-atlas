# AGENTS.md

本專案的完整規則在 [`CLAUDE.md`](./CLAUDE.md)，所有 AI 代理（Codex、Cursor、Claude 等）修改前請先完整閱讀。

重點摘要：

1. **技術**：純 HTML/CSS/JS，不用框架、CDN、外部字型或數學排版套件。
2. **新增方法**：複製 `templates/method-template.html` → `methods/<slug>.html` → 填 8 個固定區塊（`demo` 選用）→ 在 `data/methods.js` 加一筆。
3. **不要手改** `index.html`、`compare.html`：卡片與比較表由資料自動產生。
4. **正確性**：不可編造公式或文獻，不確定就寫「（待補）」。
5. **驗證**：完成後執行 `python3 tools/check.py`，全部通過才算完成。
