#!/usr/bin/env python3
"""依 CLAUDE.md 第 12 節自動檢查專案規則。用法：python3 tools/check.py
只使用 Python 標準函式庫。全部通過時結束碼為 0。"""
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
REQUIRED = ["overview", "principle", "formula", "architecture", "pros-cons", "dsp", "refs"]
errors, notes = [], []


def err(where, msg):
    errors.append(f"✗ {where}: {msg}")


# ---------- 讀取 data/methods.js ----------
def js_value(src, name):
    m = re.search(r"window\." + name + r"\s*=\s*(\[.*?\]);", src, re.S)
    if not m:
        err("data/methods.js", f"找不到 window.{name}")
        return []
    body = re.sub(r"//[^\n]*", "", m.group(1))
    body = re.sub(r"([{,]\s*)([A-Za-z_]\w*)\s*:", r'\1"\2":', body)
    body = re.sub(r",(\s*[}\]])", r"\1", body)
    try:
        return json.loads(body)
    except json.JSONDecodeError as e:
        err("data/methods.js", f"window.{name} 格式無法解析（{e}）")
        return []


src = (ROOT / "data/methods.js").read_text(encoding="utf-8")
CATS, MOTORS, LEVELS = js_value(src, "CATEGORIES"), js_value(src, "MOTORS"), js_value(src, "LEVELS")
METHODS = js_value(src, "METHODS")
widgets_src = (ROOT / "assets/widgets.js").read_text(encoding="utf-8")
REGISTERED = set(re.findall(r'WIDGETS\["([\w-]+)"\]\s*=', widgets_src))

slugs = [m.get("slug") for m in METHODS]
if len(slugs) != len(set(slugs)):
    err("data/methods.js", "slug 重複")

for m in METHODS:
    w = f"methods.js[{m.get('slug')}]"
    for k in ["slug", "abbr", "name", "nameEn", "category", "motors", "summary", "metrics", "widget"]:
        if k not in m:
            err(w, f"缺少欄位 {k}")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", m.get("slug", "")):
        err(w, "slug 需全小寫、用 - 連接")
    if m.get("category") not in CATS:
        err(w, f"分類「{m.get('category')}」不在 CATEGORIES")
    mt = m.get("motors", [])
    if not (1 <= len(mt) <= 3) or any(x not in MOTORS for x in mt):
        err(w, "motors 需 1～3 個且都在 MOTORS 內")
    if len(m.get("summary", "")) > 40:
        err(w, f"summary 超過 40 字（{len(m['summary'])}）")
    if len(m.get("abbr", "")) > 10:
        err(w, "abbr 超過 10 字元")
    if len(m.get("name", "")) > 10:
        err(w, "name 超過 10 字")
    met = m.get("metrics")
    if m.get("category") == "調變技術":
        if met is not None:
            err(w, "調變技術類的 metrics 應為 null")
    elif not isinstance(met, dict):
        err(w, "控制方法必須填 metrics")
    else:
        for k in ["dynamic", "lowSpeed", "complexity"]:
            if met.get(k) not in LEVELS:
                err(w, f"metrics.{k} 必須是 {LEVELS}")
        if not met.get("sensor") or len(met["sensor"]) > 15:
            err(w, "metrics.sensor 必填且 15 字內")
    if m.get("widget") and m["widget"] not in REGISTERED:
        err(w, f"widget「{m['widget']}」未在 widgets.js 註冊")
    if not (ROOT / "methods" / f"{m.get('slug')}.html").exists():
        err(w, "找不到對應的 methods/<slug>.html")


# ---------- 解析 HTML ----------
class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.body_attrs, self.title, self._in_title = {}, "", False
        self.sections, self.cur = [], None
        self.inline_style, self.external = False, []
        self.widgets, self.ids = [], set()
        self.stack = []  # (tag, classes, section)
        self.counts = {}  # (section, key) -> n

    def bump(self, key):
        k = (self.cur, key)
        self.counts[k] = self.counts.get(k, 0) + 1

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = (a.get("class") or "").split()
        if "style" in a:
            self.inline_style = True
        for k in ("src", "href"):
            if re.match(r"https?://|//", a.get(k) or ""):
                self.external.append(a[k])
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "body":
            self.body_attrs = a
        if tag == "title":
            self._in_title = True
        if tag == "section":
            self.cur = a.get("id")
            self.sections.append(self.cur)
        if "widget" in cls and a.get("data-widget"):
            self.widgets.append(a["data-widget"])
        for c in ("formula", "formula-note"):
            if c in cls:
                self.bump(c)
        if tag == "li" and self.stack:
            parent_tag, parent_cls = self.stack[-1][0], self.stack[-1][1]
            for c in ("key-points", "flow", "steps", "refs", "pros", "cons"):
                if c in parent_cls:
                    self.bump(c + ":li")
        if tag in ("ul", "ol"):
            for c in ("flow",):
                if c in cls:
                    self.bump("flow-list")
        if tag not in ("br", "img", "meta", "link", "input", "hr"):
            self.stack.append((tag, cls))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag == "section":
            self.cur = None
        while self.stack:
            t, _ = self.stack.pop()
            if t == tag:
                break

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def parse(path):
    p = Page()
    p.feed(path.read_text(encoding="utf-8"))
    return p


