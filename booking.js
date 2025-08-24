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
  hint: document.getElementById('hint')
};

// Подставим мин. дату — сегодня
const today = new Date();
els.date.min = today.toISOString().slice(0,10);

// Имитация загрузки справочников с сервера.
// На практике: получить по API из бота/серверного эндпоинта.
const services = [
  { id:'1', category:'vet', name:'Осмотр', dur:20, price:'1200–2000' },
  { id:'2', category:'vet', name:'Вакцинация', dur:20, price:'1000–3000' },
  { id:'3', category:'groom', name:'Стрижка', dur:60, price:'2000–6000' },
  { id:'4', category:'groom', name:'Комплекс', dur:90, price:'—' }
];
const branches = [
  { id:'b1', name:'Центр' },
  { id:'b2', name:'Юг' }
];
const staff = [
  { id:'s1', name:'Ирина', role:'vet', branch_id:'b1' },
  { id:'s2', name:'Михаил', role:'vet', branch_id:'b2' },
  { id:'s3', name:'Анна', role:'groom', branch_id:'b1' },
  { id:'s4', name:'Ольга', role:'groom', branch_id:'b2' }
];
let userPets = []; // загрузим из initDataUnsafe, если бот передаст

function setOptions(select, items, placeholder='Выберите') {
  select.innerHTML = '';
  const ph = document.createElement('option'); ph.value=''; ph.textContent=placeholder; select.appendChild(ph);
  items.forEach(it=>{
    const o=document.createElement('option');
    o.value=it.id; o.textContent=it.label || it.name;
    select.appendChild(o);
  });
  select.disabled = items.length===0;
}

// Инициализация
(function init() {
  // Если бот передал initDataUnsafe.user и список питомцев
  try {
    const payload = tg?.initDataUnsafe?.start_param; // можно передать JSON через startapp
    if (payload) {
      const data = JSON.parse(decodeURIComponent(payload));
      if (Array.isArray(data.pets)) userPets = data.pets;
    }
  } catch (_) {}
  const petOptions = userPets.map(p=>({id:p.name, name:p.name, label:p.name}));
  setOptions(els.pet, [{id:'', name:'Ввести вручную', label:'Ввести вручную'}, ...petOptions], 'Выберите');

  setOptions(els.branch, branches.map(b=>({id:b.id,name:b.name})), 'Выберите');
  els.branch.disabled=false;

  els.category.addEventListener('change', onCategory);
  els.branch.addEventListener('change', onBranch);
  els.staff.addEventListener('change', validate);
  els.service.addEventListener('change', validate);
  els.date.addEventListener('change', onDate);
  els.time.addEventListener('change', validate);
  els.pet.addEventListener('change', onPetChange);
  els.pet_name.addEventListener('input', validate);
  els.notes.addEventListener('input', validate);

  if (tg) tg.onEvent('mainButtonClicked', submit);
})();

function onCategory() {
  const cat = els.category.value;
  const list = services.filter(s=>s.category===cat).map(s=>({id:s.id,name:s.name}));
  setOptions(els.service, list, 'Выберите услугу');
  els.service.disabled = list.length===0;
  validate();
  onBranch(); // обновим доступных специалистов
}

function onBranch() {
  const cat = els.category.value;
  const bid = els.branch.value;
  const role = (cat==='groom')?'groom':'vet';
  const list = staff.filter(s=>s.role===role && s.branch_id===bid).map(s=>({id:s.id,name:s.name}));
  setOptions(els.staff, list, 'Выберите специалиста');
  validate();
}

function onDate() {
  // демо-слоты, на практике — запрос к API
  const base = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','14:00','15:00'];
  setOptions(els.time, base.map(t=>({id:t,name:t})), 'Выберите время');
  validate();
}

function onPetChange() {
  if (els.pet.value) {
    els.pet_name.value = els.pet.value;
  } else if (!els.pet_name.value) {
    els.pet_name.value = '';
  }
  validate();
}

function validate() {
  const ok = !!(els.category.value && els.service.value && els.branch.value &&
                els.staff.value && els.date.value && els.time.value &&
                (els.pet.value || els.pet_name.value.trim().length>=2));
  els.hint.textContent = ok ? 'Проверьте данные и нажмите “Записаться”.' : 'Заполните поля — кнопка “Записаться” станет активной.';
  if (tg) tg.MainButton.setParams({ is_visible: ok });
}

function submit() {
  const payload = {
    type: 'booking',
    category: els.category.value,
    service_id: els.service.value,
    branch_id: els.branch.value,
    staff_id: els.staff.value,
    date: els.date.value,
    time: els.time.value,
    pet_name: els.pet.value || els.pet_name.value.trim(),
    notes: els.notes.value.trim()
  };
  if (tg) {
    tg.sendData(JSON.stringify(payload));
  } else {
    alert('WebApp API недоступен. Откройте страницу из Telegram.');
  }
}
