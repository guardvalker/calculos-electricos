import { mountModule, loadHistory, deleteHistoryEntry, setPrefill, fmt } from './engine.js';
import { iconSvg } from './icons.js';

import caidaTension from './modules/caida-tension.js';
import seccionCable from './modules/seccion-cable.js';
import corrienteCircuito from './modules/corriente-circuito.js';
import proteccionTermomagnetica from './modules/proteccion-termomagnetica.js';
import demandaTablero from './modules/demanda-tablero.js';
import dimensionamientoTablero from './modules/dimensionamiento-tablero.js';
import balanceoFases from './modules/balanceo-fases.js';
import bancoCapacitores from './modules/banco-capacitores.js';
import luminarias from './modules/luminarias.js';
import conversorLumens from './modules/conversor-lumens.js';
import presupuesto from './modules/presupuesto.js';
import conversorUnidades from './modules/conversor-unidades.js';
import consumoMensual from './modules/consumo-mensual.js';

const MODULES = [
  caidaTension, seccionCable, corrienteCircuito, proteccionTermomagnetica,
  demandaTablero, dimensionamientoTablero, balanceoFases, bancoCapacitores,
  luminarias, conversorLumens,
  presupuesto, conversorUnidades, consumoMensual,
];

const MODULE_ICON = {
  'caida-tension': 'trending-down', 'seccion-cable': 'plug', 'corriente-circuito': 'activity',
  'proteccion-termomagnetica': 'shield',
  'demanda-tablero': 'sigma', 'dimensionamiento-tablero': 'grid-dots', 'balanceo-fases': 'scale', 'banco-capacitores': 'sliders',
  luminarias: 'bulb', 'conversor-lumens': 'refresh-cw',
  presupuesto: 'calculator', 'conversor-unidades': 'repeat', 'consumo-mensual': 'trending-up',
};

const GROUPS = [
  { title: 'Circuito', color: 'blue', ids: ['caida-tension', 'seccion-cable', 'corriente-circuito', 'proteccion-termomagnetica'] },
  { title: 'Tablero', color: 'green', ids: ['demanda-tablero', 'dimensionamiento-tablero', 'balanceo-fases', 'banco-capacitores'] },
  { title: 'Iluminación', color: 'peach', ids: ['luminarias', 'conversor-lumens'] },
  { title: 'Presupuesto y consumo', color: 'mauve', ids: ['presupuesto', 'conversor-unidades', 'consumo-mensual'] },
];

const MODULE_MAP = Object.fromEntries(MODULES.map((m) => [m.id, m]));
const MODULE_COLOR = {};
GROUPS.forEach((g) => g.ids.forEach((id) => { MODULE_COLOR[id] = g.color; }));

const root = document.getElementById('app');

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function iconBadge(id, size = '') {
  const color = MODULE_COLOR[id] || 'blue';
  return el('span', { class: `icon-badge c-${color} ${size}`, html: iconSvg(MODULE_ICON[id]) });
}