def rng(page, sec, key, lo, hi, where, label):
    n = page.counts.get((sec, key), 0)
    if not (lo <= n <= hi):
        err(where, f"{label} 應為 {lo}～{hi} 個（目前 {n}）")


by_slug = {m.get("slug"): m for m in METHODS}
for f in sorted((ROOT / "methods").glob("*.html")):
    w = f"methods/{f.name}"
    p = parse(f)
    slug = f.stem
    if p.body_attrs.get("data-method") != slug:
        err(w, f"data-method（{p.body_attrs.get('data-method')}）與檔名不一致")
    m = by_slug.get(slug)
    if not m:
        err(w, "尚未登記到 data/methods.js")
        continue
    expect_title = f"{m['abbr']}｜{m['name']}｜馬達控制方法圖鑑"
    if p.title.strip() != expect_title:
        err(w, f"<title> 應為「{expect_title}」")
    order = [s for s in p.sections]
    has_demo = "demo" in order
    expect = REQUIRED[:3] + (["demo"] if has_demo else []) + REQUIRED[3:]
    if order != expect:
        err(w, f"section 順序應為 {expect}，目前 {order}")
    for need in ("method-meta", "method-nav"):
        if need not in p.ids:
            err(w, f"缺少 #{need}")
    rng(p, "overview", "key-points:li", 3, 4, w, "overview 重點")
    rng(p, "formula", "formula", 2, 4, w, "formula 公式")
    if p.counts.get(("formula", "formula")) != p.counts.get(("formula", "formula-note")):
        err(w, "每個 .formula 都要有一個 .formula-note")
    flows = p.counts.get(("architecture", "flow-list"), 0)
    if flows < 1:
        err(w, "architecture 需要 <ol class=\"flow\">")
    else:
        n = p.counts.get(("architecture", "flow:li"), 0)
        if not (4 * flows <= n <= 8 * flows):
            err(w, f"每個 flow 需 4～8 個方塊（共 {flows} 個 flow、{n} 個方塊）")
    rng(p, "pros-cons", "pros:li", 2, 4, w, "優點")
    rng(p, "pros-cons", "cons:li", 2, 4, w, "限制")
    rng(p, "dsp", "steps:li", 3, 5, w, "DSP 要點")
    rng(p, "refs", "refs:li", 1, 3, w, "參考文獻")
    if has_demo:
        if len(p.widgets) != 1:
            err(w, "demo 區塊需剛好一個 .widget")
        elif p.widgets[0] != m.get("widget"):
            err(w, f"data-widget（{p.widgets[0]}）與 methods.js 的 widget（{m.get('widget')}）不一致")
    elif m.get("widget"):
        err(w, "methods.js 有填 widget，但頁面沒有 demo 區塊")
    for wd in p.widgets:
        if wd not in REGISTERED:
            err(w, f"data-widget「{wd}」未在 widgets.js 註冊")

# ---------- 全站共通 ----------
for f in sorted(ROOT.glob("*.html")) + sorted((ROOT / "methods").glob("*.html")) + sorted((ROOT / "templates").glob("*.html")):
    p = parse(f)
    w = str(f.relative_to(ROOT))
    if p.inline_style:
        err(w, "不可使用 inline style")
    if p.external:
        err(w, f"不可引用外部資源：{p.external}")
for f in (ROOT / "index.html", ROOT / "compare.html"):
    if "method-card" in f.read_text(encoding="utf-8"):
        err(f.name, "不可手動寫入方法卡片")
css = (ROOT / "assets/style.css").read_text(encoding="utf-8")
if re.search(r"@import|url\(\s*['\"]?https?:", css):
    err("assets/style.css", "不可引用外部資源")

# ---------- 結果 ----------
print(f"方法數：{len(METHODS)}，已註冊互動元件：{', '.join(sorted(REGISTERED))}")
if errors:
    print("\n".join(errors))
    print(f"\n共 {len(errors)} 項未通過，請依 CLAUDE.md 修正。")
    sys.exit(1)
print("✓ 全部通過")
