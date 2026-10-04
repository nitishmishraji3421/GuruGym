const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];

const preloader=$("#preloader");
window.addEventListener("load",()=>setTimeout(()=>preloader?.classList.add("hide"),500));

const header=$("#siteHeader");
const progress=$("#scrollProgress");
const backTop=$("#backTop");
const cursorGlow=$("#cursorGlow");
function onScroll(){
  header?.classList.toggle("scrolled",window.scrollY>15);
  const max=document.documentElement.scrollHeight-window.innerHeight;
  if(progress)progress.style.width=(max>0?(window.scrollY/max)*100:0)+"%";
  backTop?.classList.toggle("show",window.scrollY>650);
}
window.addEventListener("scroll",onScroll,{passive:true});
onScroll();
backTop?.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));

const menuToggle=$("#menuToggle");
const drawer=$("#mobileDrawer");
function closeDrawer(){menuToggle?.classList.remove("active");menuToggle?.setAttribute("aria-expanded","false");drawer?.classList.remove("open");drawer?.setAttribute("aria-hidden","true")}
menuToggle?.addEventListener("click",()=>{const open=!drawer.classList.contains("open");drawer.classList.toggle("open",open);menuToggle.classList.toggle("active",open);menuToggle.setAttribute("aria-expanded",String(open));drawer.setAttribute("aria-hidden",String(!open))});
$$('#mobileDrawer a').forEach(a=>a.addEventListener('click',closeDrawer));

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.12,rootMargin:"0px 0px -40px"});
$$('.reveal').forEach(el=>observer.observe(el));

const countEl=$("[data-count]");
if(countEl){
  const counterObserver=new IntersectionObserver(entries=>{
    if(!entries[0].isIntersecting)return;
    let value=0,target=Number(countEl.dataset.count)||0;
    const step=Math.max(1,Math.ceil(target/30));
    const timer=setInterval(()=>{value=Math.min(target,value+step);countEl.firstChild.nodeValue=value;if(value>=target)clearInterval(timer)},35);
    counterObserver.disconnect();
  },{threshold:.7});
  counterObserver.observe(countEl);
}

const goalData={
  strength:{number:"01",kicker:"BUILD A STRONG BASE",title:["STRENGTH","TRAINING."],text:"Build foundational strength with consistent resistance training, progressive overload and disciplined sessions.",tags:["WEIGHTS","RESISTANCE","PROGRESSION"]},
  fatloss:{number:"02",kicker:"MOVE MORE. BUILD CAPACITY.",title:["FAT LOSS","CONDITIONING."],text:"Improve fitness and conditioning with focused, consistent training, movement and a routine you can keep.",tags:["ENERGY","CONDITIONING","ROUTINE"]},
  muscle:{number:"03",kicker:"BUILD WITH INTENT",title:["MUSCLE","BUILDING."],text:"Prioritize progressive training, recovery and adequate nutrition while keeping your sessions consistent.",tags:["HYPERTROPHY","RECOVERY","PROGRESSION"]},
  fitness:{number:"04",kicker:"KEEP YOUR BODY READY",title:["GENERAL","FITNESS."],text:"Build a balanced routine across strength, conditioning and movement so fitness becomes part of your lifestyle.",tags:["STRENGTH","ENGINE","BALANCE"]}
};
function setGoal(key){
  const d=goalData[key]; if(!d)return;
  $("#goalNumber").textContent=d.number;$("#goalKicker").textContent=d.kicker;
  $("#goalTitle").innerHTML=`${d.title[0]}<br><em>${d.title[1]}</em>`;
  $("#goalText").textContent=d.text;
  $("#goalTags").innerHTML=d.tags.map(tag=>`<span>${tag}</span>`).join("");
  $$(".goal-tab").forEach(btn=>btn.classList.toggle("active",btn.dataset.goal===key));
  const panel=$("#goalPanel"); if(panel){panel.animate([{opacity:.65,transform:"translateY(5px)"},{opacity:1,transform:"translateY(0)"}],{duration:300,easing:"cubic-bezier(.2,.8,.2,1)"})}
}
$$('.goal-tab').forEach(btn=>btn.addEventListener('click',()=>setGoal(btn.dataset.goal)));

const goalAdvice={Strength:"Focus on progressive resistance training and consistent recovery.","Fat Loss":"Combine resistance training, regular activity and sustainable nutrition.",Muscle:"Prioritize progressive training, recovery and adequate nutrition.",Fitness:"Build a balanced routine across strength, conditioning and mobility."};
$$('.goal-choice').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.goal-choice').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');
  const goal=btn.dataset.goalTool;$("#goalResult").textContent=`${goal} selected — ${goalAdvice[goal]}`;
}));

