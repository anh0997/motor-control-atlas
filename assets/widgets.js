// 互動模擬元件。頁面放 <div class="widget" data-widget="名稱"></div> 即可自動建立。
// 新增元件：在 WIDGETS 註冊函式並更新 CLAUDE.md 第 9 節（需先說明理由）。
(function () {
  var DEG = Math.PI / 180;

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function fmt(v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }

  // 建立滑桿：回傳 { input, set(v) }
  function slider(parent, label, min, max, step, value, unit, onInput) {
    var lab = el("label");
    var val = el("b");
    lab.appendChild(document.createTextNode(label + "："));
    lab.appendChild(val);
    var input = el("input");
    input.type = "range"; input.min = min; input.max = max; input.step = step; input.value = value;
    input.setAttribute("aria-label", label);
    lab.appendChild(input);
    parent.appendChild(lab);
    function show() { val.textContent = input.value + (unit ? " " + unit : ""); }
    input.addEventListener("input", function () { show(); onInput(); });
    show();
    return { input: input, get: function () { return parseFloat(input.value); }, set: function (v) { input.value = v; show(); } };
  }

  // 建立高 DPI 畫布；layout(w) 回傳高度
  function makeCanvas(root, layout, draw) {
    var c = el("canvas");
    root.appendChild(c);
    var ctx = c.getContext("2d");
    var size = { w: 0, h: 0 };
    function resize() {
      var w = c.clientWidth || root.clientWidth;
      var h = layout(w);
      var r = window.devicePixelRatio || 1;
      c.width = Math.round(w * r); c.height = Math.round(h * r);
      c.style.height = h + "px";
      ctx.setTransform(r, 0, 0, r, 0, 0);
      size.w = w; size.h = h;
      draw(ctx, w, h);
    }
    window.addEventListener("resize", resize);
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", resize);
    }
    return { resize: resize, redraw: function () { draw(ctx, size.w, size.h); } };
  }

  function readout(root, items) {
    var box = el("div", "readout");
    var cells = {};
    items.forEach(function (it) {
      var d = el("div");
      d.appendChild(el("small", null, it[1]));
      var v = el("span"); d.appendChild(v);
      box.appendChild(d);
      cells[it[0]] = v;
    });
    root.appendChild(box);
    return function (key, html) { cells[key].innerHTML = html; };
  }

  function arrow(ctx, x0, y0, x1, y1, color, width) {
    var a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width || 2;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (L < 6) return;
    var h = Math.min(10, L * 0.35);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - h * Math.cos(a - 0.4), y1 - h * Math.sin(a - 0.4));
    ctx.lineTo(x1 - h * Math.cos(a + 0.4), y1 - h * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
  }

  var WIDGETS = {};

  // ===================== V/f 曲線 =====================
  // 額定 380 V（線電壓）/ 60 Hz，4 極。f ≤ f_base：V = V_boost + (V_rated − V_boost)·f/f_base；f > f_base：V = V_rated（弱磁）
  WIDGETS["vf-curve"] = function (root) {
    var VR = 380, FB = 60, FMAX = 90, POLES = 4;
    var ctrls = el("div", "controls"); root.appendChild(ctrls);
    var sf = slider(ctrls, "輸出頻率 f", 0, FMAX, 1, 30, "Hz", update);
    var sb = slider(ctrls, "低頻電壓提升 V_boost", 0, 40, 1, 15, "V", update);
    var cv = makeCanvas(root, function (w) { return Math.max(220, Math.round(w * 0.5)); }, draw);
    var set = readout(root, [["v", "輸出電壓 V"], ["ns", "同步轉速 n<sub>s</sub>（4 極）"], ["flux", "V/f 比（相對額定）"], ["zone", "操作區"]]);

    function volt(f, vb) { return f <= FB ? vb + (VR - vb) * f / FB : VR; }

    function draw(ctx, w, h) {
      var f = sf.get(), vb = sb.get();
      var L = 46, R = 14, T = 14, B = 34, pw = w - L - R, ph = h - T - B;
      var X = function (fx) { return L + pw * fx / FMAX; };
      var Y = function (v) { return T + ph * (1 - v / 420); };
      var muted = cssVar("--muted"), border = cssVar("--border"), acc = cssVar("--accent"), acc2 = cssVar("--accent-2"), text = cssVar("--text");
      ctx.clearRect(0, 0, w, h);
      ctx.font = "12px system-ui, sans-serif";
      // 弱磁區
      ctx.fillStyle = cssVar("--surface-2");
      ctx.fillRect(X(FB), T, X(FMAX) - X(FB), ph);
      // 格線
      ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.fillStyle = muted;
      for (var fx = 0; fx <= FMAX; fx += 15) {
        ctx.beginPath(); ctx.moveTo(X(fx), T); ctx.lineTo(X(fx), T + ph); ctx.stroke();
        ctx.textAlign = "center"; ctx.fillText(fx, X(fx), T + ph + 16);
      }
      for (var v = 0; v <= 400; v += 100) {
        ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(L + pw, Y(v)); ctx.stroke();
        ctx.textAlign = "right"; ctx.fillText(v, L - 6, Y(v) + 4);
      }
      ctx.textAlign = "center"; ctx.fillText("頻率 f (Hz)", L + pw / 2, h - 4);
      ctx.save(); ctx.translate(12, T + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("電壓 V (V)", 0, 0); ctx.restore();
      ctx.textAlign = "left"; ctx.fillStyle = muted;
      ctx.fillText("弱磁區", X(FB) + 6, T + 16);
      // 理想 V/f（無提升）
      ctx.setLineDash([5, 4]); ctx.strokeStyle = muted;
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(FB), Y(VR)); ctx.stroke();
      ctx.setLineDash([]);
      // 實際曲線
      ctx.strokeStyle = acc; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(X(0), Y(vb)); ctx.lineTo(X(FB), Y(VR)); ctx.lineTo(X(FMAX), Y(VR)); ctx.stroke();
      // 操作點
      var vv = volt(f, vb);
      ctx.strokeStyle = acc2; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(f), T + ph); ctx.lineTo(X(f), Y(vv)); ctx.lineTo(L, Y(vv)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = acc2; ctx.beginPath(); ctx.arc(X(f), Y(vv), 5, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = text; ctx.textAlign = "left";
      ctx.fillText("虛線：理想 V/f（無提升）", L + 8, T + ph - 8);
    }

    function update() {
      var f = sf.get(), vb = sb.get(), v = volt(f, vb);
      set("v", fmt(v, 0) + " V");
      set("ns", fmt(120 * f / POLES, 0) + " rpm");
      set("flux", f === 0 ? "—" : fmt((v / f) / (VR / FB) * 100, 0) + " %");
      set("zone", f <= FB ? "定 V/f（定轉矩）" : "弱磁（定功率）");
      cv.redraw();
    }
    cv.resize(); update();
  };

  // ===================== Clarke / Park =====================
  // i_a = I cos(θe+γ)，i_b、i_c 落後/超前 120°；Clarke（振幅不變）、Park 以 θe 旋轉 → i_d = I cosγ、i_q = I sinγ
  WIDGETS["park"] = function (root) {
    var ctrls = el("div", "controls"); root.appendChild(ctrls);
    var st = slider(ctrls, "電角度 θe", 0, 360, 1, 30, "°", update);
    var sg = slider(ctrls, "電流角 γ（0°＝全 i_d，90°＝全 i_q）", 0, 90, 1, 70, "°", update);
    var btnWrap = el("div"); ctrls.appendChild(btnWrap);
    var btn = el("button", null, "▶ 播放旋轉"); btn.type = "button"; btnWrap.appendChild(btn);
    var playing = false, last = 0;
    btn.addEventListener("click", function () {
      playing = !playing; btn.textContent = playing ? "⏸ 暫停" : "▶ 播放旋轉";
      if (playing) { last = 0; requestAnimationFrame(tick); }
    });
    function tick(t) {
      if (!playing) return;
      if (last) st.set((st.get() + (t - last) * 0.09) % 360);
      last = t; update(); requestAnimationFrame(tick);
    }

    var wide = true;
    var cv = makeCanvas(root, function (w) { wide = w >= 560; return wide ? Math.round(w * 0.46) : Math.round(w * 1.55); }, draw);
    var set = readout(root, [["abc", "i<sub>a</sub> / i<sub>b</sub> / i<sub>c</sub>"], ["ab", "i<sub>α</sub> / i<sub>β</sub>"], ["dq", "i<sub>d</sub> / i<sub>q</sub>"]]);

    function vals() {
      var th = st.get() * DEG, g = sg.get() * DEG;
      var ia = Math.cos(th + g), ib = Math.cos(th + g - 120 * DEG), ic = Math.cos(th + g + 120 * DEG);
      var ial = ia, ibe = (ia + 2 * ib) / Math.sqrt(3);
      var id = ial * Math.cos(th) + ibe * Math.sin(th), iq = -ial * Math.sin(th) + ibe * Math.cos(th);
      return { th: th, g: g, ia: ia, ib: ib, ic: ic, ial: ial, ibe: ibe, id: id, iq: iq };
    }

    function draw(ctx, w, h) {
      var s = vals();
      var muted = cssVar("--muted"), border = cssVar("--border"), text = cssVar("--text");
      var cA = cssVar("--accent"), cB = cssVar("--accent-2"), cC = cssVar("--accent-3"), cGood = cssVar("--good"), cBad = cssVar("--bad");
      ctx.clearRect(0, 0, w, h);
      ctx.font = "12px system-ui, sans-serif";

      // --- 左/上：αβ 平面 ---
      var pw = wide ? w * 0.42 : w, phh = wide ? h : w;
      var cx = pw / 2, cy = phh / 2, r = Math.min(pw, phh) / 2 - 26;
      ctx.strokeStyle = border; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - r - 10, cy); ctx.lineTo(cx + r + 10, cy); ctx.moveTo(cx, cy + r + 10); ctx.lineTo(cx, cy - r - 10); ctx.stroke();
      ctx.fillStyle = muted; ctx.textAlign = "left";
      ctx.fillText("α", cx + r + 2, cy - 6); ctx.fillText("β", cx + 6, cy - r - 2);
      // d-q 軸
      var dx = Math.cos(s.th), dy = Math.sin(s.th);
      ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5;
      ctx.strokeStyle = cGood; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * (r + 8), cy - dy * (r + 8)); ctx.stroke();
      ctx.strokeStyle = cBad; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - dy * (r + 8), cy - dx * (r + 8)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = cGood; ctx.fillText("d", cx + dx * (r + 14) - 3, cy - dy * (r + 14) + 4);
      ctx.fillStyle = cBad; ctx.fillText("q", cx - dy * (r + 14) - 3, cy - dx * (r + 14) + 4);
      // 投影
      ctx.strokeStyle = cGood; ctx.lineWidth = 4; ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * r * s.id, cy - dy * r * s.id); ctx.stroke();
      ctx.strokeStyle = cBad;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - dy * r * s.iq, cy - dx * r * s.iq); ctx.stroke();
      ctx.globalAlpha = 1;
      // 電流向量
      arrow(ctx, cx, cy, cx + s.ial * r, cy - s.ibe * r, text, 2.5);
      ctx.fillStyle = text; ctx.fillText("i_s", cx + s.ial * r + 6, cy - s.ibe * r - 6);

      // --- 右/下：波形 ---
      var ox = wide ? pw + 24 : 40, oy = wide ? 16 : phh + 16;
      var ww = (wide ? w - pw - 36 : w - 52), hh = (wide ? h - 40 : h - phh - 44);
      var X = function (deg) { return ox + ww * deg / 360; };
      var Y = function (v) { return oy + hh / 2 - v * hh / 2 * 0.9; };
      ctx.strokeStyle = border; ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, ww, hh);
      ctx.beginPath(); ctx.moveTo(ox, Y(0)); ctx.lineTo(ox + ww, Y(0)); ctx.stroke();
      ctx.fillStyle = muted; ctx.textAlign = "center";
      [0, 90, 180, 270, 360].forEach(function (d) { ctx.fillText(d + "°", X(d), oy + hh + 14); });
      ctx.textAlign = "right"; ctx.fillText("+1", ox - 4, Y(1) + 4); ctx.fillText("−1", ox - 4, Y(-1) + 4);

      function wave(fn, color, width, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []);
        ctx.beginPath();
        for (var d = 0; d <= 360; d += 3) { var y = Y(fn(d * DEG)); if (d === 0) ctx.moveTo(X(d), y); else ctx.lineTo(X(d), y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      wave(function (t) { return Math.cos(t + s.g); }, cA, 1.6);
      wave(function (t) { return Math.cos(t + s.g - 120 * DEG); }, cB, 1.6);
      wave(function (t) { return Math.cos(t + s.g + 120 * DEG); }, cC, 1.6);
      wave(function () { return Math.cos(s.g); }, cGood, 2.5, [6, 4]);
      wave(function () { return Math.sin(s.g); }, cBad, 2.5, [6, 4]);
      ctx.strokeStyle = text; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(st.get()), oy); ctx.lineTo(X(st.get()), oy + hh); ctx.stroke();
      // 圖例
      ctx.textAlign = "left";
      var lg = [["i_a", cA], ["i_b", cB], ["i_c", cC], ["i_d", cGood], ["i_q", cBad]];
      lg.forEach(function (it, k) {
        var lx = ox + 6 + k * 44, ly = oy + 14;
        ctx.fillStyle = it[1]; ctx.fillRect(lx, ly - 8, 10, 3); ctx.fillText(it[0], lx + 13, ly - 3);
      });
    }

    function update() {
      var s = vals();
      set("abc", fmt(s.ia, 2) + " / " + fmt(s.ib, 2) + " / " + fmt(s.ic, 2));
      set("ab", fmt(s.ial, 2) + " / " + fmt(s.ibe, 2));
      set("dq", "<b>" + fmt(s.id, 2) + " / " + fmt(s.iq, 2) + "</b>（不隨 θe 改變）");
      cv.redraw();
    }
    cv.resize(); update();
  };

  // ===================== SVPWM 六邊形 =====================
  // m = |V_ref| / (V_dc/√3)；T1/Ts = m·sin(60°−θr)、T2/Ts = m·sin(θr)、T0 = Ts − T1 − T2
  WIDGETS["svpwm-hex"] = function (root) {
    var ctrls = el("div", "controls"); root.appendChild(ctrls);
    var sa = slider(ctrls, "命令電壓角度 θ", 0, 359, 1, 40, "°", update);
    var sm = slider(ctrls, "調變指數 m（1＝線性區上限）", 0, 1.15, 0.01, 0.8, "", update);
    var cv = makeCanvas(root, function (w) { return Math.min(Math.round(w * 0.82), 460); }, draw);
    var set = readout(root, [["sec", "扇區"], ["t1", "T<sub>1</sub>/T<sub>s</sub>"], ["t2", "T<sub>2</sub>/T<sub>s</sub>"], ["t0", "T<sub>0</sub>/T<sub>s</sub>"], ["duty", "三相責任比 a / b / c"]]);
    var status = el("div", "status"); root.appendChild(status);
    var CODES = ["100", "110", "010", "011", "001", "101"];

    function calc() {
      var th = sa.get(), m = sm.get();
      var sec = Math.floor(th / 60) % 6, thr = (th - sec * 60) * DEG;
      var t1 = m * Math.sin(60 * DEG - thr), t2 = m * Math.sin(thr), t0 = 1 - t1 - t2, over = t0 < 0;
      if (over) { var k = t1 + t2; t1 /= k; t2 /= k; t0 = 0; }
      // min-max 零序注入（等效置中 SVPWM）：d = 0.5 + (v − (vmax+vmin)/2)/Vdc，v 以 V_dc 為單位
      var amp = m / Math.sqrt(3), a = th * DEG;
      var v = [Math.cos(a), Math.cos(a - 120 * DEG), Math.cos(a + 120 * DEG)].map(function (x) { return amp * x; });
      var off = (Math.max.apply(null, v) + Math.min.apply(null, v)) / 2;
      var d = v.map(function (x) { return Math.min(1, Math.max(0, 0.5 + x - off)); });
      return { th: th, m: m, sec: sec, t1: t1, t2: t2, t0: t0, over: over, d: d };
    }

    function draw(ctx, w, h) {
      var s = calc();
      var cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 34;
      var muted = cssVar("--muted"), border = cssVar("--border"), text = cssVar("--text"), acc = cssVar("--accent"), acc2 = cssVar("--accent-2"), acc3 = cssVar("--accent-3"), warn = cssVar("--warn");
      ctx.clearRect(0, 0, w, h);
      ctx.font = "12px system-ui, sans-serif";
      function P(ang, rr) { return [cx + rr * Math.cos(ang * DEG), cy - rr * Math.sin(ang * DEG)]; }
      // 目前扇區
      ctx.fillStyle = cssVar("--accent-soft");
      var p1 = P(s.sec * 60, R), p2 = P(s.sec * 60 + 60, R);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.closePath(); ctx.fill();
      // 六邊形
      ctx.strokeStyle = border; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var k = 0; k <= 6; k++) { var p = P(k * 60, R); if (k === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
      ctx.stroke();
      // 線性區內切圓
      ctx.setLineDash([5, 4]); ctx.strokeStyle = muted;
      ctx.beginPath(); ctx.arc(cx, cy, R * Math.sqrt(3) / 2, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      // 主動向量
      for (k = 0; k < 6; k++) {
        var q = P(k * 60, R);
        arrow(ctx, cx, cy, q[0], q[1], border, 1.2);
        var lb = P(k * 60, R + 18);
        ctx.fillStyle = (k === s.sec || k === (s.sec + 1) % 6) ? text : muted;
        ctx.textAlign = "center";
        ctx.fillText("V" + (k + 1) + "(" + CODES[k] + ")", lb[0], lb[1] + 4);
      }
      ctx.fillStyle = muted; ctx.fillText("V0 / V7", cx, cy + 16);
      // 分量平行四邊形
      var ka = s.sec * 60, kb = ka + 60;
      var A = P(ka, R * s.t1), Bv = [A[0] + R * s.t2 * Math.cos(kb * DEG), A[1] - R * s.t2 * Math.sin(kb * DEG)];
      arrow(ctx, cx, cy, A[0], A[1], acc, 3);
      arrow(ctx, A[0], A[1], Bv[0], Bv[1], acc3, 3);
      // 命令向量
      var rr = R * Math.sqrt(3) / 2 * s.m;
      var V = P(s.th, rr);
      arrow(ctx, cx, cy, V[0], V[1], s.over ? warn : acc2, 2.5);
      ctx.fillStyle = s.over ? warn : acc2; ctx.textAlign = "left";
      ctx.fillText("V_ref", V[0] + 6, V[1] - 6);
      ctx.fillStyle = muted;
      ctx.fillText("虛線圓：線性調變上限 |V_ref| = V_dc/√3", 8, h - 8);
    }

    function pct(x) { return fmt(x * 100, 1) + " %"; }
    function update() {
      var s = calc();
      set("sec", "第 " + (s.sec + 1) + " 扇區（V" + (s.sec + 1) + "、V" + ((s.sec + 1) % 6 + 1) + "）");
      set("t1", pct(s.t1)); set("t2", pct(s.t2)); set("t0", pct(s.t0));
      set("duty", s.d.map(function (x) { return fmt(x * 100, 0); }).join(" / ") + " %");
      status.className = "status" + (s.over ? " warn" : "");
      status.textContent = s.over
        ? "⚠ 過調變：T1 + T2 > Ts，命令向量超出六邊形，已等比例縮放（輸出電壓會失真）。"
        : "線性調變區：T0 ≥ 0，可完整合成命令電壓。";
      cv.redraw();
    }
    cv.resize(); update();
  };

  // ---------- 掛載 ----------
  window.WIDGETS = WIDGETS;
  document.querySelectorAll(".widget[data-widget]").forEach(function (root) {
    var name = root.getAttribute("data-widget");
    if (WIDGETS[name]) WIDGETS[name](root);
    else root.textContent = "（找不到互動元件：" + name + "）";
  });
})();
