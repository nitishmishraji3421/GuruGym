const GALLERY_DB='guruGymMediaStudio';
const GALLERY_STORE='media';
let galleryObjectUrls=[];
function galleryOpenDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(GALLERY_DB);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function galleryGetAll(db){return new Promise((resolve,reject)=>{const tx=db.transaction(GALLERY_STORE,'readonly');const req=tx.objectStore(GALLERY_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});}
function galleryEsc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function galleryIsVideo(type=''){return type.startsWith('video/');}
function galleryFallback(){return [
  {type:'image/jpeg',category:'Gym',name:'The Guru Standard',caption:'A focused training environment built for consistency.',src:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=86'},
  {type:'image/jpeg',category:'Training',name:'Train Hard',caption:'Show up, put in the work, repeat.',src:'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=86'},
  {type:'image/jpeg',category:'Strength',name:'Build Stronger',caption:'Progress is built one session at a time.',src:'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=86'},
  {type:'image/jpeg',category:'Fitness',name:'Stay Consistent',caption:'The energy lives on the floor.',src:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=86'}
];}
function renderPublicGallery(items){
  const grids=[document.querySelector('#publicGalleryGrid'),document.querySelector('#publicGalleryPageGrid')].filter(Boolean);
  const empty=document.querySelector('#publicGalleryEmpty');
  galleryObjectUrls.forEach(URL.revokeObjectURL);galleryObjectUrls=[];
  if(!grids.length)return;
  grids.forEach(g=>g.innerHTML='');
  const cards=items.slice(0,12);
  if(!cards.length){if(empty)empty.hidden=false;return;} if(empty)empty.hidden=true;
  cards.forEach(item=>{
    let src=item.src;
    if(item.file){src=URL.createObjectURL(item.file);galleryObjectUrls.push(src);}
    const article=document.createElement('article');article.className='public-gallery-card';
    const media=galleryIsVideo(item.type)?`<video src="${src}" muted autoplay loop playsinline preload="metadata"></video><span class="gallery-play">▶</span>`:`<img src="${src}" alt="${galleryEsc(item.name||'Guru Gym media')}" loading="lazy">`;
    article.innerHTML=`${media}<div class="public-gallery-meta"><span>${galleryEsc(item.category||'GURU GYM')}</span><strong>${galleryEsc(item.name||'Guru Gym')}</strong><p>${galleryEsc(item.caption||'')}</p></div>`;
    grids.forEach(g=>g.appendChild(article.cloneNode(true)));
  });
}
(async()=>{
  try{
    const db=await galleryOpenDB();
    const items=await galleryGetAll(db);
    const publicItems=items.filter(i=>i.isPublic!==false).sort((a,b)=>b.createdAt-a.createdAt);
    renderPublicGallery(publicItems);
  }catch(err){
    renderPublicGallery(galleryFallback());
  }
})();
