import { CONFIG } from './config.js';
import { iconSvg } from './icons.js';

const HISTORY_KEY = 'ce-historial';
const PREFILL_KEY = 'ce-prefill';

export function fmt(n, decimals = 2) {
  if (n === null || n === undefined || n === '') return '—';
  if (typeof n === 'string' && n.trim() !== '' && Number.isNaN(Number(n))) return n;
  if (Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

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

function defaultForField(field) {
  if (field.type === 'list') return (field.default || []).map((row) => ({ ...row }));
  return field.default;
}

function buildDefaultValues(fields) {
  const values = {};
  for (const f of fields) values[f.id] = defaultForField(f);
  return values;
}

function renderSimpleField(field, value, onChange) {
  const wrap = el('label', { class: 'field' }, [el('span', { class: 'field-label' }, field.label + (field.unit ? ` (${field.unit})` : ''))]);
  let input;
  if (field.type === 'select') {
    input = el('select', {
      onchange: (e) => onChange(e.target.value),
    }, field.options.map((opt) => el('option', { value: opt.value, ...(opt.value === value ? { selected: 'selected' } : {}) }, opt.label)));
  } else if (field.type === 'text') {
    input = el('input', {
      type: 'text', value: value ?? '', placeholder: field.placeholder || '',
      oninput: (e) => onChange(e.target.value),
    });
  } else {
    input = el('input', {
      type: 'number', value: value ?? '', step: field.step ?? 'any', min: field.min ?? '',
      oninput: (e) => onChange(e.target.value === '' ? '' : Number(e.target.value)),
    });
  }
  wrap.appendChild(input);
  if (field.help) wrap.appendChild(el('span', { class: 'field-help' }, field.help));
  return wrap;
}

function renderListField(field, rows, onChange) {
  const container = el('div', { class: 'list-field' }, [el('span', { class: 'field-label' }, field.label)]);
  const rowsWrap = el('div', { class: 'list-rows' });

  function redrawRows() {
    rowsWrap.innerHTML = '';
    rows.forEach((row, idx) => {
      const rowEl = el('div', { class: 'list-row' });
      field.itemFields.forEach((sub) => {
        const sf = renderSimpleField(sub, row[sub.id], (v) => {
          row[sub.id] = v;
          onChange(rows);
        });
        rowEl.appendChild(sf);
      });
      rowEl.appendChild(el('button', {
        type: 'button', class: 'btn-icon danger', title: 'Quitar',
        onclick: () => { rows.splice(idx, 1); redrawRows(); onChange(rows); },
      }, '×'));
      rowsWrap.appendChild(rowEl);
    });
  }
  redrawRows();
  container.appendChild(rowsWrap);

  const actions = el('div', { class: 'list-actions' });
  actions.appendChild(el('button', {
    type: 'button', class: 'btn-secondary',
    onclick: () => {
      const blank = {};
      field.itemFields.forEach((sub) => { blank[sub.id] = sub.default ?? (sub.type === 'number' ? 0 : ''); });
      rows.push(blank);
      redrawRows();
      onChange(rows);
    },
  }, field.addLabel || '+ Agregar'));

  if (field.presets) {
    const presetSel = el('select', {
      onchange: (e) => {
        const preset = field.presets.find((p) => p.nombre === e.target.value);
        if (preset) {
          rows.push({ ...preset });
          redrawRows();
          onChange(rows);
        }
        e.target.value = '';
      },
    }, [el('option', { value: '' }, 'Agregar preset…'), ...field.presets.map((p) => el('option', { value: p.nombre }, p.nombre))]);
    actions.appendChild(presetSel);
  }
  container.appendChild(actions);
  return container;
}

function renderResults(resultBox, output) {
  resultBox.innerHTML = '';
  if (!output) return;
  if (output.error) {
    resultBox.appendChild(el('div', { class: 'result-warning' }, output.error));
    return;
  }
  const grid = el('div', { class: 'result-grid' });
  (output.results || []).forEach((r) => {
    const status = r.status || (r.warn ? 'danger' : null);
    const classes = ['result-item'];
    if (r.highlight) classes.push('highlight');
    if (status) classes.push('status-' + status);
    const label = el('span', { class: 'result-label' });
    if (status === 'ok') label.appendChild(el('span', { class: 'status-icon', html: iconSvg('check-circle') }));
    if (status === 'warn' || status === 'danger') label.appendChild(el('span', { class: 'status-icon', html: iconSvg('alert-triangle') }));
    label.appendChild(document.createTextNode(r.label));
    grid.appendChild(el('div', { class: classes.join(' ') }, [
      el('span', { class: 'result-value' }, `${fmt(r.value, r.decimals ?? 2)}${r.unit ? ' ' + r.unit : ''}`),
      label,
    ]));
  });
  resultBox.appendChild(grid);

  if (output.notes && output.notes.length) {
    output.notes.forEach((n) => resultBox.appendChild(el('div', { class: 'result-note' + (n.type === 'warn' ? ' warn' : '') }, n.text || n)));
  }

  if (output.formula) {
    resultBox.appendChild(el('div', { class: 'formula-box', html: `<strong>Fórmula:</strong> ${output.formula}` }));
  }

  if (output.table) {
    const t = output.table;
    const tableEl = el('table', { class: 'ref-table' });
    tableEl.appendChild(el('thead', {}, el('tr', {}, t.headers.map((h) => el('th', {}, h)))));
    const tbody = el('tbody', {}, t.rows.map((row) => el('tr', {}, row.map((c) => el('td', {}, String(c))))));
    tableEl.appendChild(tbody);
    const details = el('details', { class: 'ref-table-wrap', ...(t.open ? { open: 'open' } : {}) }, [el('summary', {}, t.caption || 'Tabla de referencia'), tableEl]);
    resultBox.appendChild(details);
  }

  if (output.copyText) {
    const ta = el('textarea', { class: 'copy-box', readonly: 'readonly', rows: '8' });
    ta.value = output.copyText;
    const btn = el('button', {
      type: 'button', class: 'btn-secondary',
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(output.copyText);
          btn.textContent = '✓ Copiado';
        } catch {
          ta.select();
          document.execCommand('copy');
          btn.textContent = '✓ Copiado';
        }
        setTimeout(() => { btn.textContent = 'Copiar texto'; }, 1500);
      },
    }, 'Copiar texto');
    resultBox.appendChild(el('div', { class: 'copy-wrap' }, [ta, btn]));
  }
}