function renderMenu() {
  root.innerHTML = '';
  const wrap = el('div', { class: 'menu-view' });

  wrap.appendChild(el('div', { class: 'app-header' }, [
    el('div', {}, [
      el('h1', {}, 'BONA Toolbox'),
      el('p', { class: 'header-subtitle' }, 'Cálculos eléctricos'),
    ]),
    el('a', { href: '#/historial', class: 'brand-badge', 'aria-label': 'Historial', html: iconSvg('clock') }),
  ]));

  const searchWrap = el('div', { class: 'search-bar' }, [
    el('span', { class: 'search-icon', html: iconSvg('search') }),
  ]);
  const searchInput = el('input', { type: 'search', placeholder: 'Buscar cálculo', class: 'search-input' });
  searchWrap.appendChild(searchInput);
  wrap.appendChild(searchWrap);

  const groupsWrap = el('div', { class: 'groups-wrap' });
  wrap.appendChild(groupsWrap);

  function normalize(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function draw(query) {
    groupsWrap.innerHTML = '';
    const q = normalize(query.trim());
    let anyMatch = false;
    GROUPS.forEach((group) => {
      const matches = group.ids.map((id) => MODULE_MAP[id]).filter((m) => m && normalize(m.title).includes(q));
      if (!matches.length) return;
      anyMatch = true;
      groupsWrap.appendChild(el('h3', { class: 'group-title' }, group.title));
      const grid = el('div', { class: 'menu-grid' });
      matches.forEach((mod) => {
        grid.appendChild(el('a', { href: `#/modulo/${mod.id}`, class: 'menu-card' }, [
          iconBadge(mod.id),
          el('span', { class: 'menu-title' }, mod.title),
        ]));
      });
      groupsWrap.appendChild(grid);
    });
    if (!anyMatch) groupsWrap.appendChild(el('p', { class: 'module-desc' }, 'No se encontraron cálculos.'));
  }

  searchInput.addEventListener('input', () => draw(searchInput.value));
  draw('');

  root.appendChild(wrap);
}

function renderHistorial() {
  root.innerHTML = '';
  const wrap = el('div', { class: 'module-view' });
  wrap.appendChild(el('a', { href: '#/', class: 'back-link' }, [el('span', { html: iconSvg('chevron-left') }), 'Menú']));
  wrap.appendChild(el('h2', {}, 'Historial de cálculos'));

  const history = loadHistory();
  if (!history.length) {
    wrap.appendChild(el('p', { class: 'module-desc' }, 'Todavía no guardaste ningún cálculo.'));
  }

  const list = el('div', { class: 'history-list' });
  history.forEach((entry) => {
    const mod = MODULE_MAP[entry.moduleId];
    const card = el('div', { class: 'history-card' });
    const date = new Date(entry.timestamp);
    card.appendChild(el('div', { class: 'history-head' }, [
      el('span', { class: 'history-title' }, [iconBadge(entry.moduleId, 'sm'), el('span', {}, entry.moduleTitle)]),
      el('span', { class: 'history-date' }, date.toLocaleString('es-AR')),
    ]));
    if (entry.cliente) card.appendChild(el('div', { class: 'history-cliente' }, `Cliente/obra: ${entry.cliente}`));
    const resList = el('div', { class: 'history-results' });
    (entry.results || []).forEach((r) => {
      resList.appendChild(el('span', { class: 'history-result-chip' }, `${r.label}: ${fmt(r.value, r.decimals ?? 2)}${r.unit ? ' ' + r.unit : ''}`));
    });
    card.appendChild(resList);

    const actions = el('div', { class: 'history-actions' });
    if (mod) {
      actions.appendChild(el('button', {
        type: 'button', class: 'btn-secondary',
        onclick: () => { setPrefill(entry.moduleId, entry.inputs); window.location.hash = `#/modulo/${entry.moduleId}`; },
      }, 'Reabrir con estos valores'));
    }
    actions.appendChild(el('button', {
      type: 'button', class: 'btn-icon danger',
      onclick: () => { deleteHistoryEntry(entry.id); renderHistorial(); },
    }, [el('span', { html: iconSvg('trash') }), ' Borrar']));
    card.appendChild(actions);

    list.appendChild(card);
  });
  wrap.appendChild(list);
  root.appendChild(wrap);
}

function route() {
  const hash = window.location.hash || '#/';
  if (hash === '#/historial') {
    renderHistorial();
    return;
  }
  const match = hash.match(/^#\/modulo\/(.+)$/);
  if (match && MODULE_MAP[match[1]]) {
    mountModule(root, MODULE_MAP[match[1]]);
    window.scrollTo(0, 0);
    return;
  }
  renderMenu();
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Theme toggle
const themeBtn = document.getElementById('theme-toggle');
function currentTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr) return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function paintThemeBtn() {
  themeBtn.innerHTML = iconSvg(currentTheme() === 'dark' ? 'sun' : 'moon');
}
themeBtn.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ce-theme', next);
  paintThemeBtn();
});
paintThemeBtn();
