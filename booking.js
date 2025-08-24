/* global Telegram */
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.MainButton.setParams({ text: 'Записаться', color: '#365f49', text_color: '#ffffff', is_visible: false });
}

const els = {
  category: document.getElementById('category'),
  service: document.getElementById('service'),
  branch: document.getElementById('branch'),
  staff: document.getElementById('staff'),
  date: document.getElementById('date'),
  time: document.getElementById('time'),
  pet_name: document.getElementById('pet_name'),
  notes: document.getElementById('notes'),
  hint: document.getElementById('hint'),
  dateHint: document.getElementById('dateHint'),
  reset: document.getElementById('reset'),
};

// min date = сегодня (с учётом таймзоны клиента)
const now = new Date();
els.date.min = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,10);

// демо-справочники (подменим на API позже)
const services = [
  { id:'1', category:'vet', name:'Осмотр', dur:20 },
  { id:'2', category:'vet', name:'Вакцинация', dur:20 },
  { id:'3', category:'groom', name:'Стрижка', dur:60 },
  { id:'4', category:'groom', name:'Комплекс', dur:90 },
];
const branches = [{ id:'b1', name:'Центр' },{ id:'b2', name:'Юг' }];
const staff = [
  { id:'s1', name:'Ирина', role:'vet', branch_id:'b1' },
  { id:'s2', name:'Михаил', role:'vet', branch_id:'b2' },
  { id:'s3', name:'Анна', role:'groom', branch_id:'b1' },
  { id:'s4', name:'Ольга', role:'groom', branch_id:'b2' },
];

function setOptions(select, items, placeholder, keepPlaceholder=false){
  select.innerHTML = '';
  if (placeholder) {
    const ph=document.createElement('option'); ph.value=''; ph.textContent=placeholder; ph.setAttribute('data-ph','1');
    select.appendChild(ph);
  }
  items.forEach(it=>{
    const o=document.createElement('option');
    o.value=it.id; o.textContent=it.label || it.name;
    select.appendChild(o);
  });
  select.disabled = items.length===0 && !keepPlaceholder;
}
function removePlaceholder(select){
  const first = select.querySelector('option[data-ph]');
  if (first) first.remove();
}
function onSelectRemovePlaceholder(e){
  if (e.target.value) removePlaceholder(e.target);
}

(function init(){
  setOptions(els.branch, branches, '— выбрать —');
  els.branch.disabled=false;

  els.category?.addEventListener('change', onCategory);
  els.branch?.addEventListener('change', onBranch);
  els.service?.addEventListener('change', validate);
  els.staff?.addEventListener('change', validate);
  els.date?.addEventListener('change', onDate);
  els.time?.addEventListener('change', validate);

  ['category','service','branch','staff','time'].forEach(id=>{
    els[id]?.addEventListener('change', onSelectRemovePlaceholder);
  });

  els.pet_name?.addEventListener('input', validate);
  els.notes?.addEventListener('input', validate);
  els.reset?.addEventListener('click', resetForm);

  if (tg) tg.onEvent('mainButtonClicked', submit);
})();

function onCategory(){
  const cat=els.category.value;
  const list=services.filter(s=>s.category===cat).map(s=>({id:s.id,name:s.name}));
  setOptions(els.service, list, list.length? '— выбрать —':'Сначала выберите направление');
  els.service.disabled = list.length===0;
  onBranch(); // обновить специалистов под роль
  validate();
}

function onBranch(){
  const cat=els.category.value;
  const bid=els.branch.value;
  const role=(cat==='groom')?'groom':'vet';
  const list=staff.filter(s=>s.role===role && (!bid || s.branch_id===bid)).map(s=>({id:s.id,name:s.name}));
  setOptions(els.staff, list, list.length? '— выбрать —':'Сначала выберите филиал');
  els.staff.disabled = list.length===0;
  validate();
}

// генерируем слоты и закрываем прошедшие для сегодняшней даты
function onDate(){
  const v=els.date.value;
  if(!v){
    setOptions(els.time, [], 'Сначала выберите дату', true);
    els.time.disabled=true;
    return;
  }
  const selected = new Date(v+'T00:00');
  const isToday = isSameDate(selected, new Date());
  const nowHM = toHM(new Date());

  const base=[];
  for(let h=9; h<=19; h++){
    base.push(`${pad(h)}:00`);
    if(h<19) base.push(`${pad(h)}:30`);
  }
  // фильтрация прошедших слотов для сегодняшней даты
  const slots = isToday ? base.filter(t => t > nowHM) : base;

  setOptions(els.time, slots.map(t=>({id:t,name:t})), slots.length? '— выбрать —':'Нет свободных слотов');
  els.time.disabled = slots.length===0;
  els.dateHint.textContent = slots.length? '' : 'На выбранную дату нет доступных слотов. Выберите другой день.';
  validate();
}

function isSameDate(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function pad(n){ return String(n).padStart(2,'0'); }
function toHM(d){ return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

function validate(){
  // очистить прошлые ошибки
  [els.category,els.service,els.branch,els.staff,els.date,els.time,els.pet_name].forEach(el=>el?.classList.remove('error'));

  const ok = !!(els.category.value && els.service.value && els.branch.value &&
                els.staff.value && els.date.value && els.time.value &&
                els.pet_name.value.trim().length>=2);

  if (!ok){
    // подсветка конкретных пустых полей
    if(!els.category.value) els.category.classList.add('error');
    if(!els.service.value)  els.service.classList.add('error');
    if(!els.branch.value)   els.branch.classList.add('error');
    if(!els.staff.value)    els.staff.classList.add('error');
    if(!els.date.value)     els.date.classList.add('error');
    if(!els.time.value)     els.time.classList.add('error');
    if(els.pet_name.value.trim().length<2) els.pet_name.classList.add('error');
  }

  els.hint.textContent = ok ? 'Проверьте данные и нажмите “Записаться”.' : 'Заполните поля — кнопка “Записаться” станет активной.';
  if (tg) tg.MainButton.setParams({ is_visible: ok });
}

function submit(){
  const payload = {
    type:'booking',
    category:els.category.value,
    service_id:els.service.value,
    branch_id:els.branch.value,
    staff_id:els.staff.value,
    date:els.date.value,
    time:els.time.value,
    pet_name: els.pet_name.value.trim(),
    notes: els.notes.value.trim()
  };
  if (tg) tg.sendData(JSON.stringify(payload));
}

function resetForm(){
  els.category.value='';
  els.service.innerHTML='<option value="" data-ph>Сначала выберите направление</option>'; els.service.disabled=true;
  els.branch.value='';
  els.staff.innerHTML='<option value="" data-ph>Сначала выберите филиал</option>'; els.staff.disabled=true;
  els.date.value='';
  els.time.innerHTML='<option value="" data-ph>Сначала выберите дату</option>'; els.time.disabled=true;
  els.pet_name.value=''; els.notes.value='';
  [els.category,els.service,els.branch,els.staff,els.date,els.time,els.pet_name].forEach(el=>el?.classList.remove('error'));
  els.hint.textContent='Заполните поля — кнопка “Записаться” станет активной.';
  if (tg) tg.MainButton.setParams({ is_visible:false });
}
