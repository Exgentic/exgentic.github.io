// ===== 9. LEADERBOARD =====
const BENCHMARKS=['AppWorld','BrowseComp+','SWE-bench','TauBench-Airline','TauBench-Retail','TauBench-Telecom'];
const BENCH_SHORT={'AppWorld':'App','BrowseComp+':'Browse','SWE-bench':'SWE','TauBench-Airline':'Tau-Air','TauBench-Retail':'Tau-Ret','TauBench-Telecom':'Tau-Tel'};
const MODEL_DISPLAY={'claude-opus-4.5':'Claude Opus 4.5','gpt-5.2':'GPT 5.2','gemini-3-pro':'Gemini Pro 3','deepseek-v3.2':'DeepSeek V3.2','kimi-k2.5':'Kimi K2.5'};
const MODEL_URLS={'claude-opus-4.5':'https://www.anthropic.com/claude','gpt-5.2':'https://openai.com/','gemini-3-pro':'https://deepmind.google/technologies/gemini/','deepseek-v3.2':'https://www.deepseek.com/','kimi-k2.5':'https://www.moonshot.ai/'};
const AGENT_DISPLAY={'Claude_Code':'Claude Code','OpenAI_Solo':'OpenAI Solo','Smolagent':'Smolagent','React':'React','React_+_Shortlisting':'React + Shortlist'};
const AGENT_URLS={'Claude_Code':'https://github.com/anthropics/claude-code','OpenAI_Solo':'https://github.com/openai/openai-agents-python','Smolagent':'https://github.com/huggingface/smolagents','React':'https://github.com/BerriAI/litellm','React_+_Shortlisting':'https://github.com/BerriAI/litellm'};

let sortCol='avg',sortDir=-1;

function parseCSV(text){
  const lines=text.trim().split('\n');const headers=lines[0].split(',');
  return lines.slice(1).map(line=>{const vals=line.split(',');const obj={};headers.forEach((h,i)=>obj[h.trim()]=vals[i]?.trim()||'');return obj;});
}

function processData(rows,modelFilter){
  const groups={};
  rows.forEach(r=>{
    if(modelFilter!=='all'&&r.model_normalized!==modelFilter)return;
    const key=r.visible_agent_name+'|'+r.model_normalized;
    if(!groups[key])groups[key]={agent:r.visible_agent_name,model:r.model_normalized,version:r.agent_version||'',benchmarks:{},costs:{}};
    groups[key].benchmarks[r.benchmark]=parseFloat(r.score)||0;
    groups[key].costs[r.benchmark]=parseFloat(r.avg_cost)||0;
  });
  // Benchmark weights: TauBench sub-benchmarks each get 1/12 (so TauBench total = 1/4)
  // Other benchmarks get 1/4 each
  const BENCH_WEIGHT={};
  BENCHMARKS.forEach(b=>{BENCH_WEIGHT[b]=b.startsWith('TauBench')?1/12:1/4});
  return Object.values(groups).map(g=>{
    const bs=BENCHMARKS.map(b=>g.benchmarks[b]||0);
    let wSum=0,wTotal=0;
    BENCHMARKS.forEach((b,i)=>{if(bs[i]>0){wSum+=bs[i]*BENCH_WEIGHT[b];wTotal+=BENCH_WEIGHT[b]}});
    const avg=wTotal?wSum/wTotal:0;
    const cs=Object.values(g.costs).filter(c=>c>0);
    const avgCost=cs.length?cs.reduce((a,b)=>a+b,0)/cs.length:0;
    return{...g,avg,avgCost,benchScores:bs};
  }).filter(g=>g.avg>0).sort((a,b)=>b.avg-a.avg);
}

function scoreClass(s){if(s===0)return'score-zero';if(s>=.7)return'score-high';if(s>=.5)return'score-mid';return'score-low'}

