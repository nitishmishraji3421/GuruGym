const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const DB_NAME='guruGymMediaStudio';
const DB_VERSION=2;
const STORE='media';
const OWNER_HASH='730d31207de0edfc62d71a957fc3de410c9da8f59dec9a113a09f5148ea84792';
const SESSION_KEY='guruGymOwnerUnlocked';
const SESSION_TTL=1000*60*30;
let db=null;
let queue=[];
let activeFilter='all';
let searchTerm='';

const fileInput=$('#fileInput');
const dropzone=$('#dropzone');
const queueStatus=$('#queueStatus');
const grid=$('#mediaGrid');
const emptyState=$('#emptyState');
const lightbox=$('#lightbox');
const lightboxMedia=$('#lightboxMedia');
const toast=$('#toast');
const ownerGate=$('#ownerGate');
const ownerMain=$('#studioMain');
const ownerLoginForm=$('#ownerLoginForm');
const ownerPassword=$('#ownerPassword');
const ownerLoginMessage=$('#ownerLoginMessage');

function showToast(message){
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>toast.classList.remove('show'),2500);
}

async function sha256(text){
  const data=new TextEncoder().encode(text);
  const hash=await crypto.subtle.digest('SHA-256',data);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function isOwnerUnlocked(){
  try{
    const raw=sessionStorage.getItem(SESSION_KEY);
    if(!raw)return false;
    const stamp=Number(raw);
    if(!stamp||Date.now()-stamp>SESSION_TTL){sessionStorage.removeItem(SESSION_KEY);return false;}
    return true;
  }catch{return false}
}
function unlockOwner(){
  sessionStorage.setItem(SESSION_KEY,String(Date.now()));
  ownerGate.classList.add('hidden');
  ownerGate.setAttribute('aria-hidden','true');
  ownerMain.setAttribute('aria-hidden','false');
  document.body.classList.remove('owner-locked');
  updateAuthUI(true);
  setTimeout(()=>ownerPassword?.blur(),150);
}
function lockOwner(){
  sessionStorage.removeItem(SESSION_KEY);
  ownerGate.classList.remove('hidden');
  ownerGate.setAttribute('aria-hidden','false');
  ownerMain.setAttribute('aria-hidden','true');
  document.body.classList.add('owner-locked');
  ownerPassword.value='';
  ownerLoginMessage.textContent='Studio locked.';
  updateAuthUI(false);
}
function updateAuthUI(unlocked){
  document.documentElement.classList.toggle('owner-unlocked',unlocked);
}
ownerLoginForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  ownerLoginMessage.textContent='Checking…';
  try{
    const pass=ownerPassword.value;
    const digest=await sha256(pass);
    if(digest===OWNER_HASH){unlockOwner();showToast('Owner mode unlocked.');}
    else {ownerLoginMessage.textContent='Incorrect owner password.';ownerPassword.select();}
  }catch(err){console.error(err);ownerLoginMessage.textContent='Could not verify in this browser.';}
});
$('#lockStudio')?.addEventListener('click',lockOwner);

function openDB(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{
      const database=request.result;
      if(!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE,{keyPath:'id'});
      const tx=request.transaction;
      const store=tx.objectStore(STORE);
      // Backfill old records: existing studio uploads remain public by default.
      store.getAll().onsuccess=e=>{
        const items=e.target.result||[];
        items.forEach(item=>{
          if(typeof item.isPublic!=='boolean'){item.isPublic=true;store.put(item)}
        });
      };
    };
    request.onsuccess=()=>{db=request.result;resolve(db)};
    request.onerror=()=>reject(request.error);
  });
}
function dbPut(item){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(item);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});}
function dbGetAll(){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)});}
function dbDelete(id){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});}
function dbClear(){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});}

function formatBytes(bytes){if(bytes<1024)return `${bytes} B`;const units=['KB','MB','GB'];let n=bytes/1024,i=0;while(n>=1024&&i<units.length-1){n/=1024;i++}return `${n.toFixed(n>=10?0:1)} ${units[i]}`}
function formatDate(ts){return new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(ts));}
function isVideo(type){return type.startsWith('video/')}
function uid(){return `${Date.now()}-${Math.random().toString(36).slice(2,9)}`}

