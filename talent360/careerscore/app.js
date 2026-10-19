/* Talent 360 · CareerScore (MVP 100% en el navegador). Sin claves ni servidores. */
(function(){
'use strict';
// ── Configuración: completar antes de publicar ─────────────────────────────
var T=window.T360||{};
var CONFIG = {
  email: T.email||'info@mancolab.com',
  formEndpoint: (T.formMode==='formsubmit' && T.formsubmitEndpoint) ? T.formsubmitEndpoint : ''  // vacío = abre el correo (mailto)
};
var $ = function(s,r){return (r||document).querySelector(s);};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var lastResult = null;

// ── Menú móvil
var mb=$('#menuBtn'), nav=$('#nav');
if(mb){mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o);});
  $$('#nav a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');});});}

// ── Contacto por correo (sin WhatsApp)
function mailLink(subject,msg){
  return 'mailto:'+CONFIG.email+'?subject='+encodeURIComponent(subject||'Consulta Talent 360')+'&body='+encodeURIComponent(msg||'');
}
function bindMail(root){
  $$('.js-mail',root).forEach(function(a){
    a.addEventListener('click',function(e){
      e.preventDefault();
      var msg=a.getAttribute('data-msg')||'Hola, quiero información sobre Talent 360.';
      if(lastResult && a.hasAttribute('data-with-score')) msg+=' Mi CareerScore salió '+lastResult.total+'/100.';
      window.location.href=mailLink(a.getAttribute('data-subject'),msg);
    });
  });
}
bindMail(document);
$$('[data-interest]').forEach(function(a){a.addEventListener('click',function(){var s=$('#lfType'); if(s) s.value=a.getAttribute('data-interest');});});

if($('#step1')){
// ── Pestañas
var mode='txt', pdfFile=null;
// ── URL pública de LinkedIn: solo se valida el formato y se evalúa el slug. No se lee el perfil.
var LI_RX=/^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([^\/?#\s]{3,100})\/?(?:[?#].*)?$/i;
function slugInfo(raw){
  var v=(raw||'').trim(); if(!v) return {empty:true};
  var m=LI_RX.exec(v); if(!m) return {valid:false};
  var slug=decodeURIComponent(m[1]).toLowerCase();
  var auto=/-[0-9a-f]{6,}$/i.test(slug)||/\d{4,}/.test(slug)||/-\d{1,3}[a-z]\d/i.test(slug)||/-(?=(?:[a-z]*\d){3})[a-z0-9]{6,}$/i.test(slug);
  return {valid:true,slug:slug,custom:!auto};
}
var liUrl=$('#liUrl');
function showUrl(){
  var i=slugInfo(liUrl.value), m=$('#liUrlMsg');
  if(i.empty){m.textContent='';m.className='small';liUrl.removeAttribute('aria-invalid');return i;}
  if(!i.valid){m.textContent='Revisa el formato: debe ser como linkedin.com/in/tunombre.';m.className='small url-bad';liUrl.setAttribute('aria-invalid','true');return i;}
  liUrl.removeAttribute('aria-invalid');
  if(i.custom){m.textContent='✓ URL personalizada (linkedin.com/in/'+i.slug+').';m.className='small url-ok';}
  else{m.textContent='Tu URL tiene números o códigos al final. Personalizarla suma puntos: Ver perfil › Editar perfil público y URL.';m.className='small url-warn';}
  return i;
}
if(liUrl){liUrl.addEventListener('input',function(){var i=showUrl(); if(i.empty||i.valid) hideErr('err1');});liUrl.addEventListener('blur',showUrl);}
$$('.tabs button').forEach(function(b){
  b.addEventListener('click',function(){
    mode=b.getAttribute('data-tab');
    $$('.tabs button').forEach(function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-selected',on);});
    $('#tab-pdf').hidden = mode!=='pdf'; $('#tab-txt').hidden = mode!=='txt';
  });
});
var txtIn=$('#txtIn');
txtIn.addEventListener('input',function(){$('#txtCount').textContent=txtIn.value.length.toLocaleString('es-PE');});

// ── Carga de PDF
var drop=$('#drop'), pdfIn=$('#pdfIn');
function setFile(f){
  if(!f) return;
  if(!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)){showErr('err1','El archivo debe ser un PDF.');return;}
  if(f.size>5*1024*1024){showErr('err1','El PDF pesa más de 5 MB. Descárgalo de nuevo desde LinkedIn.');return;}
  pdfFile=f; $('#pdfName').textContent='✓ '+f.name+' ('+Math.round(f.size/1024)+' KB)'; hideErr('err1');
}
pdfIn.addEventListener('change',function(){setFile(pdfIn.files[0]);});
['dragenter','dragover'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.add('over');});});
['dragleave','drop'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.remove('over');});});
drop.addEventListener('drop',function(e){if(e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);});