export function mountModule(root, moduleDef, groupColor) {
  root.innerHTML = '';
  const values = buildDefaultValues(moduleDef.fields);

  const prefillRaw = sessionStorage.getItem(PREFILL_KEY);
  if (prefillRaw) {
    sessionStorage.removeItem(PREFILL_KEY);
    try {
      const prefill = JSON.parse(prefillRaw);
      if (prefill.moduleId === moduleDef.id) Object.assign(values, prefill.inputs);
    } catch { /* ignore */ }
  }

  const view = el('div', { class: 'module-view', ...(groupColor ? { 'data-group': groupColor } : {}) });
  view.appendChild(el('a', { href: '#/', class: 'back-link' }, [el('span', { html: iconSvg('chevron-left') }), 'Menú']));
  view.appendChild(el('h2', {}, moduleDef.title));
  if (moduleDef.description) view.appendChild(el('p', { class: 'module-desc' }, moduleDef.description));

  const form = el('form', { class: 'module-form' });
  const resultBox = el('div', { class: 'result-box' });

  function recompute() {
    let output;
    try {
      output = moduleDef.calculate({ ...values }, CONFIG);
    } catch (e) {
      output = { error: 'Revisá los valores ingresados.' };
    }
    renderResults(resultBox, output);
    form.dataset.lastOutput = JSON.stringify(output || {});
  }

  function fieldsToShow() {
    return moduleDef.fields.filter((f) => !f.visibleIf || f.visibleIf(values));
  }

  function renderField(field) {
    if (field.type === 'list') {
      return renderListField(field, values[field.id], () => recompute());
    }
    return renderSimpleField(field, values[field.id], (v) => {
      values[field.id] = v;
      if (field.sideEffect) field.sideEffect(values, v);
      if (field.triggersRedraw) redrawForm();
      recompute();
    });
  }

  function redrawForm() {
    form.innerHTML = '';
    const visible = fieldsToShow();
    const basic = visible.filter((f) => !f.advanced);
    const advanced = visible.filter((f) => f.advanced);
    basic.forEach((field) => form.appendChild(renderField(field)));
    if (advanced.length) {
      const inner = el('div', { class: 'advanced-fields-inner' });
      advanced.forEach((field) => inner.appendChild(renderField(field)));
      form.appendChild(el('details', { class: 'advanced-fields' }, [
        el('summary', {}, 'Opciones avanzadas'),
        inner,
      ]));
    }
    recompute();
  }

  redrawForm();
  view.appendChild(form);
  view.appendChild(resultBox);

  const saveRow = el('div', { class: 'save-row' });
  const clienteInput = el('input', { type: 'text', placeholder: 'Cliente / obra (opcional)' });
  saveRow.appendChild(clienteInput);
  saveRow.appendChild(el('button', {
    type: 'button', class: 'btn-primary',
    onclick: () => {
      saveToHistory(moduleDef, values, JSON.parse(form.dataset.lastOutput || '{}'), clienteInput.value);
      saveRow.appendChild(el('span', { class: 'saved-flash' }, '✓ Guardado'));
      setTimeout(() => { const f = saveRow.querySelector('.saved-flash'); if (f) f.remove(); }, 1500);
    },
  }, 'Guardar en historial'));
  view.appendChild(saveRow);

  root.appendChild(view);
}

export function saveToHistory(moduleDef, inputs, output, cliente) {
  const history = loadHistory();
  history.unshift({
    id: Date.now(),
    moduleId: moduleDef.id,
    moduleTitle: moduleDef.title,
    timestamp: new Date().toISOString(),
    cliente: cliente || '',
    inputs,
    results: output.results || [],
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 300)));
}

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

export function deleteHistoryEntry(id) {
  const history = loadHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function setPrefill(moduleId, inputs) {
  sessionStorage.setItem(PREFILL_KEY, JSON.stringify({ moduleId, inputs }));
}
