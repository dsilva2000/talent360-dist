/* Portal de prácticas · Talent 360. Lista pública con avance (data/practicas.json); la oferta completa
   (data/practicas_full.json) se descarga solo después de registrarse. Sin cookies: el registro se recuerda
   en localStorage solo como una marca (sin datos personales). */
(function(){
'use strict';
var T=window.T360||{};
var CONFIG={ dataUrl:'../data/practicas.json', fullUrl:'../data/practicas_full.json', pageSize:24,
  showSource: T.practicasShowSourceAfterRegister!==false, regKey:'t360-practicas-reg', email:T.email||'info@mancolab.com' };
var $=function(s,r){return (r||document).querySelector(s);}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var mb=$('#menuBtn'),nav=$('#nav'); if(mb) mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o);});
var META={}, ALL=[], FULL=null, view=[], shown=0, st={sec:'',lvl:'',area:'',reg:'',pay:false,q:'',sort:'new'};
function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function iso(d){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function fmt(d){return d?d.toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'}):'';}
function region(loc){var p=(loc||'').split(',').map(function(x){return x.trim();}).filter(Boolean);return p.length?p[p.length-1]:'Sin región';}
function el(t,a,k){var e=document.createElement(t);a=a||{};for(var x in a){if(a[x]==null)continue;if(x==='text')e.textContent=a[x];else if(x==='cls')e.className=a[x];else e.setAttribute(x,a[x]);}(k||[]).forEach(function(c){if(c)e.appendChild(typeof c==='string'?document.createTextNode(c):c);});return e;}
function isReg(){try{var r=JSON.parse(localStorage.getItem(CONFIG.regKey)||'null');return !!(r&&r.v===1);}catch(e){return false;}}
function setReg(){try{localStorage.setItem(CONFIG.regKey,JSON.stringify({v:1,at:new Date().toISOString().slice(0,10)}));}catch(e){}}
var today=new Date(); today.setHours(0,0,0,0);

function loadFull(){
  if(FULL) return Promise.resolve(FULL);
  return fetch(CONFIG.fullUrl,{credentials:'omit'}).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(j){FULL=j.offers||{};return FULL;});
}
fetch(CONFIG.dataUrl,{credentials:'omit'}).then(function(r){return r.json();}).then(function(d){
  META=d; ALL=(d.offers||[]).map(function(o){o._p=iso(o.posted);o._c=iso(o.close);o._r=region(o.loc);o._t=norm([o.title,o.area,o.loc,o.lvl].join(' '));return o;});
  ALL=ALL.filter(function(o){return !o._c||o._c>=today;});
  buildFilters();
  if(isReg()) loadFull().then(apply,apply); else apply();
}).catch(function(){ $('#list').appendChild(el('div',{cls:'empty',text:'No pudimos cargar las convocatorias. Intenta de nuevo en unos minutos.'})); });

function counts(key){var c={};ALL.forEach(function(o){c[o[key]]=(c[o[key]]||0)+1;});return c;}
function buildFilters(){
  var defs={sec:{publico:'Público',privado:'Privado'}};
  ['sec','lvl','area'].forEach(function(k){
    var box=$('.chips[data-f="'+k+'"]'), c=counts(k);
    var keys=Object.keys(c).sort(function(a,b){return c[b]-c[a];});
    [''].concat(keys).forEach(function(v){
      var lab=v===''?'Todos':(defs[k]&&defs[k][v])||v;
      var b=el('button',{cls:'chip'+(v===''?' on':''),type:'button','data-v':v,'aria-pressed':v===''?'true':'false'},[lab+' ',v?el('small',{text:String(c[v])}):null]);
      b.addEventListener('click',function(){st[k]=v;$$('.chips[data-f="'+k+'"] .chip').forEach(function(x){x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b);});apply();});
      box.appendChild(b);
    });
  });
  var rc=counts('_r'), regs=Object.keys(rc).sort(function(a,b){return a.localeCompare(b,'es');});
  regs.forEach(function(r){$('#fReg').appendChild(el('option',{value:r,text:r+' ('+rc[r]+')'}));$('#aReg').appendChild(el('option',{value:r,text:r}));});
  var pub=ALL.filter(function(o){return o.sec==='publico';}).length;
  [[ALL.length,'convocatorias vigentes'],[pub,'del sector público'],[ALL.length-pub,'del sector privado'],[regs.length,'ciudades y regiones']].forEach(function(k){
    $('#kpis').appendChild(el('div',{cls:'kpi'},[el('b',{text:String(k[0])}),el('span',{text:k[1]})]));
  });
  var u=new Date(META.updatedAt||Date.now());
  $('#updated').textContent='Última actualización: '+u.toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'})+'. Fuentes: '+(META.sources||[]).join(', ')+'.';
}
$('#fReg').addEventListener('change',function(){st.reg=this.value;apply();});
$('#fPay').addEventListener('change',function(){st.pay=this.checked;apply();});
$('#sort').addEventListener('change',function(){st.sort=this.value;apply();});
var qt; $('#q').addEventListener('input',function(){var v=this.value;clearTimeout(qt);qt=setTimeout(function(){st.q=norm(v.trim());apply();},150);});
$('#clear').addEventListener('click',function(){st={sec:'',lvl:'',area:'',reg:'',pay:false,q:'',sort:st.sort};$('#q').value='';$('#fReg').value='';$('#fPay').checked=false;$$('.chip').forEach(function(c){c.classList.toggle('on',c.getAttribute('data-v')==='');c.setAttribute('aria-pressed',c.getAttribute('data-v')==='');});apply();});

