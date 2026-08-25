/* Shared interactive helpers for HTML dashboard mockups (no backend).
   Classic script (no modules) so file:// downloads work. */
(function (global) {
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return [...(root || document).querySelectorAll(sel)]; }

  function toast(message) {
    var host = $(".toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      document.body.appendChild(host);
    }
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }

  function formatMoney(n, currency) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0
    }).format(n);
  }

  function formatNum(n) {
    return new Intl.NumberFormat("en-US").format(n);
  }

  function animateValue(el, to, opts) {
    opts = opts || {};
    var money = !!opts.money;
    var duration = opts.duration || 700;
    var start = performance.now();
    function frame(t) {
      var p = Math.min(1, (t - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = to * eased;
      el.textContent = money ? formatMoney(val) : formatNum(Math.round(val));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function drawLineChart(svg, series, opts) {
    opts = opts || {};
    var stroke = opts.stroke || "var(--accent)";
    var fill = opts.fill !== false;
    var w = 600, h = 220, pad = 24;
    var max = Math.max.apply(null, series) * 1.08;
    var min = Math.min.apply(null, series) * 0.92;
    var pts = series.map(function (v, i) {
      var x = pad + (i * (w - pad * 2)) / (series.length - 1);
      var y = pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2);
      return [x, y];
    });
    var d = pts.map(function (p, i) {
      return (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1);
    }).join(" ");
    var area = d + " L" + pts[pts.length - 1][0] + "," + (h - pad) + " L" + pts[0][0] + "," + (h - pad) + " Z";
    var gid = svg.id || ("chart" + Math.random().toString(36).slice(2, 7));
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.innerHTML =
      '<defs><linearGradient id="g-' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + stroke + '" stop-opacity="0.28"/>' +
      '<stop offset="100%" stop-color="' + stroke + '" stop-opacity="0"/>' +
      "</linearGradient></defs>" +
      [0.25, 0.5, 0.75].map(function (t) {
        var y = pad + t * (h - pad * 2);
        return '<line x1="' + pad + '" x2="' + (w - pad) + '" y1="' + y + '" y2="' + y + '" stroke="#d7dee6" stroke-dasharray="4 6"/>';
      }).join("") +
      (fill ? '<path d="' + area + '" fill="url(#g-' + gid + ')"/>' : "") +
      '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      pts.map(function (p) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" fill="#fff" stroke="' + stroke + '" stroke-width="2"/>';
      }).join("");
  }

  function drawBarChart(svg, labels, values, opts) {
    opts = opts || {};
    var color = opts.color || "var(--accent)";
    var w = 600, h = 220, pad = 28;
    var max = Math.max.apply(null, values) * 1.15 || 1;
    var bw = (w - pad * 2) / values.length;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.innerHTML = values.map(function (v, i) {
      var barH = (v / max) * (h - pad * 2);
      var x = pad + i * bw + bw * 0.18;
      var y = h - pad - barH;
      var width = bw * 0.64;
      return (
        '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + barH + '" rx="6" fill="' + color + '" opacity="' + (0.55 + (i / values.length) * 0.45) + '"/>' +
        '<text x="' + (x + width / 2) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="11" fill="#5c6b7a">' + labels[i] + "</text>"
      );
    }).join("");
  }

  function drawHBars(svg, rows, opts) {
    opts = opts || {};
    var color = opts.color || "var(--accent)";
    var w = 520, rowH = 36, pad = 8;
    var h = rows.length * rowH + pad * 2;
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; })) || 1;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.innerHTML = rows.map(function (r, i) {
      var y = pad + i * rowH;
      var barW = (r.value / max) * 280;
      return (
        '<text x="0" y="' + (y + 18) + '" font-size="12" fill="#14202b">' + r.label + "</text>" +
        '<rect x="140" y="' + (y + 6) + '" width="280" height="16" rx="8" fill="#eef1f4"/>' +
        '<rect x="140" y="' + (y + 6) + '" width="' + barW + '" height="16" rx="8" fill="' + color + '"/>' +
        '<text x="430" y="' + (y + 18) + '" font-size="12" fill="#5c6b7a">' + (r.display != null ? r.display : r.value) + "</text>"
      );
    }).join("");
  }

  function wireTableFilter(input, table) {
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      $all("tbody tr", table).forEach(function (tr) {
        tr.style.display = tr.textContent.toLowerCase().indexOf(q) !== -1 ? "" : "none";
      });
    });
  }

  function wirePills(container, onChange) {
    $all(".pill", container).forEach(function (btn) {
      btn.addEventListener("click", function () {
        $all(".pill", container).forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        onChange(btn.dataset.value, btn);
      });
    });
  }

  function wireRoleSwitch(root, onChange) {
    var buttons = $all("button", root);
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        onChange(btn.dataset.role);
        toast("Viewing as " + btn.dataset.role);
      });
    });
  }

  function tickLiveClock(el) {
    function render() {
      el.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    render();
    setInterval(render, 1000);
  }

  function prependFeed(host, item) {
    var row = document.createElement("div");
    row.className = "feed-item";
    row.innerHTML =
      '<div class="dot" style="background:' + (item.color || "var(--accent)") + '"></div>' +
      "<div><strong>" + item.title + "</strong><span>" + item.detail + "</span></div>" +
      '<span class="muted">' + (item.when || "just now") + "</span>";
    host.insertBefore(row, host.firstChild);
    while (host.children.length > 8) host.removeChild(host.lastChild);
  }

  function sidebarActive() {
    var path = location.pathname.split("/").pop() || "index.html";
    $all(".nav a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href.split("/").pop() === path) a.classList.add("active");
    });
  }

  document.addEventListener("DOMContentLoaded", sidebarActive);

  global.Mockup = {
    $, $all, toast, formatMoney, formatNum, animateValue,
    drawLineChart, drawBarChart, drawHBars,
    wireTableFilter, wirePills, wireRoleSwitch, tickLiveClock, prependFeed
  };
})(window);
