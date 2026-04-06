(() => {
  const LANGS = {
  en:'EN',        
  es:'ES',        
  fr:'FR',        
  de:'DE',        
  it:'IT',        
  pt:'PT',        
  ru:'RU',        
  'zh-CN':'中文', 
  ja:'日本',      
  ko:'한국'       
};

  let activeBtn   = null;
  let activeBar   = null;
  let activeEl    = null;

  function getText(el){
    if(el.tagName==='INPUT'||el.tagName==='TEXTAREA') return el.value;
    return el.textContent||'';
  }
  function setText(el, txt){
    if(el.tagName==='INPUT'||el.tagName==='TEXTAREA') el.value = txt;
    else el.textContent = txt;
  }

 
  function createUI(){
    const btn = document.createElement('button');
    btn.className = 'tr-btn';
    btn.textContent = 'T';
    btn.disabled = true;
    btn.style.display = 'none';         
    document.body.appendChild(btn);

    const bar = document.createElement('div');
    bar.className = 'tr-bar';
    Object.keys(LANGS).forEach(code=>{
      const b = document.createElement('button');
      b.textContent = LANGS[code];
      b.onclick = ()=> translate(code);
      bar.appendChild(b);
    });
    document.body.appendChild(bar);

    return {btn, bar};
  }
  const {btn: floatBtn, bar: floatBar} = createUI();


  function placeBtn(el){
    const r = el.getBoundingClientRect();
    floatBtn.style.left = (window.scrollX + r.right - 24) + 'px';
    floatBtn.style.top  = (window.scrollY + r.top + 2) + 'px';
  }
  function placeBar(){
    const r = floatBtn.getBoundingClientRect();
    floatBar.style.left = (window.scrollX + r.left) + 'px';
    floatBar.style.top  = (window.scrollY + r.bottom + 4) + 'px';
  }


  function showUI(el){
    activeEl = el;
    placeBtn(el);
    floatBtn.style.display = 'block';
    floatBtn.disabled = !getText(el).trim();
  }
  function hideUI(){
    floatBtn.style.display = 'none';
    floatBar.style.display = 'none';
    activeEl = null;
  }

  
  function attach(el){
    if(el.dataset.trReady) return;
    el.dataset.trReady = '1';
    el.addEventListener('focus',  ()=> showUI(el));
    el.addEventListener('blur',   ()=> {          
      window.setTimeout(()=>{ if(document.activeElement!==floatBtn) hideUI(); }, 200);
    });
    el.addEventListener('input',  ()=> floatBtn.disabled = !getText(el).trim());
  }

  
  async function translate(target){
    if(!activeEl) return;
    const text = getText(activeEl);
    if(!text.trim()) return;
    const src = await detectLang(text);
    if(src===target) return;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const json = await (await fetch(url)).json();
    const translated = json[0].map(x=>x[0]).join('');
    setText(activeEl, translated);
    floatBtn.disabled = !translated.trim();
    floatBar.style.display='none';
  }
  async function detectLang(text){
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=ld&q=${encodeURIComponent(text)}`;
    return (await (await fetch(url)).json())[2];
  }


  function scan(root){
    root.querySelectorAll('input, textarea, [contenteditable="true"], [contenteditable=""]').forEach(attach);
  }
  function deepScan(){
    scan(document);
    document.querySelectorAll('iframe, frame').forEach(f=>{
      try{ if(f.contentDocument) scan(f.contentDocument); }catch(e){}
    });
    document.querySelectorAll('*').forEach(el=>{
      if(el.shadowRoot) scan(el.shadowRoot);
    });
  }

  
  const mo = new MutationObserver(()=>{
    deepScan();
  });
  mo.observe(document.body, {childList:true, subtree:true});

  
  floatBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const open = floatBar.style.display==='flex';
    if(!open) placeBar();
    floatBar.style.display = open ? 'none' : 'flex';
  });
  document.addEventListener('click', ()=> floatBar.style.display='none');

 
  deepScan();
})();