function setQueue(files){
  queue=files.filter(file=>file.type.startsWith('image/')||file.type.startsWith('video/'));
  const totalSize=queue.reduce((sum,file)=>sum+file.size,0);
  queueStatus.textContent=queue.length?`${queue.length} file${queue.length>1?'s':''} selected · ${formatBytes(totalSize)}`:'No files selected.';
}
fileInput.addEventListener('change',()=>setQueue([...fileInput.files]));
['dragenter','dragover'].forEach(type=>dropzone.addEventListener(type,e=>{e.preventDefault();dropzone.classList.add('dragover')}));
['dragleave','drop'].forEach(type=>dropzone.addEventListener(type,e=>{e.preventDefault();dropzone.classList.remove('dragover')}));
dropzone.addEventListener('drop',e=>setQueue([...e.dataTransfer.files]));
$('#clearQueue').addEventListener('click',()=>{queue=[];fileInput.value='';queueStatus.textContent='No files selected.'});

async function saveQueue(){
  if(!isOwnerUnlocked()){lockOwner();return}
  if(!queue.length){showToast('Add at least one photo or video first.');return;}
  const category=$('#category').value;
  const caption=$('#caption').value.trim();
  const featured=$('#featured').value==='featured';
  const isPublic=$('#visibility').value==='public';
  const now=Date.now();
  const saveBtn=$('#saveMedia');
  saveBtn.disabled=true;
  saveBtn.innerHTML='SAVING…';
  try{
    for(const file of queue){
      await dbPut({id:uid(),name:file.name.replace(/\.[^/.]+$/,''),fileName:file.name,type:file.type,size:file.size,category,caption,featured,isPublic,createdAt:now,file});
    }
    showToast(`${queue.length} media item${queue.length>1?'s':''} saved.`);
    queue=[];fileInput.value='';queueStatus.textContent='No files selected.';
    $('#caption').value='';
    await render();
  }catch(err){
    console.error(err);
    showToast('Could not save. Browser storage may be full.');
  }finally{saveBtn.disabled=false;saveBtn.innerHTML='SAVE TO GURU LIBRARY <span>→</span>'}
}
$('#saveMedia').addEventListener('click',saveQueue);

function getVisible(items){
  return items.filter(item=>{
    const filterOk=activeFilter==='all'||item.category===activeFilter;
    const q=searchTerm.toLowerCase();
    const searchOk=!q||[item.name,item.caption,item.category,item.fileName].join(' ').toLowerCase().includes(q);
    return filterOk&&searchOk;
  }).sort((a,b)=>b.createdAt-a.createdAt);
}