function showErr(id,m){var e=$('#'+id);e.textContent=m;e.style.display='block';}
function hideErr(id){$('#'+id).style.display='none';}
function step(n){
  ['step1','step2','step3','stepLoad'].forEach(function(id){$('#'+id).hidden=true;});
  $('#'+(n===0?'stepLoad':'step'+n)).hidden=false;
  [1,2,3].forEach(function(i){$('#st'+i).classList.toggle('on',i===n || (n===0&&i===3));});
}

// pdf.js desde jsDelivr. El worker se descarga con verificación de integridad (SRI) y se ejecuta desde un blob local.
var PDFJS_WORKER={url:'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',integrity:'sha384-SnzOobpRMLXZ52iJvZm/C0fYw0OQemTXzTjIsdsfMcrCtCEe9qgzxTd3RSklO5x2'};
var workerReady=null;
function pdfjsWorker(lib){
  if(!workerReady){
    workerReady=fetch(PDFJS_WORKER.url,{integrity:PDFJS_WORKER.integrity,mode:'cors',credentials:'omit',referrerPolicy:'no-referrer'})
      .then(function(r){if(!r.ok) throw new Error('worker '+r.status);return r.blob();})
      .then(function(b){lib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([b],{type:'text/javascript'}));})
      .catch(function(e){workerReady=null;throw e;});
  }
  return workerReady;
}
function pdfjsUnavailable(){return window.__pdfjsFailed || !window.pdfjsLib;}
function noPdfMsg(){
  var n=$('#pdfName'); if(!n) return;
  n.textContent='No pudimos cargar el lector de PDF (puede ser tu red o un bloqueador). Usa la pestaña “Pegar el texto del perfil”: funciona igual.';
  n.classList.add('url-bad');
}
window.addEventListener('load',function(){ if(pdfjsUnavailable()) noPdfMsg(); });
async function pdfToText(file){
  var lib=window.pdfjsLib; if(!lib) { var e0=new Error('pdfjs'); e0.code='nolib'; throw e0; }
  try{ await pdfjsWorker(lib); }catch(e){ var e1=new Error('pdfjs-worker'); e1.code='nolib'; throw e1; }
  var buf=await file.arrayBuffer();
  var doc=await lib.getDocument({data:buf}).promise, out=[];
  for(var p=1;p<=Math.min(doc.numPages,12);p++){
    var page=await doc.getPage(p), tc=await page.getTextContent(), lastY=null, line='';
    tc.items.forEach(function(it){
      var y=Math.round(it.transform[5]);
      if(lastY!==null && Math.abs(y-lastY)>2){out.push(line.trim());line='';}
      line+=it.str+(it.hasEOL?'':' '); lastY=y;
      if(it.hasEOL){out.push(line.trim());line='';lastY=null;}
    });
    if(line.trim()) out.push(line.trim());
    out.push('');
  }
  return out.join('\n').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n');
}

