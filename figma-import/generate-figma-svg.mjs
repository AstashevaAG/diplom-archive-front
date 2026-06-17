import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, 'diplom-archive-design-import.svg');

const C = {
  bg: '#F4FAFD',
  white: '#FFFFFF',
  surface: '#E4F0F6',
  hover: '#D7EAF4',
  border: '#A8C8DA',
  text: '#003466',
  text2: '#174D73',
  muted: '#4C6F86',
  subtle: '#6F8B9D',
  accent: '#F57921',
  accent2: '#D9610A',
  blue: '#006599',
  green: '#1F8A4C',
  danger: '#B42318',
  warning: '#B56A00',
};

let defs = '';
let body = '';
let id = 0;
const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m]);
const uid = (p) => `${p}-${++id}`;
const shadow = 'filter:url(#shadow)';

function add(s) { body += `${s}\n`; }
function group(name, x, y, inner) {
  add(`<g id="${esc(name)}" transform="translate(${x} ${y})">${inner}</g>`);
}
function rect(x, y, w, h, fill = C.white, r = 8, stroke = C.border, extra = '') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
}
function txt(x, y, text, size = 14, fill = C.text, weight = 400, width = null) {
  const attrs = width ? ` textLength="${width}" lengthAdjust="spacingAndGlyphs"` : '';
  return `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" letter-spacing="0"${attrs}>${esc(text)}</text>`;
}
function line(x1, y1, x2, y2, color = C.border) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}"/>`;
}
function badge(x, y, label, tone = 'blue') {
  const map = {
    accent: ['rgba(245,121,33,.14)', C.accent2],
    blue: ['rgba(0,101,153,.12)', C.blue],
    green: ['rgba(31,138,76,.12)', C.green],
    red: ['rgba(180,35,24,.12)', C.danger],
    neutral: [C.hover, C.muted],
    yellow: ['#FEF3C7', C.warning],
  };
  const [bg, fg] = map[tone] ?? map.blue;
  const w = Math.max(64, label.length * 7 + 18);
  return `<g>${rect(x, y, w, 26, bg, 4, 'transparent')}${txt(x + 9, y + 17, label, 12, fg, 600)}</g>`;
}
function button(x, y, label, variant = 'primary', w = null) {
  const width = w ?? Math.max(104, label.length * 8 + 34);
  const fill = variant === 'primary' ? C.accent : variant === 'danger' ? C.danger : C.white;
  const stroke = variant === 'primary' || variant === 'danger' ? fill : C.border;
  const color = variant === 'primary' || variant === 'danger' ? C.white : C.text2;
  return `<g>${rect(x, y, width, 40, fill, 6, stroke)}${txt(x + 16, y + 25, label, 14, color, 600)}</g>`;
}
function input(x, y, label, value, w = 360) {
  return `<g>${txt(x, y, label, 13, C.text2, 600)}${rect(x, y + 10, w, 42, C.bg, 6)}${txt(x + 12, y + 37, value, 14, value ? C.text : C.subtle)}</g>`;
}
function card(x, y, w, h, title = '') {
  return `<g>${rect(x, y, w, h, C.white, 12, C.border, shadow)}${title ? txt(x + 18, y + 30, title, 18, C.text, 700) : ''}</g>`;
}
function header(role = 'student') {
  const navs = role === 'public' ? [] : role === 'admin'
    ? ['Кабинет', 'Каталог', 'Темы', 'Информация', 'Коллеги', 'Аналитика', 'Управление']
    : role === 'supervisor'
      ? ['Кабинет', 'Каталог', 'Темы', 'Информация', 'Коллеги', 'Аналитика']
      : ['Кабинет', 'Каталог', 'Темы', 'Информация', 'Руководители'];
  let s = rect(0, 0, 1280, 56, 'rgba(255,255,255,.94)', 0, 'rgba(168,200,218,.7)');
  s += rect(32, 14, 28, 28, C.accent, 6, C.accent) + txt(72, 35, 'Архив ВКР', 18, C.text, 800);
  let x = 220;
  for (const [i, n] of navs.entries()) {
    const w = n.length * 8 + 24;
    if (i === 0) s += rect(x, 12, w, 32, C.hover, 6, 'transparent');
    s += txt(x + 12, 33, n, 14, i === 0 ? C.text : C.text2, i === 0 ? 600 : 500);
    x += w + 8;
  }
  if (role === 'public') {
    s += button(1020, 8, 'Войти', 'ghost', 88) + button(1120, 8, 'Регистрация', 'primary', 128);
  } else {
    const name = role === 'admin' ? 'Михаил Петров' : role === 'supervisor' ? 'Петрова Ирина' : 'Иванова Анна';
    const label = role === 'admin' ? 'Администратор' : role === 'supervisor' ? 'Научный руководитель' : 'Студент';
    s += rect(1010, 10, 36, 36, C.bg, 18) + txt(1060, 27, name, 13, C.text, 700) + txt(1060, 42, label, 11, C.muted) + button(1180, 8, 'Выйти', 'ghost', 68);
  }
  return s;
}
function frame(name, x, y, h, role, inner) {
  group(name, x, y, `${rect(0, 0, 1280, h, C.bg, 0, 'transparent')}${header(role)}<g transform="translate(80 88)">${inner}</g>`);
}
function pageTitle(title, sub = '') {
  return `${txt(0, 0, title, 30, C.text, 800)}${sub ? txt(0, 30, sub, 15, C.muted) : ''}`;
}
function workCard(x, y, title, desc, score, status) {
  return `<g>${card(x, y, 352, 210)}${txt(x + 18, y + 34, title, 18, C.text, 700, 300)}${txt(x + 18, y + 82, desc, 14, C.muted, 310)}${badge(x + 18, y + 150, status, 'blue')}${badge(x + 132, y + 150, `Оценка ${score}`, 'green')}${badge(x + 238, y + 150, '2025', 'neutral')}</g>`;
}
function stat(x, y, label, value) {
  return `<g>${card(x, y, 352, 110)}${txt(x + 18, y + 48, value, 28, C.accent, 800)}${txt(x + 18, y + 76, label, 13, C.muted, 600)}</g>`;
}

