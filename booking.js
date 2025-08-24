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
  pet: document.getElementById('pet'),
  pet_name: document.getElementById('pet_name'),
  notes: document.getElementById('notes'),
  hint: document.getElementById('hint'),
  dateHint: document.getElementById('dateHint'),
  reset: document.getElementById('reset'),
};

// today min
const now = new Date();
els.date.min = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,10);

// demo data (заменим на API позже)
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
let userPets = []; // подключим позже через startapp

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
  // Заполнить филиалы сразу
  setOptions(els.branch, branches, '— выбрать —');
  els.branch.disabled=false;

  // Питомцы (если будут переданы)
  const petItems = userPets.map(p=>({id:p.name,name:p.name}));
  setOptions(els.pet, [{id:'', name:'Ввести вручную'}, ...petItems], '— выбрать —', true);

  els.category.addEventListener('change', onCategory);
  els.branch.addEventListener('change', onBranch);
  els.service.addEventListener('change', validate);
  els.staff.addEventListener('change', validate);
  els.date.addEventListener('change', onDate);
  els.time.addEventListener('change', validate);
  els.pet.addEventListener('change', onPetChange);
  els.pet_name.addEventListener('input', validate);
  els.notes.addEventListener('input', validate);
  els.reset.addEventListener('click', resetForm);

  // убирать placeholder после выбора
  ['category','service','branch','staff','time','pet'].forEach(id=>{
    els[id].addEventListener('change', onSelectRemovePlaceholder);
  });

  if (tg) tg.onEvent('mainButtonClicked', submit);
})();

function onCategory(){
  const cat=els.category.value;
  const list=services.filter(s=>s.category===cat).map(s=>({id:s.id,name:s.name}));
  setOptions(els.service, list, list.length? '— выбрать —':'Сначала выберите направление');
  els.service.disabled = list.length===0;
  // при смене направления стоит обновить специалистов под новый role
  onBranch();
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

function onDate(){
  const v=els.date.value;
  if(!v){
    setOptions(els.time, [], 'Сначала выберите дату', true);
    els.time.disabled=true;
    return;
  }
  // демо-слоты: каждые 30 минут 09:00–15:00
  const base=[];
  for(let h=9; h<=15; h++){
    base.push(`${String(h).padStart(2,'0')}:00`);
    if(h<15) base.push(`${String(h).padStart(2,'0')}:30`);
  }
  setOptions(els.time, base.map(t=>({id:t,name:t})), '— выбрать —');
  els.time.disabled = base.length===0;
  els.dateHint.textContent='';
  validate();
}

function onPetChange(){
  if (els.pet.value){
    els.pet_name.value = els.pet.value;
  } else if (!els.pet_name.value){
    els.pet_name.value = '';
  }
  validate();
}

function validate(){
  const ok = !!(els.category.value && els.service.value && els.branch.value &&
                els.staff.value && els.date.value && els.time.value &&
                (els.pet.value || els.pet_name.value.trim().length>=2));
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
    pet_name: els.pet.value || els.pet_name.value.trim(),
    notes: els.notes.value.trim()
  };
  if (tg) tg.sendData(JSON.stringify(payload));
}

function resetForm(){
  els.category.value=''; els.service.innerHTML='<option value="" data-ph>Сначала выберите направление</option>'; els.service.disabled=true;
  els.branch.value='';  els.staff.innerHTML='<option value="" data-ph>Сначала выберите филиал</option>'; els.staff.disabled=true;
  els.date.value='';    els.time.innerHTML='<option value="" data-ph>Сначала выберите дату</option>'; els.time.disabled=true;
  els.pet.value='';     els.pet_name.value=''; els.notes.value='';
  els.hint.textContent='Заполните поля — кнопка “Записаться” станет активной.';
  if (tg) tg.MainButton.setParams({ is_visible:false });
}
