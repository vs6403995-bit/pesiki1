function toast(msg){
  const t=document.getElementById('toast'); if(!t) return;
  t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200);
}

function attachZipChecker(){
  const btn=document.getElementById('zipCheck');
  const input=document.getElementById('zip');
  const out=document.getElementById('zipResult');
  if(!btn||!input||!out) return;
  btn.addEventListener('click', ()=>{
    const v=(input.value||'').trim();
    if(!v){ out.textContent='Введите индекс или улицу.'; return; }
    const ok=/^\d{5,6}$/.test(v)||v.length>3;
    out.textContent= ok ? 'Запись доступна в вашем районе.' : 'Пока недоступно. Позвоните нам — подскажем альтернативы.';
  });
}

function attachPlans(){
  const w=document.getElementById('pWeekly');
  const b=document.getElementById('pBi');
  const price=document.getElementById('price');
  const adNails=document.getElementById('adNails');
  const adEars=document.getElementById('adEars');
  const adTeeth=document.getElementById('adTeeth');
  if(!price||!w||!b) return;

  let plan='weekly';
  function recalc(){
    const base= plan==='weekly'?1200:1800;
    const add=(adNails?.checked?300:0)+(adEars?.checked?300:0)+(adTeeth?.checked?400:0);
    price.textContent=`от ${(base+add).toLocaleString('ru-RU')} ₽`;
  }
  w.addEventListener('click',()=>{plan='weekly'; w.classList.add('active'); b.classList.remove('active'); recalc();});
  b.addEventListener('click',()=>{plan='bi'; b.classList.add('active'); w.classList.remove('active'); recalc();});
  adNails?.addEventListener('change',recalc);
  adEars?.addEventListener('change',recalc);
  adTeeth?.addEventListener('change',recalc);
  recalc();
}

function attachContactForm(){
  const form=document.getElementById('form'); const out=document.getElementById('formResult');
  if(!form||!out) return;
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form));
    console.log('contact',data);
    out.textContent='Спасибо! Мы свяжемся с вами в ближайшее время.';
    toast('Заявка отправлена');
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  attachZipChecker();
  attachPlans();
  attachContactForm();
});
