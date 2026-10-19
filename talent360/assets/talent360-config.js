/* Talent 360 · configuración editable (sin claves ni secretos).
   Precios: no se publican. */
window.T360 = {
  email: 'info@mancolab.com',
  contactUrl: 'https://mancolab.com/#contacto',
  // Formularios: 'mailto' (abre el correo del usuario) o 'formsubmit' (FormSubmit.co reenvía a info@mancolab.com,
  // sin claves; requiere confirmar una vez el correo de activación que FormSubmit envía a info@mancolab.com).
  formMode: 'formsubmit',
  formsubmitEndpoint: 'https://formsubmit.co/ajax/info@mancolab.com',
  // Proveedor externo de datos de perfil (de pago) — DESACTIVADO. Solo activar con: backend propio que guarde la clave
  // (nunca en el navegador), contrato con el proveedor, base legal y consentimiento expreso del usuario (Ley 29733).
  profileApi: { enabled: false, provider: '', endpoint: '' },
  // Prácticas: tras registrarse, ¿mostrar el enlace a la publicación original? (true = sí; false = "Te contactaremos con los detalles").
  // Si es false, build_cpanel.py también quita las URL de data/practicas_full.json (quedan en private/, que no se sube).
  practicasShowSourceAfterRegister: true,
  showPrices: false,
  launch: null,
  prices: {
    careerscore: { price: 0, note: 'Gratis' }
  }
};
(function(){
  var C = window.T360;
  function fmt(n){ return 'S/ ' + n.toLocaleString('es-PE'); }
  function apply(){
    var launchOn = C.launch && new Date() <= new Date(C.launch.until + 'T23:59:59-05:00');
    document.querySelectorAll('[data-price]').forEach(function(el){
      var p = C.prices[el.getAttribute('data-price')];
      if (!p) return;
      if (!C.showPrices) { el.textContent = p.price === 0 ? 'Gratis' : 'Por definir'; return; }
      if (p.price === 0) { el.textContent = 'Gratis'; return; }
      var final = (launchOn && !p.b2b) ? Math.round(p.price * (1 - C.launch.pct / 100)) : p.price;
      el.textContent = (p.from ? 'Desde ' : '') + fmt(final);
      var sub = el.parentNode.querySelector('.price-sub');
      if (sub) {
        var bits = [p.unit];
        if (launchOn && !p.b2b) bits.push(C.launch.label + ' (antes ' + fmt(p.price) + ')');
        else if (p.was) bits.push('por separado ' + fmt(p.was));
        sub.textContent = bits.filter(Boolean).join(' · ');
      }
    });
    document.querySelectorAll('[data-show-if-prices]').forEach(function(el){ el.hidden = !C.showPrices; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