function apply(){
  var words=st.q?st.q.split(/\s+/):[];
  view=ALL.filter(function(o){
    var t=o._t; if(FULL&&FULL[o.id]) t+=' '+norm(FULL[o.id].org);
    return (!st.sec||o.sec===st.sec)&&(!st.lvl||o.lvl===st.lvl)&&(!st.area||o.area===st.area)&&(!st.reg||o._r===st.reg)&&(!st.pay||o.paid)&&words.every(function(w){return t.indexOf(w)>=0;});
  });
  var far=9e15;
  var rec=function(o){return o._p?+o._p:+today-2*864e5;}; // sin fecha de publicación (Estado): se ordena como reciente, no se muestra
  view.sort(st.sort==='close'?function(a,b){return (a._c||far)-(b._c||far);}:function(a,b){return rec(b)-rec(a);});
  $('#list').innerHTML=''; shown=0; more();
  $('#count').textContent=view.length.toLocaleString('es-PE')+' convocatoria'+(view.length===1?'':'s')+(view.length!==ALL.length?' con estos filtros':'');
  if(!view.length) $('#list').appendChild(el('div',{cls:'empty',style:'grid-column:1/-1',text:'No hay convocatorias con estos filtros. Prueba quitando alguno o activa una alerta para tu carrera.'}));
  var rb=$('#regBanner'); if(rb) rb.hidden=!FULL;
}
function dateLine(o){
  var bits=[]; if(o._p) bits.push('Publicada: '+fmt(o._p)); if(o._c) bits.push('Cierra: '+fmt(o._c)); return bits.join(' · ');
}
function card(o){
  var F=FULL&&FULL[o.id];
  var meta=el('div',{cls:'meta'},[
    el('span',{cls:'b '+(o.sec==='publico'?'pub':'priv'),text:o.sec==='publico'?'Público':'Privado'}),
    o.area?el('span',{cls:'b',text:o.area}):null,
    el('span',{cls:'b',text:o.lvl}),
    o.loc?el('span',{cls:'b',text:o.loc}):null,
    o.mod?el('span',{cls:'b',text:o.mod}):null,
    F&&F.pay?el('span',{cls:'b pay',text:F.pay}):(o.paid&&!F?el('span',{cls:'b pay',text:'Con subvención'}):null)
  ]);
  if(o._c){var days=Math.round((o._c-today)/864e5); if(days<=3) meta.appendChild(el('span',{cls:'b soon',text:days<=0?'Cierra hoy':'Cierra en '+days+' día'+(days===1?'':'s')}));}
  var btn=el('button',{type:'button',cls:'btn btn-sm '+(F?'btn-ghost':'btn-primary'),'aria-label':(F?'Ver detalles: ':'Ver oferta completa: ')+o.title,text:F?'Ver detalles':'Ver oferta completa'});
  btn.addEventListener('click',function(){open(o,btn);});
  return el('article',{cls:'offer'+(F?'':' teaser')},[
    el('div',{cls:'org',text:F?F.org:(o.sec==='publico'?'Entidad pública':'Empresa privada')+' · se muestra al registrarte'}),
    el('h3',{text:o.title}),
    meta,
    F&&F.desc?el('p',{cls:'desc',text:F.desc.length>220?F.desc.slice(0,220).replace(/\s+\S*$/,'')+'…':F.desc}):el('p',{cls:'muted small',text:'Regístrate gratis para ver la empresa, la descripción completa y los requisitos.'}),
    el('div',{cls:'foot-o'},[el('span',{text:dateLine(o)}),btn])
  ]);
}
function more(){
  var list=$('#list'), end=Math.min(view.length,shown+CONFIG.pageSize);
  for(var i=shown;i<end;i++){
    list.appendChild(card(view[i]));
    if(i===7) list.appendChild(el('div',{cls:'inline-cta'},[el('span',{},[el('b',{text:'¿Tu LinkedIn está listo para postular? '}),'CareerScore te dice qué mejorar en 2 minutos.']),el('a',{cls:'btn btn-primary btn-sm',href:'../careerscore/#careerscore',text:'Haz tu CareerScore gratis'})]));
  }
  shown=end; $('#moreBtn').hidden=shown>=view.length;
}
$('#moreBtn').addEventListener('click',more);