// ── Lectura del perfil
var H = { // encabezados de sección ES/EN (PDF y texto copiado)
  contact:/^(contactar|contacto|contact|información de contacto)$/i,
  skills:/^(aptitudes principales|top skills|aptitudes|skills|habilidades|competencias)$/i,
  langs:/^(languages|idiomas)$/i,
  certs:/^(certifications|certificaciones|licencias y certificaciones|licenses & certifications|licenses and certifications)$/i,
  honors:/^(honors-awards|reconocimientos y premios|honors & awards|premios)$/i,
  pubs:/^(publications|publicaciones)$/i,
  summary:/^(extracto|summary|acerca de|about|resumen)$/i,
  exp:/^(experiencia|experience)$/i,
  edu:/^(educación|educacion|education|formación|formacion)$/i,
  recos:/^(recomendaciones|recommendations)$/i,
  act:/^(actividad|activity)$/i,
  vol:/^(voluntariado|volunteering|experiencia de voluntariado)$/i
};
function parseProfile(raw){
  var lines=raw.split('\n').map(function(l){return l.trim();}).filter(function(l){return !/^page \d+ of \d+$/i.test(l) && !/^página \d+ de \d+$/i.test(l);});
  var sec={_pre:[]}, cur='_pre', order=[];
  lines.forEach(function(l){
    var k=null; for(var key in H){ if(H[key].test(l)){k=key;break;} }
    if(k){cur=k; if(!sec[k]) sec[k]=[]; order.push(k); return;}
    (sec[cur]=sec[cur]||[]).push(l);
  });
  var txt=function(k){return (sec[k]||[]).join('\n').trim();};
  // Titular: en el PDF de LinkedIn, el nombre/titular/ubicación quedan justo antes de Extracto o Experiencia.
  var headline='', name='';
  var mainKey = sec.summary? 'summary' : 'exp';
  var idx = order.indexOf(mainKey);
  var prevKey = idx>0 ? order[idx-1] : '_pre';
  // Texto copiado de la web: quitar ruido de la cabecera (pronombres, contactos, botones)
  var NOISE=/^(él|ella|elle|he\/him|she\/her|they\/them|él\/lo|ella\/la|conectar|seguir|mensaje|enviar mensaje|más|more|connect|follow|message|abierto a|open to|disponible para trabajar|ver perfil|\d[\d.,]*\+?\s*(contactos|seguidores|connections|followers)|más de \d+ contactos|\d+ contactos en común.*)$/i;
  var block=(sec[prevKey]||[]).filter(Boolean).filter(function(l){return !NOISE.test(l);}).map(function(l){return l.replace(/\s*·\s*(información de contacto|contact info)\s*$/i,'');}).filter(Boolean);
  if(block.length>=2){
    var loc=block[block.length-1];
    var isLoc=/(perú|peru|lima|chile|colombia|méxico|mexico|argentina|ecuador|bolivia|españa|spain|estados unidos|united states|area|área|region|región|metropolitana)/i.test(loc) && loc.length<70;
    var end=isLoc?block.length-1:block.length;
    // nombre = línea corta en "Formato Título" antes del titular
    var start=Math.max(0,end-4);
    for(var i=start;i<end;i++){ if(/^[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ.'-]+( [A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ.'-]+){1,4}$/.test(block[i]) && block[i].length<45){ name=block[i]; start=i+1; } }
    headline=block.slice(start,end).join(' ').trim();
    if(headline.length>240) headline=headline.slice(0,240);
  }
  var urlM=raw.match(/linkedin\.com\/in\/([A-Za-z0-9\-_%]+)/i);
  return {
    raw:raw, name:name, headline:headline,
    summary:txt('summary'), exp:txt('exp'), edu:txt('edu'), skills:txt('skills'),
    langs:txt('langs'), certs:txt('certs'), honors:txt('honors'), pubs:txt('pubs'), vol:txt('vol'),
    contact:txt('contact'), recos:txt('recos'),
    vanity: urlM? urlM[1] : '',
    hasEmail:/[\w.+-]+@[\w-]+\.[\w.]+/.test(raw),
    found: order
  };
}

// ── Puntuación
var VERBS=/\b(lideré|liderar|lidero|gestioné|gestiono|implementé|implemento|desarrollé|desarrollo|diseñé|diseño|reduje|reducir|incrementé|aumenté|logré|optimicé|automaticé|negocié|coordiné|dirigí|lancé|creé|mejoré|ahorré|capacité|supervisé|led|managed|implemented|developed|designed|reduced|increased|achieved|optimized|launched|built|improved|saved|negotiated|delivered)\b/gi;
var DATE_RX=/\b(ene(ro)?|feb(rero)?|mar(zo)?|abr(il)?|may(o)?|jun(io)?|jul(io)?|ago(sto)?|sep(tiembre)?|set(iembre)?|oct(ubre)?|nov(iembre)?|dic(iembre)?|jan(uary)?|april|aug(ust)?|dec(ember)?)\.?\s+(de\s+)?(19|20)\d{2}\b/gi;
var HUMAN=/(liderazgo|lider|negociaci|gesti[oó]n de equipos|estrateg|relaci[oó]n con clientes|stakeholder|coaching|mentor|comunicaci|cambio organizacional|gesti[oó]n del cambio|innovaci|ventas consultivas|docen|investigaci|toma de decisiones|resoluci[oó]n de problemas|pensamiento cr[ií]tico|creativ|empat|facilitaci|consultor|leadership|negotiation|strategy|stakeholder management|problem solving|critical thinking)/gi;
var ROUTINE=/(digitaci|data entry|ingreso de datos|transcripci|atenci[oó]n telef[oó]nica|call center|archivo|registro de datos|facturaci|conciliaci[oó]n bancaria|cajer|asistente administrativ|recepcionista|traducci[oó]n|captura de datos)/gi;
function count(rx,s){var m=(s||'').match(rx);return m?m.length:0;}
function words(s){return (s||'').split(/\s+/).filter(Boolean).length;}
function clamp(n){return Math.max(0,Math.min(100,Math.round(n)));}
function radio(n){var r=$('input[name="'+n+'"]:checked');return r?parseInt(r.value,10):null;}

