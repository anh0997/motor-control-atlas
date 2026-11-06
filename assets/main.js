// 首頁卡片、分類篩選、比較表、方法頁資訊列、上一頁/下一頁。
// 資料一律來自 data/methods.js。修改本檔前請先說明理由（CLAUDE.md 第 11 節）。
(function () {
  var CATS = window.CATEGORIES || [];
  var methods = (window.METHODS || []).map(function (m, i) { return { m: m, i: i }; })
    .sort(function (a, b) {
      var d = CATS.indexOf(a.m.category) - CATS.indexOf(b.m.category);
      return d !== 0 ? d : a.i - b.i;
    })
    .map(function (x) { return x.m; });

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function level(v) {
    var s = el("span", "level", v);
    s.setAttribute("data-level", v);
    return s;
  }
  var METRIC_LABELS = { dynamic: "動態響應", lowSpeed: "低速性能", complexity: "實作複雜度", sensor: "位置感測" };

  // ---------- 首頁 ----------
  var grid = document.getElementById("method-grid");
  if (grid) {
    var filter = document.getElementById("cat-filter");
    var active = "全部";
    var used = ["全部"].concat(CATS.filter(function (c) {
      return methods.some(function (m) { return m.category === c; });
    }));

    function renderCards() {
      grid.innerHTML = "";
      var shown = methods.filter(function (m) { return active === "全部" || m.category === active; });
      if (!shown.length) { grid.appendChild(el("li", "empty", "這個分類目前沒有方法。")); return; }
      shown.forEach(function (m) {
        var li = el("li", "method-card");
        var a = el("a");
        a.href = "methods/" + m.slug + ".html";
        a.appendChild(el("span", "abbr", m.abbr));
        a.appendChild(el("h3", null, m.name));
        a.appendChild(el("p", null, m.summary));
        var tags = el("div");
        tags.appendChild(el("span", "tag cat", m.category));
        if (m.widget) tags.appendChild(el("span", "tag", "🎛️ 互動"));
        a.appendChild(tags);
        li.appendChild(a);
        grid.appendChild(li);
      });
    }
    function renderFilter() {
      filter.innerHTML = "";
      used.forEach(function (c) {
        var b = el("button", c === active ? "active" : "", c);
        b.type = "button";
        b.addEventListener("click", function () { active = c; renderFilter(); renderCards(); });
        filter.appendChild(b);
      });
    }
    var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    set("stat-methods", methods.length);
    set("stat-cats", used.length - 1);
    set("stat-widgets", methods.filter(function (m) { return m.widget; }).length);
    renderFilter();
    renderCards();
  }

  // ---------- 比較表 ----------
  var tbody = document.getElementById("compare-body");
  if (tbody) {
    var motorSel = document.getElementById("motor-filter");
    (window.MOTORS || []).forEach(function (mt) {
      var o = el("option", null, mt); o.value = mt; motorSel.appendChild(o);
    });
    function renderTable() {
      tbody.innerHTML = "";
      var mt = motorSel.value;
      methods.filter(function (m) { return !mt || m.motors.indexOf(mt) !== -1; }).forEach(function (m) {
        var tr = el("tr");
        var td0 = el("td");
        var a = el("a", null, m.abbr); a.href = "methods/" + m.slug + ".html";
        td0.appendChild(a);
        tr.appendChild(td0);
        tr.appendChild(el("td", null, m.category));
        ["dynamic", "lowSpeed", "complexity"].forEach(function (k) {
          var td = el("td");
          td.appendChild(m.metrics ? level(m.metrics[k]) : el("span", "empty", "—"));
          tr.appendChild(td);
        });
        tr.appendChild(el("td", null, m.metrics ? m.metrics.sensor : "—（調變技術）"));
        tr.appendChild(el("td", null, m.motors.join("、")));
        tr.appendChild(el("td", "wrap", m.summary));
        tbody.appendChild(tr);
      });
    }
    motorSel.addEventListener("change", renderTable);
    renderTable();
  }

  // ---------- 方法頁 ----------
  var slug = document.body.getAttribute("data-method");
  if (!slug) return;
  var idx = methods.findIndex(function (m) { return m.slug === slug; });
  var meta = document.getElementById("method-meta");
  var nav = document.getElementById("method-nav");
  if (idx === -1) {
    if (meta) meta.appendChild(el("p", "empty", "（此方法尚未登記到 data/methods.js）"));
    return;
  }
  var me = methods[idx];

  if (meta) {
    function item(label, node) {
      var d = el("div", "meta-item");
      d.appendChild(el("small", null, label));
      if (typeof node === "string") d.appendChild(document.createTextNode(node)); else d.appendChild(node);
      meta.appendChild(d);
    }
    item("分類", me.category);
    item("適用馬達", me.motors.join("、"));
    if (me.metrics) {
      ["dynamic", "lowSpeed", "complexity"].forEach(function (k) { item(METRIC_LABELS[k], level(me.metrics[k])); });
      item(METRIC_LABELS.sensor, me.metrics.sensor);
    }
  }

  if (nav) {
    function link(m, cls, label) {
      var a = el("a", cls);
      a.href = m.slug + ".html";
      a.appendChild(el("small", null, label));
      a.appendChild(document.createTextNode(m.abbr + "｜" + m.name));
      return a;
    }
    if (idx > 0) nav.appendChild(link(methods[idx - 1], "prev", "← 上一個方法"));
    if (idx < methods.length - 1) nav.appendChild(link(methods[idx + 1], "next", "下一個方法 →"));
  }
})();
