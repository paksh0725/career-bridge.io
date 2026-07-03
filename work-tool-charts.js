(function () {
  var COLORS = ['#4F83B8', '#3F8F78', '#9A7B36', '#7B6CB8', '#C05F6A', '#6E8797'];

  function buildChart(el) {
    if (el.classList.contains('line-chart-ready')) return;
    var labels = JSON.parse(el.getAttribute('data-labels') || '[]');
    var series = JSON.parse(el.getAttribute('data-series') || '[]');
    var suffix = el.getAttribute('data-suffix') || '';
    if (!labels.length || !series.length) return;

    var W = 400;
    var H = 132;
    var PL = 12;
    var PR = 36;
    var PT = 14;
    var PB = 8;
    var chartW = W - PL - PR;
    var chartH = H - PT - PB;
    var allVals = [];
    series.forEach(function (s) {
      allVals = allVals.concat(s.values || []);
    });
    var minV = Math.min.apply(null, allVals);
    var maxV = Math.max.apply(null, allVals);
    var pad = (maxV - minV) * 0.12 || maxV * 0.08 || 1;
    minV = Math.max(0, minV - pad);
    maxV = maxV + pad;
    var n = labels.length;

    function xAt(i) {
      return PL + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW);
    }
    function yAt(v) {
      return PT + chartH - ((v - minV) / (maxV - minV)) * chartH;
    }

    var svg =
      '<svg class="line-chart-svg" viewBox="0 0 ' +
      W +
      ' ' +
      H +
      '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';

    for (var g = 0; g < 4; g++) {
      var gy = PT + (g / 3) * chartH;
      svg +=
        '<line class="line-grid" x1="' +
        PL +
        '" y1="' +
        gy +
        '" x2="' +
        (W - PR) +
        '" y2="' +
        gy +
        '"/>';
    }

    series.forEach(function (s, si) {
      var color = s.color || COLORS[si % COLORS.length];
      var vals = s.values || [];
      var pathD = vals
        .map(function (v, i) {
          return (i === 0 ? 'M' : 'L') + xAt(i) + ',' + yAt(v);
        })
        .join(' ');
      var areaD =
        pathD +
        ' L' +
        xAt(n - 1) +
        ',' +
        (PT + chartH) +
        ' L' +
        xAt(0) +
        ',' +
        (PT + chartH) +
        ' Z';
      svg +=
        '<path class="line-area" d="' +
        areaD +
        '" fill="' +
        color +
        '"/>';
      svg +=
        '<path class="line-path" d="' +
        pathD +
        '" stroke="' +
        color +
        '"/>';
      vals.forEach(function (v, i) {
        var isLast = i === n - 1;
        svg +=
          '<circle class="line-dot' +
          (isLast ? ' line-dot-last' : '') +
          '" cx="' +
          xAt(i) +
          '" cy="' +
          yAt(v) +
          '" r="' +
          (isLast ? 4 : 2.5) +
          '" fill="' +
          color +
          '"/>';
      });
      var last = vals[vals.length - 1];
      svg +=
        '<text class="line-end-label" x="' +
        (xAt(n - 1) + 6) +
        '" y="' +
        (yAt(last) + 4) +
        '" fill="' +
        color +
        '">' +
        last +
        suffix +
        '</text>';
    });

    svg += '</svg>';

    var legend = series
      .map(function (s, si) {
        var color = s.color || COLORS[si % COLORS.length];
        var last = (s.values || [])[(s.values || []).length - 1];
        return (
          '<span class="line-legend-item"><i style="background:' +
          color +
          '"></i>' +
          s.name +
          ' <b>' +
          last +
          suffix +
          '</b></span>'
        );
      })
      .join('');

    var xlabels = labels.map(function (l) {
      return '<span>' + l + '</span>';
    }).join('');

    el.innerHTML =
      '<div class="line-chart-body">' +
      svg +
      '</div>' +
      '<div class="line-chart-xlabels">' +
      xlabels +
      '</div>' +
      '<div class="line-chart-legend">' +
      legend +
      '</div>';
    el.classList.add('line-chart-ready');
  }

  function initLineCharts(root) {
    (root || document).querySelectorAll('.line-chart-host').forEach(buildChart);
  }

  function refreshLineCharts(root) {
    (root || document).querySelectorAll('.line-chart-host').forEach(function (el) {
      el.classList.remove('line-chart-ready');
      el.innerHTML = '';
      buildChart(el);
    });
  }

  window.initLineCharts = initLineCharts;
  window.refreshLineCharts = refreshLineCharts;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initLineCharts();
    });
  } else {
    initLineCharts();
  }
})();