function renderTable(data){
  const cols=[{key:'rank',label:'#',sortable:false},{key:'agent',label:'Agent',sortable:true},{key:'model',label:'Model',sortable:true},{key:'avg',label:'Avg Success',sortable:true},{key:'avgCost',label:'Avg Cost',sortable:true}];
  BENCHMARKS.forEach(b=>{cols.push({key:'bench_'+b,label:BENCH_SHORT[b],sortable:true})});

  const head=document.getElementById('lbHead');
  head.innerHTML=cols.map(c=>{
    const sorted=sortCol===c.key;
    const cls=c.sortable?`class="sortable${sorted?' sorted':''}" data-col="${c.key}"`:'';
    const arrow=c.sortable?`<span class="sort-arrow">${sorted?(sortDir>0?'&#9650;':'&#9660;'):'&#9650;'}</span>`:'';
    return`<th ${cls}>${c.label}${arrow}</th>`;
  }).join('');

  const sorted=[...data];
  if(sortCol==='agent')sorted.sort((a,b)=>sortDir*a.agent.localeCompare(b.agent));
  else if(sortCol==='model')sorted.sort((a,b)=>sortDir*a.model.localeCompare(b.model));
  else if(sortCol==='avg')sorted.sort((a,b)=>sortDir*(a.avg-b.avg));
  else if(sortCol==='avgCost')sorted.sort((a,b)=>sortDir*(a.avgCost-b.avgCost));
  else if(sortCol.startsWith('bench_')){const idx=BENCHMARKS.indexOf(sortCol.replace('bench_',''));sorted.sort((a,b)=>sortDir*((a.benchScores[idx]||0)-(b.benchScores[idx]||0)));}

  const body=document.getElementById('lbBody');
  body.innerHTML=sorted.map((row,i)=>{
    const name=AGENT_DISPLAY[row.agent]||row.agent.replace(/_/g,' ');
    const model=MODEL_DISPLAY[row.model]||row.model;
    let rankHtml;
    if(i===0)rankHtml='<span class="rank-badge rank-1">1</span>';
    else if(i===1)rankHtml='<span class="rank-badge rank-2">2</span>';
    else if(i===2)rankHtml='<span class="rank-badge rank-3">3</span>';
    else rankHtml=`<span class="rank-default">${i+1}</span>`;

    function fmtPct(v){const s=(v*100).toFixed(1);return s.endsWith('.0')?s.slice(0,-2)+'%':s+'%'}
    let html=`<tr>`;
    html+=`<td>${rankHtml}</td>`;
    const ver=row.version?row.version.replace(/_/g,' ').replace(/\s*�\s*/g,' · '):'';
    const agentUrl=AGENT_URLS[row.agent];
    const agentLink=agentUrl?`<a href="${agentUrl}" target="_blank" rel="noopener">${name}</a>`:name;
    html+=`<td class="agent-name">${agentLink}${ver?`<span class="agent-version">${ver}</span>`:''}</td>`;
    const modelUrl=MODEL_URLS[row.model];
    const modelLink=modelUrl?`<a href="${modelUrl}" target="_blank" rel="noopener">${model}</a>`:model;
    html+=`<td class="model-name">${modelLink}</td>`;
    html+=`<td class="score-cell ${scoreClass(row.avg)}"><div class="bar bar-cyan" style="width:${row.avg*100}%"></div><span class="val">${fmtPct(row.avg)}</span></td>`;
    html+=`<td class="cost-cell">$${row.avgCost.toFixed(2)}</td>`;
    row.benchScores.forEach(s=>{
      const barW=s>0?s*100:0;
      html+=`<td class="score-cell ${scoreClass(s)}"><div class="bar bar-purple" style="width:${barW}%"></div><span class="val">${s>0?fmtPct(s):'&mdash;'}</span></td>`;
    });
    html+=`</tr>`;return html;
  }).join('');

  // Stagger row reveal
  const rows=body.querySelectorAll('tr');
  rows.forEach((r,i)=>{setTimeout(()=>r.classList.add('visible'),i*60)});

  head.querySelectorAll('.sortable').forEach(th=>{
    th.addEventListener('click',()=>{
      const col=th.dataset.col;
      if(sortCol===col)sortDir*=-1;else{sortCol=col;sortDir=-1;}
      renderTable(data);
    });
  });

  // Remove any legacy "See all" button if it exists from a previous render
  const oldBtn=document.getElementById('lbSeeAll');
  if(oldBtn)oldBtn.remove();

  // Toggle bottom-fade hint based on whether the table can still scroll down
  const tableWrap=document.querySelector('.table-wrap');
  const updateFade=()=>{
    const atBottom=tableWrap.scrollTop+tableWrap.clientHeight>=tableWrap.scrollHeight-2;
    const overflows=tableWrap.scrollHeight>tableWrap.clientHeight+2;
    tableWrap.classList.toggle('lb-can-scroll',overflows&&!atBottom);
  };
  if(!tableWrap.dataset.scrollBound){
    tableWrap.addEventListener('scroll',updateFade,{passive:true});
    window.addEventListener('resize',updateFade);
    tableWrap.dataset.scrollBound='1';
  }
  // Defer to next frame so layout is settled
  requestAnimationFrame(updateFade);
}

// ===== CHART =====
function renderChart(data){
  if(window.renderParetoChart) window.renderParetoChart(data);
}

// ===== INIT =====
const _lbScript=document.currentScript;
const _basePath=(_lbScript&&_lbScript.getAttribute('data-base'))||'/';
fetch(_basePath+'results.csv').then(r=>r.text()).then(text=>{
  const rows=parseCSV(text);
  const models=[...new Set(rows.map(r=>r.model_normalized))].filter(Boolean);
  const sel=document.getElementById('modelFilter');
  models.forEach(m=>{const opt=document.createElement('option');opt.value=m;opt.textContent=MODEL_DISPLAY[m]||m;sel.appendChild(opt)});
  const data=processData(rows,'all');
  window._chartData=data;
  renderTable(data);renderChart(data);
  sel.addEventListener('change',()=>{const d=processData(rows,sel.value);renderTable(d)});
}).catch(err=>console.error('CSV load failed:',err));

const _lastUpdatedEl=document.getElementById('lastUpdated');
if(_lastUpdatedEl){fetch(_basePath+'results.csv.timestamp').then(r=>r.text()).then(t=>{
  const d=new Date(t.trim());
  const fmt=isNaN(d)?t.trim():d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  _lastUpdatedEl.textContent='Last updated: '+fmt;
}).catch(()=>{});}
