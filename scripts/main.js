// ===== 1. DATA-DRIVEN FORCE GRAPH =====
(function(){
  const canvas=document.getElementById('constellation');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  let W,H,mouse={x:-1000,y:-1000};
  const dpr=window.devicePixelRatio||1;

  function resize(){
    const rect=canvas.parentElement.getBoundingClientRect();
    W=rect.width;H=700;
    canvas.width=W*dpr;canvas.height=H*dpr;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize',resize);resize();
  document.addEventListener('mousemove',e=>{
    const rect=canvas.getBoundingClientRect();
    mouse.x=e.clientX-rect.left;mouse.y=e.clientY-rect.top;
  });

  // Agent/model/benchmark data nodes (populated from CSV, fallback to static)
  const MODEL_COLORS={'claude-opus-4.5':'91,168,160','gpt-5.2':'155,142,196','gemini-3-pro':'106,140,190'};
  const agentNodes=[];
  const benchNodes=[];
  const edges=[];
  let graphReady=false;

  // Build graph from CSV
  function buildGraph(rows){
    const agents={},benchs={};
    rows.forEach(r=>{
      const a=r.visible_agent_name,b=r.benchmark,m=r.model_normalized;
      const score=parseFloat(r.score)||0;
      if(!a||!b||score===0)return;
      if(!agents[a]){
        // Agents start on outer ring
        const aCount=Object.keys(agents).length;
        const angle=aCount*Math.PI*2/5+Math.random()*.3;
        const radius=Math.min(W,H)*.32;
        agents[a]={name:a,x:W/2+Math.cos(angle)*radius,y:H*.45+Math.sin(angle)*radius,vx:0,vy:0,r:0,scores:[],models:new Set()};
      }
      agents[a].scores.push(score);agents[a].models.add(m);
      if(!benchs[b]){
        // Benchmarks start in center cluster
        const bCount=Object.keys(benchs).length;
        const angle=bCount*Math.PI*2/6+Math.random()*.2;
        const radius=Math.min(W,H)*.08;
        benchs[b]={name:b,x:W/2+Math.cos(angle)*radius,y:H*.45+Math.sin(angle)*radius,vx:0,vy:0,r:8,type:'bench'};
      }
      edges.push({from:a,to:b,score,model:m});
    });
    Object.values(agents).forEach(a=>{
      const avg=a.scores.reduce((x,y)=>x+y,0)/a.scores.length;
      a.r=Math.max(14,avg*45);
      a.color=MODEL_COLORS[a.models.values().next().value]||'91,168,160';
      a.avg=avg;a.type='agent';
      agentNodes.push(a);
    });
    Object.values(benchs).forEach(b=>{b.color='255,255,255';benchNodes.push(b)});
    graphReady=true;
  }

  // Fetch CSV and build graph
  fetch('/results.csv').then(r=>r.text()).then(text=>{
    const lines=text.trim().split('\n');const headers=lines[0].split(',');
    const rows=lines.slice(1).map(line=>{const v=line.split(',');const o={};headers.forEach((h,i)=>o[h.trim()]=v[i]?.trim()||'');return o});
    buildGraph(rows);
  }).catch(()=>{});

  const MOUSE_RADIUS=200;

  function simulate(){
    const all=[...agentNodes,...benchNodes];
    // repulsion between all nodes
    for(let i=0;i<all.length;i++){
      for(let j=i+1;j<all.length;j++){
        const dx=all[i].x-all[j].x,dy=all[i].y-all[j].y;
        let dist=Math.sqrt(dx*dx+dy*dy)||1;
        if(dist<120){
          const f=(120-dist)/120*.12;
          const fx=dx/dist*f,fy=dy/dist*f;
          all[i].vx+=fx;all[i].vy+=fy;
          all[j].vx-=fx;all[j].vy-=fy;
        }
      }
    }
    // attraction along edges
    edges.forEach(e=>{
      const a=agentNodes.find(n=>n.name===e.from);
      const b=benchNodes.find(n=>n.name===e.to);
      if(!a||!b)return;
      const dx=b.x-a.x,dy=b.y-a.y;
      const dist=Math.sqrt(dx*dx+dy*dy)||1;
      const targetDist=240;
      if(dist>targetDist){
        const f=(dist-targetDist)*.002;
        a.vx+=dx/dist*f;a.vy+=dy/dist*f;
        b.vx-=dx/dist*f;b.vy-=dy/dist*f;
      }
    });
    // Gravity center shifted up to sit closer to the title
    const cx=W/2,cy=H*.45;
    benchNodes.forEach(n=>{
      n.vx+=(cx-n.x)*.001;
      n.vy+=(cy-n.y)*.001;
    });
    agentNodes.forEach(n=>{
      n.vx+=(cx-n.x)*.0002;
      n.vy+=(cy-n.y)*.0002;
    });
    all.forEach(n=>{
      // mouse repulsion (gentle)
      const dx=n.x-mouse.x,dy=n.y-mouse.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<MOUSE_RADIUS&&dist>0){
        const f=(MOUSE_RADIUS-dist)/MOUSE_RADIUS*.6;
        n.vx+=dx/dist*f;n.vy+=dy/dist*f;
      }
      // damping & update (high damping = slow, smooth movement)
      n.vx*=.85;n.vy*=.85;
      n.x+=n.vx;n.y+=n.vy;
      n.x=Math.max(n.r,Math.min(W-n.r,n.x));
      n.y=Math.max(n.r,Math.min(H-n.r,n.y));
    });
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    if(!graphReady){requestAnimationFrame(draw);return;}
    simulate();

    const isLight=document.body.classList.contains('light-mode');
    const benchFill=isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.15)';
    const benchText=isLight?'rgba(0,0,0,0.4)':'rgba(255,255,255,0.25)';
    const scoreText=isLight?'rgba(0,0,0,0.5)':'rgba(255,255,255,0.4)';

    // Draw edges
    edges.forEach(e=>{
      const a=agentNodes.find(n=>n.name===e.from);
      const b=benchNodes.find(n=>n.name===e.to);
      if(!a||!b)return;
      const col=MODEL_COLORS[e.model]||'100,100,100';
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
      ctx.strokeStyle=`rgba(${col},${isLight?e.score*.18:e.score*.12})`;ctx.lineWidth=e.score*1.5;ctx.stroke();
    });

    // Draw benchmark nodes
    benchNodes.forEach(n=>{
      ctx.beginPath();ctx.arc(n.x,n.y,8,0,Math.PI*2);
      ctx.fillStyle=benchFill;ctx.fill();
      ctx.fillStyle=benchText;ctx.font='500 13px Inter';ctx.textAlign='center';
      ctx.fillText(n.name,n.x,n.y-16);
    });

    // Draw agent nodes
    agentNodes.forEach(n=>{
      // Glow
      const grd=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*2.5);
      grd.addColorStop(0,`rgba(${n.color},${isLight?0.15:0.25})`);
      grd.addColorStop(1,`rgba(${n.color},0)`);
      ctx.beginPath();ctx.arc(n.x,n.y,n.r*2.5,0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();
      // Core
      ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${n.color},${isLight?0.3:0.4})`;ctx.fill();
      ctx.strokeStyle=`rgba(${n.color},${isLight?0.5:0.6})`;ctx.lineWidth=1.5;ctx.stroke();
      // Label
      ctx.fillStyle=isLight?`rgba(0,0,0,0.7)`:`rgba(${n.color},0.85)`;
      ctx.font='600 15px Inter';ctx.textAlign='center';
      ctx.fillText(n.name.replace(/_/g,' '),n.x,n.y+n.r+22);
      // Score
      ctx.fillStyle=scoreText;ctx.font='500 13px JetBrains Mono';
      ctx.fillText((n.avg*100).toFixed(1)+'%',n.x,n.y+5);

      // Mouse glow boost
      const d=Math.sqrt((n.x-mouse.x)**2+(n.y-mouse.y)**2);
      if(d<MOUSE_RADIUS){
        const g=(1-d/MOUSE_RADIUS);
        ctx.beginPath();ctx.arc(n.x,n.y,n.r*3,0,Math.PI*2);
        ctx.fillStyle=`rgba(${n.color},${g*.15})`;ctx.fill();
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ===== 5. HEADER =====
const header=document.getElementById('header');
let lastScrollY=0;
window.addEventListener('scroll',()=>{
  const y=window.scrollY;
  header.classList.toggle('scrolled',y>50);
  if(y>100){
    header.classList.toggle('header-hidden',y>lastScrollY);
  } else {
    header.classList.remove('header-hidden');
  }
  lastScrollY=y;
});
// Show header when mouse reaches top of screen
document.addEventListener('mousemove',e=>{
  if(e.clientY<60) header.classList.remove('header-hidden');
});
document.getElementById('mobileToggle').addEventListener('click',()=>{document.getElementById('headerNav').classList.toggle('open')});

// ===== 7. FAQ =====
document.querySelectorAll('.faq-question').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const item=btn.parentElement;
    const wasOpen=item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i=>i.classList.remove('open'));
    if(!wasOpen) item.classList.add('open');
  });
});

// ===== THEME TOGGLE =====
(function(){
  const btn=document.getElementById('themeToggle');
  const saved=localStorage.getItem('exgentic-theme');
  if(saved==='light') document.body.classList.add('light-mode');
  document.documentElement.classList.remove('light-mode-early');
  function update(){
    const isLight=document.body.classList.contains('light-mode');
    btn.innerHTML=isLight?'&#9728;':'&#9790;'; // sun : moon
    localStorage.setItem('exgentic-theme',isLight?'light':'dark');
  }
  update();
  btn.addEventListener('click',()=>{
    document.body.classList.toggle('light-mode');
    update();
    // Re-render chart with new theme colors
    if(window._chartData) renderChart(window._chartData);
  });
})();