function card(item){
  const card=document.createElement('article');
  card.className='media-card'+(item.featured?' featured':'')+(item.isPublic===false?' media-private':'');
  const url=URL.createObjectURL(item.file);
  const type=isVideo(item.type)?'VIDEO':'PHOTO';
  const visibility=item.isPublic===false?'PRIVATE':'PUBLIC';
  const thumb=isVideo(item.type)?`<video src="${url}" muted preload="metadata" playsinline></video><span class="play-badge">▶</span>`:`<img src="${url}" alt="${escapeHtml(item.name)}" loading="lazy">`;
  card.innerHTML=`<div class="media-thumb" data-preview="1">${thumb}<span class="media-type">${type} · ${formatBytes(item.size)}</span><span class="media-category">${escapeHtml(item.category)}</span><span class="media-visibility ${item.isPublic===false?'private':''}">${visibility}</span></div><div class="media-body"><div class="media-date">${formatDate(item.createdAt)}</div><div class="media-title">${escapeHtml(item.name)}</div><div class="media-caption">${escapeHtml(item.caption||'No caption added yet.')}</div><div class="media-actions"><button data-action="preview">OPEN</button><button data-action="download">DOWNLOAD</button><button data-action="toggle" class="publish-toggle">${item.isPublic===false?'PUBLISH':'MAKE PRIVATE'}</button><button data-action="delete" class="delete">DELETE</button></div></div>`;
  card.querySelector('[data-action="preview"]').addEventListener('click',()=>openPreview(item,url));
  card.querySelector('[data-action="download"]').addEventListener('click',()=>downloadFile(item));
  card.querySelector('[data-action="toggle"]').addEventListener('click',async()=>{await toggleVisibility(item)});
  card.querySelector('[data-action="delete"]').addEventListener('click',async()=>{if(!isOwnerUnlocked()){lockOwner();return} if(confirm(`Delete “${item.name}” from this browser?`)){await dbDelete(item.id);showToast('Media removed.');await render()}});
  card.querySelector('[data-preview="1"]').addEventListener('click',()=>openPreview(item,url));
  return card;
}
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
async function toggleVisibility(item){
  if(!isOwnerUnlocked()){lockOwner();return}
  item.isPublic=item.isPublic===false;
  await dbPut(item);
  showToast(item.isPublic?'Published to public gallery.':'Moved to private.');
  await render();
}
function downloadFile(item){
  if(!isOwnerUnlocked()){lockOwner();return}
  const url=URL.createObjectURL(item.file);const a=document.createElement('a');a.href=url;a.download=item.fileName||item.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function openPreview(item,url){
  lightboxMedia.innerHTML='';
  const el=isVideo(item.type)?document.createElement('video'):document.createElement('img');
  el.src=url;el.controls=isVideo(item.type);el.autoplay=isVideo(item.type);el.playsInline=true;el.alt=item.name;
  lightboxMedia.appendChild(el);
  $('#lightboxCategory').textContent=`${item.category.toUpperCase()} · ${isVideo(item.type)?'VIDEO':'PHOTO'} · ${item.isPublic===false?'PRIVATE':'PUBLIC'}`;
  $('#lightboxTitle').textContent=item.name;
  $('#lightboxCaption').textContent=item.caption||'No caption added.';
  lightbox.classList.add('open');lightbox.setAttribute('aria-hidden','false');document.body.classList.add('lightbox-open');
}
function closeLightbox(){lightbox.classList.remove('open');lightbox.setAttribute('aria-hidden','true');document.body.classList.remove('lightbox-open');lightboxMedia.innerHTML=''}
$('#lightboxClose').addEventListener('click',closeLightbox);lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox()});

async function render(){
  const items=await dbGetAll();
  const visible=getVisible(items);
  $('#countAll').textContent=items.length;
  $('#countPhotos').textContent=items.filter(i=>!isVideo(i.type)).length;
  $('#countVideos').textContent=items.filter(i=>isVideo(i.type)).length;
  $('#resultsCount').textContent=visible.length;
  const publicCount=items.filter(i=>i.isPublic!==false).length;
  $('#storageState').textContent=publicCount?`${publicCount} PUBLIC`:'LOCAL';
  grid.innerHTML='';
  emptyState.style.display=visible.length?'none':'grid';
  visible.forEach(item=>grid.appendChild(card(item)));
}

$$('.filter').forEach(btn=>btn.addEventListener('click',async()=>{
  $$('.filter').forEach(x=>x.classList.remove('active'));btn.classList.add('active');activeFilter=btn.dataset.filter;await render();
}));
$('#searchMedia').addEventListener('input',async e=>{searchTerm=e.target.value.trim();await render()});

$('#clearLibrary').addEventListener('click',async()=>{
  if(!isOwnerUnlocked()){lockOwner();return}
  const items=await dbGetAll();
  if(!items.length){showToast('Library is already empty.');return}
  if(!confirm('Delete every saved media item from this browser?'))return;
  await dbClear();showToast('Library cleared.');await render();
});

$('#exportCatalog').addEventListener('click',async()=>{
  if(!isOwnerUnlocked()){lockOwner();return}
  const items=await dbGetAll();
  if(!items.length){showToast('Nothing to export yet.');return}
  const catalog=items.map(({file,...meta})=>meta);
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),items:catalog},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='guru-gym-media-catalog.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Media catalog exported.');
});

const studioMenu=$('#studioMenu');const studioNav=$('.studio-nav');studioMenu?.addEventListener('click',()=>studioNav.classList.toggle('open'));$$('.studio-nav a').forEach(a=>a.addEventListener('click',()=>studioNav.classList.remove('open')));

(async()=>{
  try{
    await openDB();
    if(isOwnerUnlocked())unlockOwner();else{updateAuthUI(false);document.body.classList.add('owner-locked');}
    await render();
  }catch(err){console.error(err);$('#storageState').textContent='ERROR';showToast('Browser storage is unavailable in this mode.');}
})();