defs = `<defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#003466" flood-opacity=".10"/></filter></defs>`;

// Foundations and components
group('00 Foundations', 0, 0, `${rect(0,0,1280,900,C.bg,0,'transparent')}${txt(56,82,'Архив ВКР — Foundations',42,C.text,800)}${txt(56,122,'Токены и компоненты перенесены из React/Vite CSS modules',18,C.text2)}
${['bg #F4FAFD','white #FFFFFF','text #003466','muted #4C6F86','accent #F57921','blue #006599','border #A8C8DA','success #1F8A4C','danger #B42318'].map((n,i)=>`${rect(56+i*132,190,112,88,Object.values(C)[i] ?? C.bg,8)}${txt(56+i*132,300,n,12,C.text,700)}`).join('')}
${card(56,390,560,230,'Typography')}${txt(80,460,'Заголовок страницы',30,C.text,800)}${txt(80,510,'Название секции или карточки',22,C.text,700)}${txt(80,555,'Основной текст интерфейса, описания, метаданные и содержимое карточек.',14,C.text2)}
${card(660,390,560,330,'Components')}${['Header / navigation','Button / primary ghost danger','Field / input textarea select','Card / work user stat chart','Badge / status score role','Tabs / horizontal','Table / admin analytics','Modal / confirm preview review','Chat / message composer','File row / upload preview'].map((n,i)=>txt(684,450+i*26,n,15,C.text2,500)).join('')}`);

