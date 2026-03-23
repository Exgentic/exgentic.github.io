// ===== 9. LEADERBOARD =====
const BENCHMARKS=['AppWorld','BrowseComp+','SWE-bench','TauBench-Airline','TauBench-Retail','TauBench-Telecom'];
const BENCH_SHORT={'AppWorld':'App','BrowseComp+':'Browse','SWE-bench':'SWE','TauBench-Airline':'Tau-Air','TauBench-Retail':'Tau-Ret','TauBench-Telecom':'Tau-Tel'};
const MODEL_DISPLAY={'claude-opus-4.5':'Claude Opus 4.5','gpt-5.2':'GPT 5.2','gemini-3-pro':'Gemini Pro 3'};
const AGENT_DISPLAY={'Claude_Code':'Claude Code','OpenAI_Solo':'OpenAI Solo','Smolagent':'Smolagent','React':'React','React_+_Shortlisting':'React + Shortlist'};

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
    html+=`<td class="agent-name">${name}${ver?`<span class="agent-version">${ver}</span>`:''}</td>`;
    html+=`<td class="model-name">${model}</td>`;
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
}

// ===== CHART =====
const MODEL_COLORS={'claude-opus-4.5':'#5ba8a0','gpt-5.2':'#9b8ec4','gemini-3-pro':'#6a8cbe'};
const AGENT_SHAPES={'Claude_Code':'circle','OpenAI_Solo':'rectRot','Smolagent':'triangle','React':'rect','React_+_Shortlisting':'cross'};

let cpChartInstance=null;
function renderChart(data){
  if(cpChartInstance){cpChartInstance.destroy();cpChartInstance=null;}
  const ctx=document.getElementById('cpChart').getContext('2d');
  const isLight=document.body.classList.contains('light-mode');
  const textCol=isLight?'rgba(0,0,0,0.6)':'rgba(255,255,255,0.6)';
  const textDim=isLight?'rgba(0,0,0,0.35)':'rgba(255,255,255,0.3)';
  const gridCol=isLight?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.05)';
  const borderCol=isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.1)';
  const paretoCol=isLight?'rgba(0,0,0,0.2)':'rgba(255,255,255,0.3)';
  const tipBg=isLight?'rgba(255,255,255,0.95)':'rgba(8,11,20,0.95)';
  const tipBorder=isLight?'rgba(0,0,0,0.15)':'rgba(255,255,255,0.2)';
  const tipTitle=isLight?'#111':'#fff';
  const tipBody=isLight?'rgba(0,0,0,0.65)':'rgba(255,255,255,0.7)';

  const agents=[...new Set(data.map(d=>d.agent))];
  const datasets=agents.map(agent=>{
    const rows=data.filter(d=>d.agent===agent);
    return{
      label:(AGENT_DISPLAY[agent]||agent.replace(/_/g,' ')),
      data:rows.map(r=>({x:r.avgCost,y:r.avg,model:r.model})),
      backgroundColor:rows.map(r=>MODEL_COLORS[r.model]||'#666'),
      borderColor:rows.map(r=>(MODEL_COLORS[r.model]||'#666')+'88'),
      borderWidth:2,pointStyle:AGENT_SHAPES[agent]||'circle',pointRadius:9,pointHoverRadius:13,
    };
  });
  // Pareto frontier: step through left-to-right, keep running max of score
  const allPts=[];
  datasets.forEach(ds=>{if(ds.type!=='line')ds.data.forEach(d=>allPts.push({x:d.x,y:d.y}))});
  allPts.sort((a,b)=>a.x-b.x);
  const pareto=[];let runMax=-1;
  allPts.forEach(p=>{
    if(p.y>runMax){runMax=p.y;pareto.push(p)}
  });
  datasets.push({label:'Pareto Frontier',data:pareto,type:'line',borderColor:paretoCol,borderDash:[6,4],borderWidth:2,pointRadius:0,fill:false,tension:.1});

  // Model color legend
  const legendEl=document.getElementById('modelLegend');
  if(legendEl){
    legendEl.innerHTML=Object.entries(MODEL_DISPLAY).map(([k,v])=>`<span style="margin:0 8px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${MODEL_COLORS[k]||'#666'};vertical-align:middle;margin-right:4px"></span>${v}</span>`).join('');
  }

  cpChartInstance=new Chart(ctx,{
    type:'scatter',data:{datasets},
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{
        legend:{display:true,position:'bottom',labels:{color:textCol,font:{family:'Inter',size:11},usePointStyle:true,padding:12,pointStyleWidth:12,generateLabels:chart=>{
          return chart.data.datasets.map((ds,i)=>({text:ds.label,pointStyle:ds.pointStyle||'line',fillStyle:ds.type==='line'?'transparent':(isLight?'rgba(0,0,0,0.3)':'rgba(255,255,255,0.4)'),strokeStyle:ds.type==='line'?paretoCol:(isLight?'rgba(0,0,0,0.3)':'rgba(255,255,255,0.4)'),lineWidth:ds.type==='line'?2:1,lineDash:ds.borderDash||[],datasetIndex:i,hidden:!chart.isDatasetVisible(i)}));
        }}},
        tooltip:{
          backgroundColor:tipBg,borderColor:tipBorder,borderWidth:1,
          titleColor:tipTitle,bodyColor:tipBody,
          titleFont:{family:'Inter',weight:'600'},bodyFont:{family:'JetBrains Mono',size:11},
          callbacks:{label:ctx=>{const d=ctx.raw;return[`${ctx.dataset.label}`,`Model: ${MODEL_DISPLAY[d.model]||d.model}`,`Success: ${Math.round(d.y*100)}%`,`Cost: $${d.x.toFixed(2)}/task`]}}
        }
      },
      scales:{
        x:{title:{display:true,text:'Average Task Cost in USD',color:textCol,font:{size:12}},ticks:{color:textDim,font:{family:'JetBrains Mono',size:10}},grid:{color:gridCol},border:{color:borderCol}},
        y:{title:{display:true,text:'Avg Success',color:textCol,font:{size:12}},ticks:{color:textDim,font:{family:'JetBrains Mono',size:10},callback:v=>Math.round(v*100)+'%',stepSize:0.05},grid:{color:gridCol},border:{color:borderCol},min:0.4,max:0.8}
      }
    }
  });
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
