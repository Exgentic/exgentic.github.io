// ===== 8. GSAP ANIMATIONS =====
gsap.registerPlugin(ScrollTrigger);

// Hero entrance — triggered after loading screen fades
function animateHero(){
  const tl=gsap.timeline({delay:.1});
  tl.fromTo('.hero-badge',{opacity:0,y:-15},{opacity:1,y:0,duration:.5,ease:'power2.out'})
    .fromTo('.hero-title',{opacity:0,y:30,clipPath:'inset(0 100% 0 0)'},{opacity:1,y:0,clipPath:'inset(0 0% 0 0)',duration:1,ease:'power3.out'},'-=.2')
    .fromTo('.hero-subtitle',{opacity:0,y:20},{opacity:1,y:0,duration:.6,ease:'power2.out'},'-=.3')
    .fromTo('.hero-card',{opacity:0,y:15,scale:.95},{opacity:1,y:0,scale:1,duration:.4,stagger:.08,ease:'back.out(1.5)'},'-=.2')
    .fromTo('.hero-cta',{opacity:0,y:15},{opacity:1,y:0,duration:.5,ease:'power2.out'},'-=.2')
}
// Start hero animation when loading screen finishes
const loadObs=new MutationObserver((muts)=>{
  muts.forEach(m=>{
    if(m.target.classList.contains('done')){animateHero();loadObs.disconnect()}
  });
});
const ls=document.getElementById('loadingScreen');
if(ls){loadObs.observe(ls,{attributes:true,attributeFilter:['class']})}
else{animateHero()}

// Section title clip-path reveals
document.querySelectorAll('.section-title').forEach(title=>{
  ScrollTrigger.create({
    trigger:title,start:'top 85%',
    onEnter:()=>title.classList.add('revealed'),
    once:true
  });
});

// Section subtitle + label fade in
document.querySelectorAll('.section-subtitle, .section-label').forEach(el=>{
  gsap.fromTo(el,{opacity:0,y:15},{opacity:1,y:0,duration:.7,scrollTrigger:{trigger:el,start:'top 85%',once:true}});
});

// Cards stagger with rotation
document.querySelectorAll('.about-grid,.audience-grid,.features-grid,.findings-grid,.gs-grid,.faq-container').forEach(grid=>{
  const cards=grid.children;
  gsap.fromTo(cards,{opacity:0,y:40,rotateX:8},{opacity:1,y:0,rotateX:0,duration:.7,stagger:.12,ease:'power2.out',scrollTrigger:{trigger:grid,start:'top 80%',once:true}});
});