group('00 Components', 1360, 0, `${rect(0,0,1280,1050,C.bg,0,'transparent')}${txt(56,82,'Компоненты интерфейса',38,C.text,800)}
${card(56,130,1168,130,'Buttons')}${button(80,185,'Сохранить','primary')}${button(205,185,'Создать работу','primary')}${button(365,185,'Отмена','ghost')}${button(485,185,'Удалить','danger')}
${card(56,290,1168,210,'Form fields')}${input(80,350,'Название работы','Связь семейного климата и самооценки подростков',520)}${input(630,350,'Категория','Семейная психология',360)}${input(80,430,'Аннотация','Краткое описание исследования, целей, методов и практической значимости.',910)}
${card(56,530,1168,270,'Cards and badges')}${workCard(80,590,'Связь семейного климата и самооценки подростков','Исследование семейной поддержки и самооценки у подростков.','91','Опубликована')}${workCard(455,590,'Факторы профессионального выгорания у HR-специалистов','Анализ адаптации, стресса и вовлеченности молодых сотрудников.','87','Опубликована')}
${card(56,830,520,170,'Modal')}${txt(80,895,'Подтвердить действие',22,C.text,700)}${txt(80,930,'Проверьте данные перед продолжением.',14,C.text2)}${button(80,955,'Отмена','ghost')}${button(190,955,'Подтвердить','primary')}`);