function score(p, ans){
  var D=[], tips;
  // 1 Titular
  var h=ans.headline||'', s=0; tips=[];
  if(!h){ tips.push('No detectamos titular. Escribe uno que diga qué haces, en qué eres fuerte y para quién.'); }
  else{
    var L=h.length; s+= L>=60?35: L>=35?22:10;
    if(L<60) tips.push('Tu titular es corto ('+L+' caracteres). Aprovecha hasta 220: puesto + especialidad + resultado que generas.');
    var parts=h.split(/[|·•\/,–-]/).filter(function(x){return x.trim().length>2;}).length;
    s+= parts>=3?25: parts==2?15:5;
    if(parts<2) tips.push('Divide el titular en 2 o 3 ideas separadas por “|”: rol, especialidad y valor.');
    if(/(ayudo|ayudando|impulso|reduzco|aumento|logro|transformo|conecto|help|helping|\+\s?\d|\d+\s?%)/i.test(h)) s+=25; else tips.push('Agrega qué resultado logras para otros (por ejemplo, “ayudo a reducir costos operativos”).');
    if(!/(en busca|buscando|open to work|disponible|desempleado)/i.test(h)) s+=15; else tips.push('Evita poner “en búsqueda” en el titular: usa el marco “Open to work” y deja el titular para tu propuesta de valor.');
  }
  D.push({k:'titular',n:'Titular y propuesta de valor',w:12,s:clamp(s),tips:tips});
  // 2 Acerca de
  var sm=p.summary, w=words(sm); s=0; tips=[];
  if(!sm){ tips.push('No tienes sección Acerca de (o no la encontramos). Escribe 150–300 palabras: quién eres, qué resuelves y tus 2–3 logros principales.'); }
  else{
    s+= w>=150&&w<=450?40: w>=80?28: w>450?30:12;
    if(w<150) tips.push('Tu Acerca de tiene '+w+' palabras. Lleva a 150–300 para contar tu historia con contexto.');
    if(w>450) tips.push('Tu Acerca de es largo ('+w+' palabras). Las 3 primeras líneas deciden si siguen leyendo: ponlas al inicio.');
    if(/\d/.test(sm.replace(DATE_RX,''))) s+=20; else tips.push('Incluye al menos una cifra en tu resumen (años, equipos, montos, % de mejora).');
    if(/\b(yo|mi|me|soy|he|i am|i\'m|my)\b/i.test(sm)) s+=15; else tips.push('Escribe en primera persona: suena más cercano y creíble.');
    if(/(escr[ií]beme|cont[aá]ctame|conversemos|hablemos|@|whatsapp|agenda|contact me|reach out)/i.test(sm)) s+=25; else tips.push('Cierra con una invitación: “Escríbeme si buscas…” y tu correo.');
  }
  D.push({k:'acerca',n:'Acerca de',w:12,s:clamp(s),tips:tips});
  // 3 Experiencia
  var ex=p.exp, roles=count(DATE_RX,ex)/2, exNoDates=ex.replace(DATE_RX,'').replace(/\(\d+\s*(años?|meses?|years?|months?|mos?|yrs?)[^)]*\)/gi,'').replace(/\b(19|20)\d{2}\b/g,'');
  var metrics=count(/(\d+(\.\d+)?\s?%|s\/\s?\.?\s?\d|us\$\s?\d|\$\s?\d|\d+\s?(millones|mil|k\b|m\b|personas|clientes|colaboradores|trabajadores|empleados|usuarios|d[ií]as|horas|proyectos|tiendas|sedes|puntos))/gi,exNoDates);
  var verbs=count(VERBS,ex); s=0; tips=[];
  if(!ex){ tips.push('No encontramos tu sección de experiencia. Es la más importante para un reclutador.'); }
  else{
    roles=Math.max(1,Math.round(roles));
    s+= Math.min(25, roles*8);
    s+= metrics>=6?40: metrics>=3?28: metrics>=1?14:0;
    if(metrics<3) tips.push('Encontramos '+metrics+' logro(s) con cifras. Apunta a 2–3 por puesto: “Reduje el tiempo de cierre contable de 10 a 6 días”.');
    s+= verbs>=8?20: verbs>=3?12:4;
    if(verbs<3) tips.push('Empieza cada punto con un verbo de acción en pasado: implementé, reduje, negocié, lideré.');
    if(words(ex)>roles*25) s+=15; else tips.push('Varios puestos no tienen descripción. Agrega 3–5 líneas a cada uno, sobre todo a los dos últimos.');
  }
  D.push({k:'exp',n:'Experiencia con logros medibles',w:18,s:clamp(s),tips:tips,meta:{metrics:metrics,verbs:verbs}});
  // 4 Habilidades y palabras clave
  var sk=p.skills, skN=sk?sk.split('\n').filter(Boolean).length:0; s=0; tips=[];
  s+= skN>=3?35: skN>0?20:0;
  if(skN<3) tips.push('Agrega al menos 3 aptitudes principales (las destacadas) y llega a 30–50 en total.');
  var target=(ans.meta||'').toLowerCase().split(/[\s,]+/).filter(function(x){return x.length>3;});
  var low=p.raw.toLowerCase();
  if(target.length){ var hit=target.filter(function(t){return low.indexOf(t)>=0;}).length; var r=hit/target.length; s+= Math.round(40*r); if(r<1) tips.push('Tu objetivo (“'+ans.meta+'”) no aparece completo en tu perfil. Repite esos términos en titular, Acerca de y experiencia.'); }
  else { s+=20; tips.push('Define tu puesto objetivo y usa sus palabras clave exactas: así te encuentran en las búsquedas.'); }
  var tools=count(/(excel|power bi|sql|python|sap|salesforce|tableau|erp|crm|scrum|agile|pmp|google analytics|figma|autocad|r studio|oracle|hubspot)/gi,p.raw);
  s+= tools>=4?25: tools>=1?15:5; if(tools<1) tips.push('Menciona herramientas concretas que dominas (Excel avanzado, Power BI, SAP, etc.).');
  D.push({k:'skills',n:'Habilidades y palabras clave',w:12,s:clamp(s),tips:tips});
  // 5 Formación y certificaciones
  s=0; tips=[];
  if(p.edu) s+=40; else tips.push('Completa tu formación académica con institución y años.');
  var cN=p.certs?p.certs.split('\n').filter(Boolean).length:0;
  s+= cN>=3?30: cN>=1?20:0; if(cN<1) tips.push('Agrega certificaciones o cursos recientes (últimos 2–3 años): muestran que te mantienes al día.');
  if(p.langs) s+=20; else tips.push('Indica tus idiomas y nivel. El inglés intermedio o avanzado abre muchas más ofertas.');
  if(p.honors||p.pubs||p.vol) s+=10;
  D.push({k:'edu',n:'Formación y certificaciones',w:10,s:clamp(s),tips:tips});
  // 6 Recomendaciones
  var rc=ans.recos; s=[0,45,80,100][rc]; tips=[];
  if(rc<2) tips.push('Pide 2 o 3 recomendaciones a jefes o clientes recientes. Envíales un mensaje corto sugiriendo qué proyecto mencionar.');
  if(rc>=2) tips.push('Bien. Mantén al menos una recomendación de tu puesto actual o el último.');
  D.push({k:'recos',n:'Recomendaciones',w:10,s:clamp(s),tips:tips});
  // 7 Actividad y red
  s=[10,35,55][ans.red]+[0,20,45][ans.act]; tips=[];
  if(ans.red<2) tips.push('Llega a 500 contactos: conecta con compañeros, exalumnos y reclutadores de tu sector. Desde ahí tu perfil aparece mucho más en búsquedas.');
  if(ans.act<2) tips.push('Comenta 2 o 3 publicaciones de tu sector por semana y publica algo propio al mes. La actividad te hace visible para quien te busca.');
  D.push({k:'red',n:'Actividad y red',w:14,s:clamp(s),tips:tips});
  // 8 Completitud
  s=[0,20,35][ans.foto]+(ans.banner?20:0); tips=[];
  if(ans.foto<2) tips.push('Usa una foto con fondo neutro, buena luz y rostro visible. Los perfiles con foto reciben muchas más visitas.');
  if(!ans.banner) tips.push('Cambia la portada por una que refuerce tu especialidad o tu sector.');
  var vanityOk = p.vanity && !/-[0-9a-f]{6,}$/i.test(p.vanity) && !/\d{4,}/.test(p.vanity) && !/-\d{1,3}[a-z]\d/i.test(p.vanity) && !/-(?=(?:[a-z]*\d){3})[a-z0-9]{6,}$/i.test(p.vanity);
  if(vanityOk) s+=25; else if(p.vanity) tips.push('Personaliza tu URL (linkedin.com/in/tunombre): ahora tiene números o códigos al final. Se cambia en Ver perfil › Editar perfil público y URL.'); else { s+=10; tips.push('Si quieres, agrega tu URL de LinkedIn en el paso 1 (campo opcional) para revisar si está personalizada.'); }
  if(p.hasEmail || /@/.test(p.contact)) s+=20; else tips.push('Haz visible un correo de contacto en tu información de contacto.');
  D.push({k:'comp',n:'Completitud: foto, portada, URL',w:12,s:clamp(s),tips:tips});

  var total=Math.round(D.reduce(function(a,d){return a+d.s*d.w;},0)/D.reduce(function(a,d){return a+d.w;},0));
  var hpi=clamp(50+6*Math.min(6,count(HUMAN,p.raw))-8*Math.min(5,count(ROUTINE,p.raw)));
  return {total:total, dims:D, hpi:hpi, name:p.name};
}

function level(t){
  if(t>=80) return {l:'Destacado',c:'green',m:'Tu perfil está por encima de la mayoría. Ahora toca afinar detalles y mantenerlo activo.'};
  if(t>=60) return {l:'Competitivo, con pendientes',c:'amber',m:'Tienes una buena base. Con dos o tres ajustes puedes pasar a la parte alta de los resultados de búsqueda.'};
  if(t>=40) return {l:'En construcción',c:'amber',m:'Hay información valiosa que no se está viendo. Trabajar las prioridades de abajo puede cambiar bastante cómo te perciben.'};
  return {l:'Necesita trabajo',c:'red',m:'Hoy tu perfil no refleja lo que sabes hacer. La buena noticia: lo que falta se corrige rápido.'};
}
function colorFor(s){return s>=75?'g':s>=50?'a':'r';}

// ── Render del resultado (solo textContent: sin HTML inyectado)
function el(tag,attrs,kids){var e=document.createElement(tag);attrs=attrs||{};for(var k in attrs){if(k==='text')e.textContent=attrs[k];else if(k==='cls')e.className=attrs[k];else e.setAttribute(k,attrs[k]);}(kids||[]).forEach(function(c){if(c)e.appendChild(typeof c==='string'?document.createTextNode(c):c);});return e;}
function render(r){
  var box=$('#step3'); box.innerHTML='';
  var lv=level(r.total);
  // Gauge
  var C=2*Math.PI*86, off=C*(1-r.total/100), col={green:'#1F7A6D',amber:'#B7791F',red:'#B4412F'}[lv.c];
  var g=el('div',{cls:'gauge',role:'img','aria-label':'Puntaje total: '+r.total+' de 100'}); g.innerHTML='<svg width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="86" fill="none" style="stroke:var(--track)" stroke-width="16"/><circle id="gArc" cx="100" cy="100" r="86" fill="none" stroke="'+col+'" stroke-width="16" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+C+'" style="transition:stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)"/></svg>';
  g.appendChild(el('div',{cls:'val'},[el('div',{},[el('b',{text:String(r.total)}),el('small',{text:'de 100'})])]));
  var head=el('div',{},[
    el('span',{cls:'pill '+lv.c,text:lv.l}),
    el('h2',{text:(r.name? r.name.split(' ')[0]+', este es tu CareerScore' : 'Este es tu CareerScore'),style:'margin-top:10px'}),
    el('p',{cls:'muted',text:lv.m})
  ]);
  box.appendChild(el('div',{cls:'res-top'},[g,head]));
  // Dimensiones
  var dims=el('div',{cls:'res-dims'});
  r.dims.forEach(function(d){
    var i=el('i',{cls:colorFor(d.s)}); 
    dims.appendChild(el('div',{cls:'dim'},[el('span',{text:d.n}),el('b',{text:String(d.s)}),el('div',{cls:'bar'},[i])]));
    setTimeout(function(){i.style.width=d.s+'%';},120);
  });
  box.appendChild(el('h3',{text:'Tu puntaje por dimensión',style:'margin-top:8px'}));
  box.appendChild(dims);
  // Talent 360 index
  var hpTxt = r.hpi>=70?'Tu perfil destaca habilidades que la automatización difícilmente reemplaza: criterio, liderazgo, relación con personas.':
              r.hpi>=50?'Tu perfil mezcla tareas operativas con habilidades humanas. Resalta más las segundas: decisiones que tomaste, personas que lideraste, problemas que resolviste.':
              'Tu perfil se centra en tareas que hoy se automatizan con facilidad. Muestra el criterio y la relación con personas que hay detrás de tu trabajo.';
  box.appendChild(el('div',{cls:'hpi'},[el('b',{cls:'n',text:String(r.hpi)}),el('div',{},[el('b',{text:'Índice de habilidades humanas (orientativo)'}),el('div',{cls:'small muted',text:hpTxt})])]));
  // Prioridades: las 3 dimensiones con mayor brecha ponderada
  var pr=r.dims.slice().sort(function(a,b){return (100-b.s)*b.w-(100-a.s)*a.w;}).slice(0,3);
  box.appendChild(el('h3',{text:'Tus 3 prioridades',style:'margin-top:18px'}));
  var ol=el('ol',{cls:'prio'});
  pr.forEach(function(d){ol.appendChild(el('li',{},[el('b',{text:d.n+' · '+d.s+'/100'}),el('span',{text:d.tips[0]||'Revisa esta sección.'})]));});
  box.appendChild(ol);
  // Detalle
  box.appendChild(el('h3',{text:'Detalle y recomendaciones',style:'margin-top:18px'}));
  r.dims.forEach(function(d){
    var ul=el('ul'); (d.tips.length?d.tips:['Bien resuelto. Mantenlo actualizado.']).forEach(function(t){ul.appendChild(el('li',{text:t}));});
    box.appendChild(el('details',{cls:'dd'},[el('summary',{},[el('span',{text:d.n}),el('span',{cls:'muted',text:d.s+'/100'})]),el('div',{cls:'in'},[ul])]));
  });
  // CTA
  var wa=el('a',{cls:'btn btn-ghost js-mail',href:'mailto:'+CONFIG.email,style:'border-color:#fff','data-subject':'CareerScore – quiero mejorar mi perfil','data-msg':'Hola, hice el CareerScore y quiero mejorar mi perfil.','data-with-score':'1',text:'Quiero que me ayuden'});
  var cta=el('div',{cls:'res-cta'},[
    el('div',{},[el('h3',{text:'¿Lo trabajamos juntos?'}),el('p',{text:'Un especialista de Talent 360 revisa tu perfil y lo reescribe contigo, con foco en el puesto que buscas.'})]),
    el('div',{style:'display:flex;gap:10px;flex-wrap:wrap'},[wa])
  ]);
  box.appendChild(cta);
  var actions=el('div',{cls:'no-print',style:'display:flex;gap:10px;flex-wrap:wrap;margin-top:16px'},[
    el('button',{cls:'btn btn-ghost btn-sm',type:'button',id:'printBtn',text:'Guardar resultado en PDF'}),
    el('a',{cls:'btn btn-ghost btn-sm',href:'https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent('https://mancolab.com/talent360/careerscore/'),target:'_blank',rel:'noopener',text:'Compartir en LinkedIn'}),
    el('button',{cls:'btn btn-ghost btn-sm',type:'button',id:'againBtn',text:'Analizar otro perfil'})
  ]);
  box.appendChild(actions);
  bindMail(box);
  $('#printBtn').onclick=function(){window.print();};
  $('#againBtn').onclick=function(){pdfFile=null;pdfIn.value='';$('#pdfName').textContent='Solo archivos PDF exportados desde LinkedIn · máx. 5 MB';step(1);location.hash='careerscore';};
  setTimeout(function(){var a=$('#gArc'); if(a) a.style.strokeDashoffset=off;},100);
  var sc=$('#lfScore'); if(sc) sc.value=r.total+'/100'; var msg=$('#lfMsg'); if(msg && !msg.value) msg.value='Hice el CareerScore y obtuve '+r.total+'/100. Mis prioridades: '+pr.map(function(d){return d.n;}).join(', ')+'.';
}

// ── Flujo
var profile=null;
$('#go1').addEventListener('click',async function(){
  hideErr('err1');
  if(!$('#consent1').checked){showErr('err1','Marca la casilla de privacidad para continuar.');return;}
  var raw='', ui=showUrl();
  if(!ui.empty && !ui.valid){showErr('err1','La URL no tiene el formato de un perfil de LinkedIn (linkedin.com/in/tunombre). Corrígela o déjala en blanco.');liUrl.focus();return;}
  try{
    if(mode==='pdf'){
      if(!pdfFile){showErr('err1','Elige el PDF de tu perfil de LinkedIn.');return;}
      step(0); $('#loadMsg').textContent='Leyendo tu PDF…';
      raw=await pdfToText(pdfFile);
    } else {
      raw=txtIn.value.trim();
      if(!raw){showErr('err1','Pega el texto de tu perfil o sube tu PDF para hacer el análisis.');txtIn.focus();return;}
      if(raw.length<200){showErr('err1','Pega más texto de tu perfil (al menos el titular, Acerca de y Experiencia).');txtIn.focus();return;}
    }
  }catch(e){ step(1); if(e&&e.code==='nolib'){ noPdfMsg(); showErr('err1','No pudimos cargar el lector de PDF desde internet. Usa la pestaña “Pegar el texto del perfil” (sigue los 3 pasos) y obtendrás el mismo diagnóstico.'); return; } showErr('err1','No pudimos leer ese PDF. Prueba descargándolo otra vez desde LinkedIn o usa la opción de pegar texto.'); return; }
  if(raw.replace(/\s/g,'').length<150){ step(1); showErr('err1','El archivo casi no tiene texto. ¿Es el PDF que genera LinkedIn con “Guardar en PDF”?'); return; }
  profile=parseProfile(raw);
  if(ui.valid){profile.vanity=ui.slug;profile.urlGiven=true;}
  var f=[]; if(profile.summary)f.push('Acerca de'); if(profile.exp)f.push('Experiencia'); if(profile.edu)f.push('Educación'); if(profile.skills)f.push('Aptitudes'); if(profile.certs)f.push('Certificaciones'); if(profile.langs)f.push('Idiomas');
  $('#detected').textContent=(profile.urlGiven?'URL registrada ('+profile.vanity+'). ':'')+'Leímos tu perfil'+(profile.name?' ('+profile.name+')':'')+'. Secciones encontradas: '+(f.length?f.join(', '):'pocas secciones reconocibles')+'. Completa estas preguntas para terminar.';
  $('#headline').value=profile.headline||'';
  // Prefill desde texto copiado
  if(/(más de 500|500\+|500 contactos|500 connections)/i.test(raw)){var r5=$('input[name="red"][value="2"]'); if(r5) r5.checked=true;}
  step(2);
});
$('#back2').addEventListener('click',function(){step(1);});
$('#go2').addEventListener('click',function(){
  hideErr('err2');
  var ans={headline:$('#headline').value.trim(),meta:$('#meta').value.trim(),foto:radio('foto'),banner:radio('banner'),recos:radio('recos'),red:radio('red'),act:radio('act')};
  if([ans.foto,ans.banner,ans.recos,ans.red,ans.act].some(function(v){return v===null;})){showErr('err2','Responde las 5 preguntas para calcular tu resultado.');return;}
  step(0);
  var msgs=['Revisando tu titular…','Buscando logros con cifras…','Comparando palabras clave…','Armando tus prioridades…'], i=0;
  var t=setInterval(function(){$('#loadMsg').textContent=msgs[i++%msgs.length];},450);
  setTimeout(function(){clearInterval(t); lastResult=score(profile,ans); render(lastResult); step(3); var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches; document.getElementById('careerscore').scrollIntoView({behavior:rm?'auto':'smooth'}); var h=$('#step3 h2'); if(h){h.setAttribute('tabindex','-1'); h.focus({preventScroll:true});}},1600);
});

}
// El formulario de contacto lo maneja assets/forms.js (FormSubmit + antispam).
})();