$("#bmiButton")?.addEventListener("click",()=>{
  const w=parseFloat($("#weight").value),hCm=parseFloat($("#height").value);
  if(!w||!hCm||w<20||w>300||hCm<100||hCm>250){$("#bmiResult").textContent="Please enter valid weight and height.";return}
  const h=hCm/100,bmi=w/(h*h);
  const label=bmi<18.5?"Below the usual adult range":bmi<25?"Within the usual adult range":bmi<30?"Above the usual adult range":"30+ range";
  $("#bmiResult").textContent=`BMI ${bmi.toFixed(1)} — ${label}.`;
});

const reviewTrack=$("#reviewTrack"),reviewDots=$("#reviewDots"),slides=$$('.review-card');
let reviewIndex=0;
if(reviewTrack&&slides.length){
  slides.forEach((_,i)=>{const dot=document.createElement('span');dot.className=i===0?'active':'';reviewDots.appendChild(dot)});
  const dots=$$('span',reviewDots);
  function showReview(index){reviewIndex=(index+slides.length)%slides.length;reviewTrack.style.transform=`translateX(-${reviewIndex*100}%)`;dots.forEach((d,i)=>d.classList.toggle('active',i===reviewIndex))}
  $("#reviewPrev")?.addEventListener('click',()=>showReview(reviewIndex-1));
  $("#reviewNext")?.addEventListener('click',()=>showReview(reviewIndex+1));
  let auto=setInterval(()=>showReview(reviewIndex+1),6500);
  reviewTrack.parentElement.addEventListener('mouseenter',()=>clearInterval(auto));
  reviewTrack.parentElement.addEventListener('mouseleave',()=>auto=setInterval(()=>showReview(reviewIndex+1),6500));
}

const modal=$("#joinModal"),closeModalBtn=$("#modalClose"),selectedPlan=$("#selectedPlan"),modalPlan=$("#modalPlan");
function openModal(plan){
  if(plan){selectedPlan.textContent=plan;modalPlan.value=plan;}
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');setTimeout(()=>$("#name")?.focus(),80);
}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
$$('.plan-trigger').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.dataset.plan)));
closeModalBtn?.addEventListener('click',closeModal);
$$('[data-close="true"]',modal).forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeModal()});

const toast=$("#toast");let toastTimer;
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2600)}
$("#joinForm")?.addEventListener('submit',e=>{
  e.preventDefault();
  const name=$("#name").value.trim(),phone=$("#phone").value.trim(),plan=modalPlan.value;
  if(!name){showToast('Please enter your name.');return}
  if(!/^[0-9+\-\s()]{8,16}$/.test(phone)){showToast('Please enter a valid phone number.');return}
  const msg=`Hi Guru Gym, my name is ${name}. I am interested in ${plan}. My phone number is ${phone}. Please share membership details.`;
  window.open(`https://wa.me/916206502611?text=${encodeURIComponent(msg)}`,'_blank','noopener');
  closeModal();showToast('WhatsApp enquiry prepared.');
});

if(window.matchMedia('(pointer:fine)').matches){
  window.addEventListener('pointermove',e=>{cursorGlow.style.left=e.clientX+'px';cursorGlow.style.top=e.clientY+'px'},{passive:true});
  $$('.tilt').forEach(card=>card.addEventListener('pointermove',e=>{
    const r=card.getBoundingClientRect(),rx=((e.clientY-r.top)/r.height-.5)*-5,ry=((e.clientX-r.left)/r.width-.5)*5;
    card.style.setProperty('--rx',rx+'deg');card.style.setProperty('--ry',ry+'deg');
  }));
  $$('.tilt').forEach(card=>card.addEventListener('pointerleave',()=>{card.style.removeProperty('--rx');card.style.removeProperty('--ry')}));
}

let deferredInstall;
const installBtn=$("#installApp");
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;installBtn.classList.add('show')});
installBtn?.addEventListener('click',async()=>{
  if(!deferredInstall){showToast('Use your browser menu to install the Guru Gym app.');return}
  deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;installBtn.classList.remove('show');
});
window.addEventListener('appinstalled',()=>{installBtn?.classList.remove('show');showToast('Guru Gym is installed. Let’s train.');});

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));}

const hero=$(".hero");
if(hero&&window.matchMedia('(pointer:fine)').matches){
  hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;hero.style.setProperty('--mx',`${x*10}px`);hero.style.setProperty('--my',`${y*10}px`)},{passive:true});
}