frame('01 Home public', 0, 1150, 900, 'public', `${badge(0,0,'Единая платформа дипломного проектирования','accent')}${txt(0,72,'Архив выпускных квалификационных работ',48,C.text,800)}${txt(0,128,'Хранение ВКР, выбор тем, взаимодействие студента с научным руководителем и публикация итоговых работ в каталоге.',18,C.text2,400,820)}${button(0,170,'Начать работу','primary',150)}${button(165,170,'Открыть каталог','ghost',150)}${stat(0,250,'работ','120+')}${stat(376,250,'руководителей','35')}${stat(752,250,'направлений','8')}${workCard(0,410,'Каталог работ','Поиск опубликованных выпускных квалификационных работ.','91','Раздел')}${workCard(376,410,'Выбор темы','Подача заявки научному руководителю.','—','Раздел')}${workCard(752,410,'Рецензирование','Комментарии, оценки, файлы и чат по работе.','—','Раздел')}`);
frame('02 Login', 1360, 1150, 720, 'public', `${card(350,80,420,455)}${rect(380,115,48,48,C.bg,12)}${txt(380,200,'Вход в систему',28,C.text,800)}${txt(380,228,'Введите email и пароль для доступа к архиву',14,C.muted)}${input(380,270,'Email','anna@university.ru',360)}${input(380,350,'Пароль','••••••••••',360)}${button(380,438,'Войти','primary',360)}${txt(445,508,'Нет аккаунта? Зарегистрироваться',13,C.text2,600)}`);
frame('03 Register', 2720, 1150, 820, 'public', `${card(320,40,480,620)}${txt(352,95,'Регистрация',28,C.text,800)}${input(352,135,'ФИО','Анна Иванова',416)}${input(352,215,'Email','anna.demo@example.com',416)}${input(352,295,'Пароль','••••••••',416)}${input(352,375,'Роль','Студент',416)}${input(352,455,'Группа','221-322',416)}${button(352,555,'Создать аккаунт','primary',416)}`);
frame('04 Dashboard student', 0, 2200, 900, 'student', `${pageTitle('Личный кабинет','Работы, заявки, сообщения и профиль студента.')}${button(930,-10,'Создать работу','primary',150)}${badge(0,70,'Мои работы','accent')}${badge(110,70,'Заявки','neutral')}${badge(190,70,'Сообщения','neutral')}${badge(300,70,'Профиль','neutral')}${workCard(0,130,'Особенности тревожности у студентов первого курса','Черновик находится на этапе рецензирования научным руководителем.','82','На рецензии')}${workCard(376,130,'Когнитивные искажения как фактор прокрастинации','Работа требует доработки после комментариев руководителя.','76','В работе')}`);
frame('05 Catalog', 1360, 2200, 900, 'student', `${pageTitle('Каталог ВКР','Поиск и просмотр опубликованных выпускных квалификационных работ.')}${rect(0,70,1120,54,'rgba(255,255,255,.92)',8,C.border)}${txt(18,104,'⌕',18,C.muted)}${txt(52,104,'психология',15,C.text)}${workCard(0,150,'Связь семейного климата и самооценки подростков','Аннотация: исследование коммуникации, поддержки и психологического климата семьи.','91','Опубликована')}${workCard(376,150,'Факторы профессионального выгорания у HR-специалистов','Аннотация: анализ стрессоров, вовлеченности и адаптации в организациях.','87','Опубликована')}${workCard(752,150,'Валидизация шкалы академической устойчивости','Психометрика, валидность, опросник и статистическая обработка.','84','Опубликована')}`);
frame('06 Work detail', 2720, 2200, 1200, 'student', `${txt(0,0,'← Назад к каталогу',14,C.blue,600)}${pageTitle('Связь семейного климата и самооценки подростков','Иванова Анна Сергеевна • Морозова Елена Викторовна • 2025')}${stat(0,90,'Оценка качества','91')}${stat(376,90,'Просмотры','842')}${stat(752,90,'Год защиты','2025')}${card(0,230,1120,170,'Аннотация')}${txt(18,286,'Работа посвящена изучению связи семейного климата и самооценки подростков. Представлены теоретический обзор, методология, эмпирические данные и практические рекомендации.',15,C.text2,400,1040)}${card(0,430,1120,260,'Файлы работы')}${['Дипломная работа.pdf','Презентация.pptx','Приложения.docx'].map((n,i)=>`${rect(18,480+i*58,1084,46,C.bg,8,'transparent')}${rect(34,488+i*58,30,30,i===0?C.danger:i===1?C.accent:C.blue,6)}${txt(78,506+i*58,n,14,C.text,700)}${txt(78,526+i*58,'версия 3 • загружено 12.05.2026',12,C.muted)}`).join('')}`);
frame('07 Topics', 0, 3600, 900, 'student', `${pageTitle('Темы научных руководителей','Выбор темы и подача заявки на научное руководство.')}${badge(0,70,'Все направления','accent')}${badge(130,70,'Семейная психология','neutral')}${badge(300,70,'Клиническая психология','neutral')}${workCard(0,130,'Эмоциональная регуляция в семье','Описание темы, ожидаемый фокус исследования и возможные методы сбора данных.','—','Открыта')}${workCard(376,130,'Тревожность у студентов','Описание темы, ожидаемый фокус исследования и возможные методы сбора данных.','—','Открыта')}${workCard(752,130,'Онлайн-консультирование','Описание темы, ожидаемый фокус исследования и возможные методы сбора данных.','—','Открыта')}`);
frame('08 Supervisors', 1360, 3600, 900, 'student', `${pageTitle('Научные руководители','Каталог преподавателей и направлений исследования.')}${['Морозова Елена Викторовна','Петрова Ирина Сергеевна','Соколов Андрей Павлович'].map((n,i)=>`${card(i*376,90,352,260)}${rect(i*376+18,115,52,52,'rgba(245,121,33,.14)',12,'transparent')}${txt(i*376+18,195,n,18,C.text,700)}${txt(i*376+18,222,i===0?'Семейная психология':i===1?'Клиническая психология':'Организационная психология',13,C.blue,600)}${txt(i*376+18,252,'Краткое описание научных интересов, опыта руководства и доступных тематик.',14,C.muted,400,300)}${button(i*376+18,300,'Выбрать руководителя','primary',190)}`).join('')}`);
frame('09 Info FAQ', 2720, 3600, 900, 'student', `${pageTitle('Информация','Новости, инструкции и ответы на частые вопросы.')}${card(0,90,1120,170)}${badge(18,115,'Закреплено','accent')}${txt(18,170,'График загрузки итоговых файлов ВКР',22,C.text,700)}${txt(18,205,'Сроки, требования к форматам файлов и правила публикации работы в каталоге после защиты.',15,C.text2,400,1000)}${card(0,290,1120,220,'FAQ')}${['Как выбрать научного руководителя?','Когда работа попадает в каталог?','Какие файлы нужно загрузить?'].map((q,i)=>`${line(18,345+i*50,1102,345+i*50)}${txt(18,377+i*50,q,16,C.text,700)}${txt(1080,377+i*50,'⌄',18,C.muted)}`).join('')}`);
frame('10 Analytics', 0, 5000, 1300, 'supervisor', `${pageTitle('Аналитика','Статистика работ, оценок и направлений за учебный период.')}${stat(0,90,'Всего работ','48')}${stat(376,90,'Средняя оценка','84.6')}${stat(752,90,'Опубликовано','24')}${['Динамика по годам','Распределение оценок','Статусы работ'].map((n,i)=>`${card(i*376,240,352,310,n)}${rect(i*376+20,295,312,220,C.bg,8,'transparent')}${[0,1,2,3,4,5].map(k=>rect(i*376+55+k*42,455-k*24,24,45+k*24,i===0?C.blue:i===1?C.accent:C.green,3,'transparent')).join('')}`).join('')}${card(0,590,1120,220,'Лучшие работы')}${txt(18,655,'Связь семейного климата и самооценки подростков — 91',14,C.text2)}${txt(18,690,'Факторы профессионального выгорания — 87',14,C.text2)}${txt(18,725,'Валидизация шкалы академической устойчивости — 84',14,C.text2)}`);
frame('11 Admin', 1360, 5000, 1100, 'admin', `${pageTitle('Управление системой','Пользователи, отчеты, статусы и административные действия.')}${stat(0,90,'Пользователи','62')}${stat(376,90,'Работы','48')}${stat(752,90,'Ожидают','7')}${card(0,240,1120,420,'Пользователи')}${['Морозова Елена|Руководитель|Активен','Иванова Анна|Студент|Активен','Новый пользователь|Студент|Ожидает подтверждения','Михаил Петров|Админ|Активен'].map((row,i)=>{ const a=row.split('|'); return `${line(18,300+i*64,1102,300+i*64)}${txt(18,340+i*64,a[0],14,C.text,700)}${txt(380,340+i*64,a[1],14,C.text2)}${txt(650,340+i*64,a[2],14,a[2].startsWith('Ожидает')?C.warning:C.green)}${button(930,315+i*64,a[2].startsWith('Ожидает')?'Одобрить':'Открыть','ghost',120)}`;}).join('')}`);
frame('12 Workspace', 2720, 5000, 1350, 'supervisor', `${txt(0,0,'← Назад к кабинету',14,C.blue,600)}${pageTitle('Особенности тревожности у студентов первого курса','Рабочее пространство: файлы, этапы, чат и рецензирование.')}${card(0,90,1120,150,'Статус работы: на рецензии')}${['Тема','В работе','Проверка','Защита','Публикация'].map((n,i)=>`${rect(40+i*170,160,22,22,i<3?C.accent:C.white,11,C.border)}${txt(20+i*170,205,n,12,i<3?C.text:C.muted,600)}`).join('')}${card(0,280,540,460,'Этапы и файлы')}${['✓ Теоретическая глава','✓ Методология','○ Эмпирические данные','○ Финальная версия'].map((n,i)=>txt(20,345+i*35,n,14,i<2?C.green:C.text2,600)).join('')}${button(20,510,'Загрузить новую версию','primary',210)}${card(580,280,540,460,'Обсуждение')}${[['Студент','Прикрепила новую версию второй главы.'],['Руководитель','Посмотрите комментарии по методологии.'],['Студент','Исправлю и отправлю сегодня.']].map((m,i)=>`${rect(600,340+i*82,490,60,i===1?C.white:'rgba(245,121,33,.14)',10,i===1?C.border:'transparent')}${txt(620,365+i*82,m[0],12,i===1?C.text2:C.accent2,700)}${txt(620,390+i*82,m[1],14,C.text)}`).join('')}${input(600,610,'Сообщение','Напишите комментарий...',480)}`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="6400" viewBox="0 0 4000 6400">${defs}${body}</svg>`;
writeFileSync(out, svg, 'utf8');
console.log(out);
