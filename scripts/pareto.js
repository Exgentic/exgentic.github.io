// SVG Pareto Chart — reads processed data from leaderboard.js via window._chartData
(() => {
  const MODEL_DISPLAY = {
    'claude-opus-4.5': 'Claude Opus 4.5',
    'gpt-5.2': 'GPT 5.2',
    'gemini-3-pro': 'Gemini Pro 3',
    'deepseek-v3.2': 'DeepSeek V3.2',
    'kimi-k2.5': 'Kimi K2.5'
  };
  const MODEL_COLORS = {
    'claude-opus-4.5': '#5ba8a0',
    'gpt-5.2': '#9b8ec4',
    'gemini-3-pro': '#6a8cbe',
    'deepseek-v3.2': '#bf72b0',
    'kimi-k2.5': '#5fbf94'
  };
  const AGENT_DISPLAY = {
    'Claude_Code': 'Claude Code',
    'OpenAI_Solo': 'OpenAI Solo',
    'Smolagent': 'Smolagent',
    'React': 'React',
    'React_+_Shortlisting': 'React + Shortlist'
  };

  const ns = 'http://www.w3.org/2000/svg';

  function el(tag, attrs) {
    const e = document.createElementNS(ns, tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }

  function makeShape(agent, x, y, color) {
    const g = el('g');
    const common = { fill: color, 'fill-opacity': '0.82', stroke: 'rgba(128,128,128,0.3)', 'stroke-width': '1.5' };
    let shape;

    if (agent === 'Claude_Code') {
      const half = 9;
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? half : half * 0.42;
        const a = i * Math.PI / 5 - Math.PI / 2;
        pts.push((x + r * Math.cos(a)).toFixed(1) + ',' + (y + r * Math.sin(a)).toFixed(1));
      }
      shape = el('polygon', { points: pts.join(' '), ...common });
    } else if (agent === 'OpenAI_Solo') {
      const half = 8;
      shape = el('polygon', { points: `${x},${y - half} ${x + half},${y} ${x},${y + half} ${x - half},${y}`, ...common });
    } else if (agent === 'Smolagent') {
      const half = 8.5;
      shape = el('polygon', { points: `${x},${y - half} ${x + half},${y + half} ${x - half},${y + half}`, ...common });
    } else if (agent === 'React_+_Shortlisting') {
      const half = 6.5;
      shape = el('rect', { x: x - half, y: y - half, width: half * 2, height: half * 2, rx: 2, ...common });
    } else {
      const half = 7;
      shape = el('circle', { cx: x, cy: y, r: half, ...common });
    }

    g.appendChild(shape);
    // Invisible larger hit area for hover
    g.appendChild(el('circle', { cx: x, cy: y, r: 20, fill: 'transparent', cursor: 'pointer' }));
    return g;
  }

  function makeLegendShapeSVG(agent) {
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 14 14');
    const common = { fill: 'var(--text-muted)', 'fill-opacity': '0.5', stroke: 'var(--text-muted)', 'stroke-width': '0.8' };
    let shape;
    if (agent === 'Claude_Code') {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 6 : 6 * 0.42;
        const a = i * Math.PI / 5 - Math.PI / 2;
        pts.push((7 + r * Math.cos(a)).toFixed(1) + ',' + (7 + r * Math.sin(a)).toFixed(1));
      }
      shape = el('polygon', { points: pts.join(' '), ...common });
    } else if (agent === 'OpenAI_Solo') {
      shape = el('polygon', { points: '7,1 11,7 7,13 3,7', ...common });
    } else if (agent === 'Smolagent') {
      shape = el('polygon', { points: '7,2 12,12 2,12', ...common });
    } else if (agent === 'React_+_Shortlisting') {
      shape = el('rect', { x: 2, y: 2, width: 10, height: 10, rx: 1.5, ...common });
    } else {
      shape = el('circle', { cx: 7, cy: 7, r: 5, ...common });
    }
    svg.appendChild(shape);
    return svg;
  }

  function renderParetoChart(data) {
    const container = document.getElementById('paretoChartContainer');
    if (!container) return;
    container.innerHTML = '';

    // Build chart data from processed leaderboard data
    const points = data.map(d => ({
      agent: d.agent,
      model: d.model,
      cost: d.avgCost,
      success: d.avg
    })).filter(d => d.cost > 0 && d.success > 0);

    if (points.length === 0) return;

    // Determine unique agents and models
    const agents = [...new Set(points.map(p => p.agent))];
    const models = [...new Set(points.map(p => p.model))];

    // Determine axis ranges with padding
    const costs = points.map(p => p.cost);
    const successes = points.map(p => p.success);
    const xMax = Math.ceil(Math.max(...costs) + 0.5);
    const xMin = 0;
    const yMinRaw = Math.min(...successes);
    const yMaxRaw = Math.max(...successes);
    const yMin = Math.floor(yMinRaw * 10) / 10 - 0.05;
    const yMax = Math.ceil(yMaxRaw * 10) / 10 + 0.05;

    // SVG dimensions
    const W = 740, H = 420;
    const ml = 62, mr = 20, mt = 14, mb = 52;
    const pw = W - ml - mr, ph = H - mt - mb;

    const sx = c => ml + ((c - xMin) / (xMax - xMin)) * pw;
    const sy = s => mt + (1 - ((s - yMin) / (yMax - yMin))) * ph;

    // Pareto frontier
    const sorted = [...points].sort((a, b) => a.cost - b.cost);
    const pareto = [];
    let bestS = -Infinity;
    for (const p of sorted) {
      if (p.success > bestS) { pareto.push(p); bestS = p.success; }
    }

    // Build DOM
    const root = document.createElement('div');
    root.className = 'pareto-embed';

    const chartWrap = document.createElement('div');
    chartWrap.className = 'chart-wrap';

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'chart');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-label', 'Pareto frontier: cost vs success rate for agent configurations');

    // Gradient for pareto area
    const defs = el('defs');
    const grad = el('linearGradient', { id: 'pareto-fade-main', x1: '0', y1: '0', x2: '0', y2: '1' });
    const stop1 = el('stop', { offset: '0%', 'stop-color': '#5ba8a0', 'stop-opacity': '0.08' });
    const stop2 = el('stop', { offset: '100%', 'stop-color': '#5ba8a0', 'stop-opacity': '0' });
    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    // Grid lines and ticks
    const xStep = xMax <= 10 ? 1 : 2;
    const xTicks = [];
    for (let x = 0; x <= xMax; x += xStep) xTicks.push(x);
    const yTicks = [];
    for (let y = Math.ceil(yMin * 10) / 10; y <= yMax; y = Math.round((y + 0.1) * 10) / 10) yTicks.push(y);

    for (const x of xTicks) {
      const px = sx(x);
      svg.appendChild(el('line', { x1: px, y1: mt, x2: px, y2: mt + ph, stroke: 'var(--text-muted)', 'stroke-opacity': '0.15', 'stroke-width': 1 }));
      const t = el('text', { x: px, y: mt + ph + 22, 'font-size': 11, fill: 'var(--text-muted)', 'text-anchor': 'middle', 'font-family': 'Inter, system-ui', 'font-weight': 400 });
      t.textContent = '$' + x;
      svg.appendChild(t);
    }

    for (const y of yTicks) {
      const py = sy(y);
      svg.appendChild(el('line', { x1: ml, y1: py, x2: ml + pw, y2: py, stroke: 'var(--text-muted)', 'stroke-opacity': '0.15', 'stroke-width': 1 }));
      const t = el('text', { x: ml - 10, y: py + 4, 'font-size': 11, fill: 'var(--text-muted)', 'text-anchor': 'end', 'font-family': 'Inter, system-ui', 'font-weight': 400 });
      t.textContent = Math.round(y * 100) + '%';
      svg.appendChild(t);
    }

    // Axes
    svg.appendChild(el('line', { x1: ml, y1: mt + ph, x2: ml + pw, y2: mt + ph, stroke: 'var(--text-muted)', 'stroke-opacity': '0.25', 'stroke-width': 1 }));
    svg.appendChild(el('line', { x1: ml, y1: mt, x2: ml, y2: mt + ph, stroke: 'var(--text-muted)', 'stroke-opacity': '0.25', 'stroke-width': 1 }));

    // Axis labels
    const xLabel = el('text', { x: ml + pw / 2, y: H - 8, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--text-muted)', 'font-family': 'Inter, system-ui', 'font-weight': 500 });
    xLabel.textContent = 'Average cost per task (USD)';
    svg.appendChild(xLabel);

    const yLabel = el('text', { x: 14, y: mt + ph / 2, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--text-muted)', 'font-family': 'Inter, system-ui', 'font-weight': 500, transform: 'rotate(-90 14 ' + (mt + ph / 2) + ')' });
    yLabel.textContent = 'Success rate';
    svg.appendChild(yLabel);

    // Pareto area fill
    if (pareto.length > 1) {
      let areaD = 'M ' + sx(pareto[0].cost) + ' ' + sy(pareto[0].success);
      for (let i = 1; i < pareto.length; i++) areaD += ' L ' + sx(pareto[i].cost) + ' ' + sy(pareto[i].success);
      areaD += ' L ' + sx(pareto[pareto.length - 1].cost) + ' ' + (mt + ph);
      areaD += ' L ' + sx(pareto[0].cost) + ' ' + (mt + ph) + ' Z';
      svg.appendChild(el('path', { d: areaD, fill: 'url(#pareto-fade-main)' }));
    }

    // Pareto line
    const paretoD = pareto.map((p, i) => (i === 0 ? 'M' : 'L') + ' ' + sx(p.cost) + ' ' + sy(p.success)).join(' ');
    const paretoLine = el('path', { d: paretoD, fill: 'none', stroke: 'var(--text-muted)', 'stroke-opacity': '0.4', 'stroke-width': 1.6, 'stroke-dasharray': '6 4' });
    svg.appendChild(paretoLine);

    // Pareto label
    const lastPareto = pareto[pareto.length - 1];
    const paretoLabel = el('text', { x: sx(lastPareto.cost) + 8, y: sy(lastPareto.success) - 10, 'font-size': 10, fill: 'var(--text-muted)', 'font-family': 'Inter, system-ui', 'font-style': 'italic' });
    paretoLabel.textContent = 'Pareto frontier';
    svg.appendChild(paretoLabel);

    // Data points
    const pointEls = [];
    points.forEach((d, i) => {
      const x = sx(d.cost);
      const y = sy(d.success);
      const color = MODEL_COLORS[d.model] || '#7A7A7A';
      const g = makeShape(d.agent, x, y, color);
      g.classList.add('chart-point');
      g.dataset.agent = d.agent;
      g.dataset.model = d.model;
      g.dataset.idx = i;
      svg.appendChild(g);
      pointEls.push({ el: g, data: d, x, y });
    });

    chartWrap.appendChild(svg);

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    chartWrap.appendChild(tooltip);

    root.appendChild(chartWrap);

    // Legend
    const legendRow = document.createElement('div');
    legendRow.className = 'legend-row';

    // Agents legend group
    const agentGroup = document.createElement('div');
    agentGroup.className = 'legend-group';
    const agentLabel = document.createElement('span');
    agentLabel.className = 'legend-group-label';
    agentLabel.textContent = 'Agents';
    agentGroup.appendChild(agentLabel);

    agents.forEach(agent => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.dataset.filter = 'agent';
      item.dataset.value = agent;
      item.appendChild(makeLegendShapeSVG(agent));
      const span = document.createElement('span');
      span.textContent = AGENT_DISPLAY[agent] || agent.replace(/_/g, ' ');
      item.appendChild(span);
      agentGroup.appendChild(item);
    });

    // Models legend group
    const modelGroup = document.createElement('div');
    modelGroup.className = 'legend-group';
    const modelLabel = document.createElement('span');
    modelLabel.className = 'legend-group-label';
    modelLabel.textContent = 'Models';
    modelGroup.appendChild(modelLabel);

    models.forEach(model => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.dataset.filter = 'model';
      item.dataset.value = model;
      const dot = document.createElement('span');
      dot.style.cssText = 'display:inline-block;width:11px;height:11px;border-radius:50%;background:' + (MODEL_COLORS[model] || '#666') + ';border:1px solid rgba(128,128,128,0.2);';
      item.appendChild(dot);
      const span = document.createElement('span');
      span.textContent = MODEL_DISPLAY[model] || model;
      item.appendChild(span);
      modelGroup.appendChild(item);
    });

    legendRow.appendChild(agentGroup);
    legendRow.appendChild(modelGroup);
    root.appendChild(legendRow);

    container.appendChild(root);

    // Interaction
    const activeFilters = { agent: null, model: null };
    const legendItems = root.querySelectorAll('.legend-item[data-filter]');

    function applyFilters() {
      const hasFilter = activeFilters.agent || activeFilters.model;
      legendItems.forEach(li => {
        const t = li.dataset.filter;
        const v = li.dataset.value;
        if (activeFilters[t] === v) {
          li.classList.add('active');
          li.classList.remove('dimmed');
        } else if (activeFilters[t] && activeFilters[t] !== v) {
          li.classList.remove('active');
          li.classList.add('dimmed');
        } else {
          li.classList.remove('active');
          li.classList.remove('dimmed');
        }
      });

      pointEls.forEach(({ el: g, data: d }) => {
        const matchAgent = !activeFilters.agent || d.agent === activeFilters.agent;
        const matchModel = !activeFilters.model || d.model === activeFilters.model;
        const visible = !hasFilter || (matchAgent && matchModel);
        g.style.opacity = visible ? '1' : '0.08';
        g.style.filter = 'none';
      });

      paretoLine.style.opacity = hasFilter ? '0.1' : '1';
    }

    function showTooltip(d, x, y) {
      pointEls.forEach(p => {
        if (p.data === d) {
          p.el.style.opacity = '1';
          p.el.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))';
        } else {
          p.el.style.opacity = '0.15';
          p.el.style.filter = 'none';
        }
      });
      paretoLine.style.opacity = '0.15';

      const rect = chartWrap.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const scaleX = svgRect.width / W;
      const scaleY = svgRect.height / H;
      const tipX = x * scaleX + (svgRect.left - rect.left);
      const tipY = y * scaleY + (svgRect.top - rect.top);
      const successColor = MODEL_COLORS[d.model] || '#333';
      const agentName = AGENT_DISPLAY[d.agent] || d.agent.replace(/_/g, ' ');
      const modelName = MODEL_DISPLAY[d.model] || d.model;

      tooltip.innerHTML =
        '<div class="tooltip-agent">' + agentName + '</div>' +
        '<div class="tooltip-model">' + modelName + '</div>' +
        '<div class="tooltip-stats">' +
          '<div><div class="tooltip-stat-label">Success</div><div class="tooltip-stat-value" style="color:' + successColor + '">' + (d.success * 100).toFixed(0) + '%</div></div>' +
          '<div><div class="tooltip-stat-label">Cost/task</div><div class="tooltip-stat-value">$' + d.cost.toFixed(2) + '</div></div>' +
        '</div>';

      tooltip.classList.add('visible');
      const tipW = tooltip.offsetWidth;
      const tipH = tooltip.offsetHeight;
      let left = tipX + 18;
      let top = tipY - tipH / 2;
      if (left + tipW > rect.width - 8) left = tipX - tipW - 18;
      if (top < 4) top = 4;
      if (top + tipH > rect.height - 4) top = rect.height - tipH - 4;
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    }

    function hideTooltip() {
      applyFilters();
      tooltip.classList.remove('visible');
    }

    pointEls.forEach(({ el: g, data: d, x, y }) => {
      g.addEventListener('mouseenter', () => showTooltip(d, x, y));
      g.addEventListener('mouseleave', hideTooltip);
    });

    legendItems.forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.filter;
        const value = item.dataset.value;
        activeFilters[type] = (activeFilters[type] === value) ? null : value;
        applyFilters();
      });
    });
  }

  // Expose globally so main.js can re-render on theme toggle
  window.renderParetoChart = renderParetoChart;
})();