// ── Diálogo: registro (antes) o detalle (después)
var dlg=$('#regDialog'), form=$('#regForm'), det=$('#offerDetail'), current=null, opener=null;
function fillDetail(o){
  var F=(FULL||{})[o.id]||{}; det.innerHTML='';
  det.appendChild(el('p',{cls:'org',text:F.org||''}));
  det.appendChild(el('h3',{id:'detTitle',text:F.title||o.title}));
  var dl=el('dl',{cls:'det-dl'});
  [['Ubicación',o.loc],['Modalidad',o.mod||'No indica'],['Nivel',o.lvl],['Área',o.area],['Subvención',F.pay||'No indica'],['Vacantes',F.vac],['Publicada',fmt(o._p)],['Cierre',fmt(o._c)||'No indica'],['Fuente',F.src]].forEach(function(r){if(r[1]){dl.appendChild(el('dt',{text:r[0]}));dl.appendChild(el('dd',{text:r[1]}));}});
  det.appendChild(dl);
  if(F.desc){det.appendChild(el('h4',{text:'Descripción'}));det.appendChild(el('p',{cls:'pre',text:F.desc}));}
  if(F.req){det.appendChild(el('h4',{text:'Requisitos'}));det.appendChild(el('p',{cls:'pre',text:F.req}));}
  if(CONFIG.showSource&&F.url){
    det.appendChild(el('p',{cls:'small muted',text:'Verifica las bases, requisitos y fecha de cierre en la publicación original antes de postular. Manco Lab no intermedia en el proceso.'}));
    det.appendChild(el('a',{cls:'btn btn-primary',href:F.url,target:'_blank',rel:'noopener nofollow noreferrer',text:'Ver la publicación original (abre en una pestaña nueva)'}));
  } else {
    det.appendChild(el('p',{cls:'form-status ok',text:'Te contactaremos con los detalles para postular a esta convocatoria.'}));
  }
}
function open(o,btn){
  current=o; opener=btn;
  if(FULL){ form.hidden=true; det.hidden=false; fillDetail(o); $('#regTitle').textContent='Detalle de la convocatoria'; }
  else {
    form.hidden=false; det.hidden=true; $('#regTitle').textContent='Regístrate para ver la oferta completa';
    $('#rOffer').value=o.id+' · '+o.title+' · '+(o.loc||'')+(o.sec==='publico'?' · público':' · privado');
    $('#rOfferShow').textContent=o.title+(o.loc?' · '+o.loc:'');
    if(window.T360Forms) window.T360Forms.reset(form);
  }
  if(dlg.showModal) dlg.showModal(); else dlg.setAttribute('open','');
  setTimeout(function(){var f=FULL?$('#detTitle'):$('#rName'); if(f){if(FULL)f.setAttribute('tabindex','-1'); f.focus();}},30);
}
function close(){ if(dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
$('#regClose').addEventListener('click',close);
dlg.addEventListener('click',function(e){ if(e.target===dlg) close(); });
dlg.addEventListener('close',function(){ if(opener&&document.body.contains(opener)) opener.focus(); });
form.addEventListener('t360:sent',function(){
  setReg();
  loadFull().then(function(){
    var keepId=current&&current.id; apply();
    form.hidden=true; det.hidden=false; $('#regTitle').textContent='¡Listo! Ya puedes ver las ofertas completas';
    if(current) fillDetail(current);
    det.insertBefore(el('p',{cls:'form-status ok',role:'status',text:'Gracias por registrarte. '+(CONFIG.showSource?'Aquí tienes la oferta completa.':'Te contactaremos con los detalles.')}),det.firstChild);
    var t=$('#detTitle'); if(t){t.setAttribute('tabindex','-1');t.focus();}
    var again=$$('#list .offer button').filter(function(b){return keepId&&b.getAttribute('aria-label').indexOf(current.title)>=0;})[0]; if(again) opener=again;
  }).catch(function(){
    form.hidden=true; det.hidden=false; det.innerHTML=''; det.appendChild(el('p',{cls:'form-status ok',role:'status',tabindex:'-1',text:'Gracias por registrarte. Te contactaremos con los detalles.'})); det.firstChild.focus();
  });
});
})();
