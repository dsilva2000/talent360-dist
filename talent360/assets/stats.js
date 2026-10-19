/* Talent 360 · contador de visitas propio y anónimo: sin cookies, sin almacenamiento local, sin terceros. */
(function(){
  try{
    var n=navigator, ua=n.userAgent||'';
    if(n.webdriver) return;
    if(/bot|crawl|spider|slurp|scrap|fetch|preview|headless|phantom|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|facebookexternalhit|linkedin|whatsapp|telegram|discord|slack|embedly|curl|wget|python|java\/|go-http|axios|node/i.test(ua)) return;
    var h=location.hostname;
    if(!/(^|\.)mancolab\.com$/.test(h) && !/[?&]stats-test=1/.test(location.search)) return;
    var p=location.pathname, page=/\/careerscore/.test(p)?'careerscore':(/\/practicas/.test(p)?'practicas':'landing');
    var ref='';
    try{ if(document.referrer){ var r=new URL(document.referrer); if(r.hostname!==h) ref=r.hostname; } }catch(e){}
    var body=JSON.stringify({p:page,r:ref});
    var url='/talent360/stats/hit.php';
    var send=function(){
      if(n.sendBeacon){ n.sendBeacon(url,new Blob([body],{type:'text/plain'})); }
      else if(window.fetch){ fetch(url,{method:'POST',body:body,keepalive:true,credentials:'omit',headers:{'Content-Type':'text/plain'}}).catch(function(){}); }
    };
    if(document.visibilityState==='prerender'){ document.addEventListener('visibilitychange',function f(){ if(document.visibilityState!=='prerender'){document.removeEventListener('visibilitychange',f);send();} }); }
    else send();
  }catch(e){}
})();
