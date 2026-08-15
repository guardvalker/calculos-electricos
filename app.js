import { mountModule, loadHistory, deleteHistoryEntry, setPrefill, fmt } from './engine.js';

import caidaTension from './modules/caida-tension.js';
import seccionCable from './modules/seccion-cable.js';
import corrienteCircuito from './modules/corriente-circuito.js';
import proteccionTermomagnetica from './modules/proteccion-termomagnetica.js';
import diferencial from './modules/diferencial.js';
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
  caidaTension, seccionCable, corrienteCircuito, proteccionTermomagnetica, diferencial,
  demandaTablero, dimensionamientoTablero, balanceoFases, bancoCapacitores,
  luminarias, conversorLumens,
  presupuesto, conversorUnidades, consumoMensual,
];

const ICONS = {
  'caida-tension': '📉', 'seccion-cable': '🔌', 'corriente-circuito': '🧮', 'proteccion-termomagnetica': '🛡️',
  diferencial: '⚡', 'demanda-tablero': '📊', 'dimensionamiento-tablero': '🗄️', 'balanceo-fases': '⚖️',
  'banco-capacitores': '🔋', luminarias: '💡', 'conversor-lumens': '🔆',
  presupuesto: '📋', 'conversor-unidades': '🔁', 'consumo-mensual': '💸',
};

const GROUPS = [
  { title: 'Circuito', ids: ['caida-tension', 'seccion-cable', 'corriente-circuito', 'proteccion-termomagnetica', 'diferencial'] },
  { title: 'Tablero', ids: ['demanda-tablero', 'dimensionamiento-tablero', 'balanceo-fases', 'banco-capacitores'] },
  { title: 'Iluminación', ids: ['luminarias', 'conversor-lumens'] },
  { title: 'Presupuesto y consumo', ids: ['presupuesto', 'conversor-unidades', 'consumo-mensual'] },
];

const MODULE_MAP = Object.fromEntries(MODULES.map((m) => [m.id, m]));
const root = document.getElementById('app');

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function renderMenu() {
  root.innerHTML = '';
  const wrap = el('div', { class: 'menu-view' });
  wrap.appendChild(el('h1', {}, '⚡ Cálculos Eléctricos'));
  wrap.appendChild(el('a', { href: '#/historial', class: 'history-link' }, '🕘 Ver historial'));

  GROUPS.forEach((group) => {
    wrap.appendChild(el('h3', { class: 'group-title' }, group.title));
    const grid = el('div', { class: 'menu-grid' });
    group.ids.forEach((id) => {
      const mod = MODULE_MAP[id];
      if (!mod) return;
      grid.appendChild(el('a', { href: `#/modulo/${id}`, class: 'menu-card' }, [
        el('span', { class: 'menu-icon' }, ICONS[id] || '🔧'),
        el('span', { class: 'menu-title' }, mod.title),
      ]));
    });
    wrap.appendChild(grid);
  });

  root.appendChild(wrap);
}

function renderHistorial() {
  root.innerHTML = '';
  const wrap = el('div', { class: 'module-view' });
  wrap.appendChild(el('a', { href: '#/', class: 'back-link' }, '← Menú'));
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
      el('span', { class: 'history-title' }, `${ICONS[entry.moduleId] || ''} ${entry.moduleTitle}`),
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
    }, '🗑️ Borrar'));
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
