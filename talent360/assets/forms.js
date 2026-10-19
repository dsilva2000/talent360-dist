/* Talent 360 · envío de formularios a info@mancolab.com sin abrir el correo del visitante.
   Proveedor: FormSubmit.co (sin claves). Antispam: honeypot _honey, pregunta simple, tiempo mínimo,
   límite de envíos en el navegador, validación y consentimiento obligatorio. */
(function(){
  'use strict';
  var C=window.T360||{}, MIN_MS=4000, GAP_MS=30000, MAX_HOUR=3, KEY='t360-form-log';
  function log(){try{return JSON.parse(localStorage.getItem(KEY)||'[]').filter(function(t){return Date.now()-t<3600000;});}catch(e){return [];}}
  function saveLog(a){try{localStorage.setItem(KEY,JSON.stringify(a));}catch(e){}}
  var MSG={required:'Este campo es obligatorio.',email:'Escribe un correo válido, por ejemplo nombre@correo.com.',min:function(n){return 'Escribe al menos '+n+' caracteres.';},max:function(n){return 'Máximo '+n+' caracteres.';},
    consent:'Necesitamos tu autorización para poder responderte.',captcha:'La respuesta no es correcta. Inténtalo de nuevo.',tel:'Escribe solo números, espacios o el signo +.'};
  function errEl(f){var id=f.getAttribute('data-err');return id?document.getElementById(id):null;}
  function setErr(f,m){var e=errEl(f);if(e)e.textContent=m||'';if(m)f.setAttribute('aria-invalid','true');else f.removeAttribute('aria-invalid');}
  function check(form,f){
    var v=(f.type==='checkbox')?f.checked:(f.value||'').trim(), m='';
    if(f.type==='checkbox'){ if(f.required&&!v) m=f.hasAttribute('data-consent')?MSG.consent:MSG.required; }
    else if(f.required&&!v) m=MSG.required;
    else if(v&&f.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v)) m=MSG.email;
    else if(v&&f.type==='tel'&&!/^[+\d][\d\s-]{5,19}$/.test(v)) m=MSG.tel;
    else if(v&&f.minLength>0&&v.length<f.minLength) m=MSG.min(f.minLength);
    else if(v&&f.maxLength>0&&v.length>f.maxLength) m=MSG.max(f.maxLength);
    else if(f.hasAttribute('data-captcha')&&parseInt(v,10)!==form._ans) m=MSG.captcha;
    setErr(f,m); return !m;
  }
  function validate(form){
    var bad=[];
    Array.prototype.forEach.call(form.querySelectorAll('[data-err]'),function(f){ if(!check(form,f)) bad.push(f); });
    return bad;
  }
  function status(form,cls,txt){var s=form.querySelector('[data-status]');s.className='form-status '+cls;s.textContent=txt;s.hidden=false;s.focus();}
  function setup(form){
    var t0=Date.now(), a=2+Math.floor(Math.random()*6), b=1+Math.floor(Math.random()*5);
    form._ans=a+b; var q=form.querySelector('[data-captcha-q]'); if(q) q.textContent='Verificación: ¿cuánto es '+a+' + '+b+'?';
    form.setAttribute('novalidate','');
    Array.prototype.forEach.call(form.querySelectorAll('[data-err]'),function(f){f.addEventListener(f.type==='checkbox'?'change':'input',function(){if(f.getAttribute('aria-invalid'))check(form,f);});});
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var st=form.querySelector('[data-status]'); st.hidden=true;
      var bad=validate(form);
      if(bad.length){status(form,'bad','Revisa '+(bad.length===1?'el campo marcado':'los '+bad.length+' campos marcados')+'.');bad[0].focus();return;}
      var honey=form.querySelector('[name="_honey"]');
      if(honey&&honey.value){status(form,'ok','Gracias. Recibimos tu mensaje.');form.reset();return;} // bot: se descarta en silencio
      if(Date.now()-t0<MIN_MS){status(form,'bad','Espera unos segundos y vuelve a enviar.');return;}
      var L=log(); if(L.length&&Date.now()-L[L.length-1]<GAP_MS){status(form,'bad','Ya enviaste un mensaje hace un momento. Espera 30 segundos para enviar otro.');return;}
      if(L.length>=MAX_HOUR){status(form,'bad','Alcanzaste el límite de envíos por hora. Escríbenos a '+(C.email||'info@mancolab.com')+'.');return;}
      if(C.formMode!=='formsubmit'||!C.formsubmitEndpoint){status(form,'bad','El envío está desactivado en esta vista previa. Escríbenos a '+(C.email||'info@mancolab.com')+'.');return;}
      var data={_subject:form.getAttribute('data-subject')||'Formulario Talent 360',_template:'table',_captcha:'false',_honey:''};
      Array.prototype.forEach.call(form.elements,function(f){
        if(!f.name||f.name.charAt(0)==='_'||f.hasAttribute('data-captcha')) return;
        if(f.type==='checkbox') data[f.name]=f.checked?'Sí, autorizado':'No'; else data[f.name]=(f.value||'').trim().slice(0,2000);
      });
      if(data.correo) data._replyto=data.correo;
      data.pagina=location.pathname;
      var btn=form.querySelector('[type="submit"]'); btn.disabled=true; var old=btn.textContent; btn.textContent='Enviando…';
      fetch(C.formsubmitEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
        .then(function(r){return r.json().catch(function(){return {};}).then(function(j){return {ok:r.ok,j:j};});})
        .then(function(res){
          if(res.ok&&(res.j.success===true||res.j.success==='true')){L.push(Date.now());saveLog(L);status(form,'ok',form.getAttribute('data-ok')||'¡Gracias! Te respondemos en un día hábil.');form.reset();t0=Date.now();try{form.dispatchEvent(new CustomEvent('t360:sent',{detail:data}));}catch(e){}}
          else throw 0;
        })
        .catch(function(){status(form,'bad','No pudimos enviar tu mensaje. Inténtalo más tarde o escríbenos a '+(C.email||'info@mancolab.com')+'.');})
        .then(function(){btn.disabled=false;btn.textContent=old;});
    });
  }
  window.T360Forms={reset:function(form){var a=2+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*5);form._ans=a+b;var q=form.querySelector('[data-captcha-q]');if(q)q.textContent='Verificación: ¿cuánto es '+a+' + '+b+'?';var st=form.querySelector('[data-status]');if(st)st.hidden=true;Array.prototype.forEach.call(form.querySelectorAll('[data-err]'),function(f){setErr(f,'');});}};
  function init(){Array.prototype.forEach.call(document.querySelectorAll('form[data-t360-form]'),setup);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
