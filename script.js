const header=document.getElementById("header");
window.addEventListener("scroll",()=>{header.classList.toggle("scrolled",window.scrollY>70)});
const menu=document.querySelector(".menu-btn"),nav=document.querySelector(".nav");
menu.addEventListener("click",()=>nav.classList.toggle("open"));
document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")})},{threshold:.12});
document.querySelectorAll(".section,.program-card,.plan,.review-grid blockquote,.contact-item").forEach(el=>{el.classList.add("fade-in");observer.observe(el)});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener("click",e=>{const target=document.querySelector(a.getAttribute("href"));if(target){e.preventDefault();target.scrollIntoView({behavior:"smooth"})}}));
