// ===== LOADING SCREEN =====
(function(){
  const screen=document.getElementById('loadingScreen');
  if(!screen)return;

  // Skip intro on repeat visits (same session)
  if(sessionStorage.getItem('exgentic-loaded')){
    screen.classList.add('done');
    // Show hero immediately
    document.querySelectorAll('.hero-badge,.hero-title,.hero-subtitle,.hero-cta,.hero-card').forEach(el=>{el.style.opacity='1';el.style.transform='none';el.style.clipPath='none'});
    return;
  }
  sessionStorage.setItem('exgentic-loaded','1');

  const container=document.getElementById('floatingLabels');

  const fillBar=document.getElementById('loadingFill');
  // Smooth continuous fill
  fillBar.style.width='40%';
  setTimeout(()=>{
    fillBar.style.transition='width '+dur+'ms linear';
    fillBar.style.width='80%';
  },50);

  const labels=[
    {name:'Software Engineering',type:'skill'},
    {name:'Claude Code',type:'agent'},
    {name:'Customer Service',type:'skill'},
    {name:'OpenAI Solo',type:'agent'},
    {name:'Deep Research',type:'skill'},
    {name:'Gemini CLI',type:'agent'},
    {name:'Personal Assistance',type:'skill'},
    {name:'Smolagent Code',type:'agent'},
    {name:'Technical Support',type:'skill'},
    {name:'Codex CLI',type:'agent'},
    {name:'Smolagents Tool Calling',type:'agent'},
  ];

  // Icons SVGs
  const iconSVGs=[
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  ];

  // Build combined list: interleave labels and icons
  const allItems=[];
  labels.forEach((l,i)=>{
    allItems.push({...l,kind:'label'});
    if(i<iconSVGs.length) allItems.push({kind:'icon',svg:iconSVGs[i]});
  });
  for(let j=labels.length;j<iconSVGs.length;j++) allItems.push({kind:'icon',svg:iconSVGs[j]});

  // Compute grid slots, excluding center where the card sits
  const W=window.innerWidth,H=window.innerHeight;
  const cx=W/2,cy=H/2;
  const box=screen.querySelector('.loading-content');
  const bw=box?box.offsetWidth+40:320,bh=box?box.offsetHeight+40:200;
  const boxL=cx-bw/2,boxR=cx+bw/2,boxT=cy-bh/2,boxB=cy+bh/2;

  // Create evenly-spaced slots
  const cols=5,rows=4;
  const cellW=W/cols,cellH=H/rows;
  const slots=[];
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const sx=cellW*c+cellW/2;
      const sy=cellH*r+cellH/2;
      // Skip slots that overlap the center card
      if(sx>boxL && sx<boxR && sy>boxT && sy<boxB) continue;
      slots.push({x:sx,y:sy});
    }
  }

  // Assign items to slots (trim or repeat if needed)
  const total=Math.min(allItems.length,slots.length);
  const placed=[];
  const iconPlaced=[];

  // Shuffle slot assignment so items appear in random positions
  for(let k=slots.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[slots[k],slots[j]]=[slots[j],slots[k]]}

  // Create all elements in their slots, hidden
  const allEls=[];
  for(let i=0;i<total;i++){
    const item=allItems[i];
    const slot=slots[i];
    const angle=Math.atan2(slot.y-cy,slot.x-cx);

    if(item.kind==='icon'){
      const el=document.createElement('div');
      el.className='floating-icon';
      el.innerHTML=item.svg;
      el.querySelector('svg').style.width='40px';
      el.querySelector('svg').style.height='40px';
      el.style.left=slot.x+'px';el.style.top=slot.y+'px';
      el.style.transform='translate(-50%,-50%)';
      container.appendChild(el);
      iconPlaced.push({el,angle});
      allEls.push(el);
    } else {
      const el=document.createElement('div');
      el.className='floating-label '+item.type;
      el.textContent=item.name;
      el.style.left=slot.x+'px';el.style.top=slot.y+'px';
      el.style.transform='translate(-50%,-50%)';
      container.appendChild(el);
      placed.push({el,angle});
      allEls.push(el);
    }
  }

  // Shuffle element order for random appearance
  for(let k=allEls.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[allEls[k],allEls[j]]=[allEls[j],allEls[k]]}

  // Schedule appearances in waves (groups of 2-3 appearing simultaneously)
  const dur=2800;
  const waveSize=2+Math.floor(Math.random()*2); // 2-3 per wave
  const waves=[];
  for(let i=0;i<allEls.length;i+=waveSize){
    waves.push(allEls.slice(i,i+waveSize));
  }
  const waveDelay=dur/waves.length;
  let waveIdx=0;

  function showWave(){
    if(waveIdx>=waves.length) return;
    waves[waveIdx].forEach(el=>el.classList.add('visible'));
    waveIdx++;
    if(waveIdx<waves.length) setTimeout(showWave,waveDelay);
  }
  showWave();

  // Explode after all waves + pause
  setTimeout(()=>{
    screen.classList.add('explode');
    placed.forEach(p=>{
      const dx=Math.cos(p.angle)*600;
      const dy=Math.sin(p.angle)*600;
      p.el.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(2)`;
    });
    iconPlaced.forEach(p=>{
      const dx=Math.cos(p.angle)*500;
      const dy=Math.sin(p.angle)*500;
      p.el.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(3)`;
    });
    setTimeout(()=>screen.classList.add('done'),900);
  },dur+400);
})();
