/* Talent 360 · tema oscuro + barra de accesibilidad. Sin scripts de terceros. */
(function(){
  'use strict';
  var d=document.documentElement, KT='t360-theme', KA='t360-a11y';
  function get(k,def){try{var v=localStorage.getItem(k);return v===null?def:v;}catch(e){return def;}}
  function set(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  var prefs={}; try{prefs=JSON.parse(get(KA,'{}'))||{};}catch(e){prefs={};}
  var mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
  function theme(){return d.getAttribute('data-theme')||'light';}
  function applyTheme(t,save){d.setAttribute('data-theme',t);if(save)set(KT,t);var b=document.getElementById('themeBtn');if(b){b.setAttribute('aria-pressed',t==='dark');b.setAttribute('aria-label',t==='dark'?'Desactivar modo oscuro':'Activar modo oscuro');b.title=b.getAttribute('aria-label');}
    var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='dark'?'#0E171C':'#234A5D');}
  function applyPrefs(){
    if(prefs.fs){d.setAttribute('data-fs',prefs.fs);}else d.removeAttribute('data-fs');
    if(prefs.contrast)d.setAttribute('data-contrast','high');else d.removeAttribute('data-contrast');
    if(prefs.underline)d.setAttribute('data-underline','1');else d.removeAttribute('data-underline');
    set(KA,JSON.stringify(prefs));
    var c=document.getElementById('a11yContrast'),u=document.getElementById('a11yUnderline'),lvl=document.getElementById('a11yLevel');
    if(c)c.setAttribute('aria-pressed',!!prefs.contrast); if(u)u.setAttribute('aria-pressed',!!prefs.underline);
    if(lvl)lvl.textContent=['90 %','100 %','112 %','125 %','137 %'][(prefs.fs||0)+1];
  }
  if(mq&&mq.addEventListener)mq.addEventListener('change',function(e){if(!get(KT,null))applyTheme(e.matches?'dark':'light',false);});

  var SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function build(){
    var host=document.querySelector('.topbar .wrap'); if(!host||document.getElementById('a11yBtn')) return;
    var box=document.createElement('div'); box.className='tools';
    box.innerHTML='<button type="button" class="icon-btn" id="themeBtn" aria-pressed="false"><span class="ic-moon">'+MOON+'</span><span class="ic-sun" hidden>'+SUN+'</span></button>'+
      '<button type="button" class="icon-btn" id="a11yBtn" aria-expanded="false" aria-controls="a11yPanel" aria-label="Opciones de accesibilidad" title="Opciones de accesibilidad"><span aria-hidden="true">Aa</span></button>'+
      '<div class="a11y-panel" id="a11yPanel" role="dialog" aria-modal="false" aria-labelledby="a11yTitle" hidden>'+
        '<h2 id="a11yTitle">Accesibilidad</h2>'+
        '<div class="a11y-row"><span>Tamaño de texto <b id="a11yLevel" aria-live="polite">100 %</b></span><span class="grp"><button type="button" id="a11yMinus">A−<span class="sr"> reducir tamaño de texto</span></button><button type="button" id="a11yPlus">A+<span class="sr"> aumentar tamaño de texto</span></button></span></div>'+
        '<div class="a11y-row"><span id="lblC">Alto contraste</span><button type="button" id="a11yContrast" aria-pressed="false" aria-labelledby="lblC">Activar</button></div>'+
        '<div class="a11y-row"><span id="lblU">Subrayar enlaces</span><button type="button" id="a11yUnderline" aria-pressed="false" aria-labelledby="lblU">Activar</button></div>'+
        '<button type="button" class="reset" id="a11yReset">Restablecer</button>'+
      '</div>';
    var menu=host.querySelector('.menu-btn'); host.insertBefore(box,menu);
    var btn=document.getElementById('a11yBtn'),panel=document.getElementById('a11yPanel'),tb=document.getElementById('themeBtn');
    function syncIcons(){var dk=theme()==='dark';tb.querySelector('.ic-moon').hidden=dk;tb.querySelector('.ic-sun').hidden=!dk;}
    tb.addEventListener('click',function(){applyTheme(theme()==='dark'?'light':'dark',true);syncIcons();});
    function open(o){panel.hidden=!o;btn.setAttribute('aria-expanded',o);if(o)document.getElementById('a11yMinus').focus();}
    btn.addEventListener('click',function(){open(panel.hidden);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden){open(false);btn.focus();}});
    document.addEventListener('click',function(e){if(!panel.hidden&&!box.contains(e.target))open(false);});
    document.getElementById('a11yMinus').onclick=function(){prefs.fs=Math.max(-1,(prefs.fs||0)-1);if(prefs.fs===0)delete prefs.fs;applyPrefs();};
    document.getElementById('a11yPlus').onclick=function(){prefs.fs=Math.min(3,(prefs.fs||0)+1);if(prefs.fs===0)delete prefs.fs;applyPrefs();};
    document.getElementById('a11yContrast').onclick=function(){prefs.contrast=!prefs.contrast;applyPrefs();};
    document.getElementById('a11yUnderline').onclick=function(){prefs.underline=!prefs.underline;applyPrefs();};
    document.getElementById('a11yReset').onclick=function(){prefs={};applyPrefs();};
    ['a11yContrast','a11yUnderline'].forEach(function(id){var b=document.getElementById(id);new MutationObserver(function(){b.textContent=b.getAttribute('aria-pressed')==='true'?'Activado':'Activar';}).observe(b,{attributes:true,attributeFilter:['aria-pressed']});});
    applyTheme(theme(),false); syncIcons(); applyPrefs();
    // Menú móvil accesible
    var mb=host.querySelector('.menu-btn'),nav=document.getElementById('nav');
    if(mb&&nav){mb.setAttribute('aria-controls','nav');document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');mb.setAttribute('aria-expanded','false');mb.focus();}});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
