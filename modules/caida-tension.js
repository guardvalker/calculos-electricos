import { CONFIG } from '../config.js';

const TIPO_OPTIONS = CONFIG.tiposCircuito.map((t) => ({ value: t.value, label: t.label }));

function limiteDe(CONFIG, tipo) {
  return CONFIG.tiposCircuito.find((t) => t.value === tipo)?.limite ?? 5;
}

export default {
  id: 'caida-tension',
  title: 'Caída de tensión',
  description: 'Calculá la caída de tensión de uno o varios circuitos a la vez, o la sección mínima necesaria para no superar el límite admisible (AEA 90364-7-771).',
  fields: [
    {
      id: 'modo', type: 'select', label: 'Modo de cálculo', triggersRedraw: true, default: 'directo',
      options: [{ value: 'directo', label: 'Calcular caída de circuitos' }, { value: 'inverso', label: 'Calcular sección mínima' }],
    },
    {
      id: 'sistema', type: 'select', label: 'Sistema', default: 'mono220',
      options: [{ value: 'mono220', label: '220V — Monofásico' }, { value: 'tri380', label: '380V — Trifásico' }],
    },
    { id: 'material', type: 'select', label: 'Conductor', default: 'cobre', advanced: true, options: [{ value: 'cobre', label: 'Cobre' }, { value: 'aluminio', label: 'Aluminio' }] },
    { id: 'cosPhi', type: 'number', label: 'Cos φ', default: 0.9, min: 0.1, step: 0.01, advanced: true },
    {
      id: 'circuitos', type: 'list', label: 'Circuitos', addLabel: '+ Agregar circuito', visibleIf: (v) => v.modo === 'directo',
      default: [
        { nombre: 'Iluminación living', tipo: 'IUG', potencia: 800, distancia: 15, seccion: 1.5 },
        { nombre: 'Tomas living/cocina', tipo: 'TUG', potencia: 2200, distancia: 20, seccion: 2.5 },
      ],
      itemFields: [
        { id: 'nombre', type: 'text', label: 'Nombre', default: '' },
        { id: 'tipo', type: 'select', label: 'Tipo (AEA)', default: 'IUG', options: TIPO_OPTIONS },
        { id: 'potencia', type: 'number', label: 'Potencia (W)', default: 0 },
        { id: 'distancia', type: 'number', label: 'Distancia — ida (m)', default: 15 },
        {
          id: 'seccion', type: 'select', label: 'Sección (mm²)', default: 2.5,
          options: [1.5, 2.5, 4, 6, 10, 16, 25, 35].map((s) => ({ value: s, label: `${s} mm²` })),
        },
      ],
    },
    {
      id: 'tipo', type: 'select', label: 'Tipo de circuito (AEA)', default: 'IUG', visibleIf: (v) => v.modo === 'inverso',
      options: TIPO_OPTIONS,
    },
    { id: 'distancia', type: 'number', label: 'Distancia (ida)', unit: 'm', default: 20, min: 0, visibleIf: (v) => v.modo === 'inverso' },
    { id: 'corriente', type: 'number', label: 'Corriente', unit: 'A', default: 10, min: 0, visibleIf: (v) => v.modo === 'inverso' },
    { id: 'maxPctManual', type: 'number', label: '% máximo admisible (opcional, sobreescribe el límite AEA)', default: '', min: 0, step: 0.1, advanced: true, visibleIf: (v) => v.modo === 'inverso' },
  ],
  calculate(values, CONFIG) {
    const { modo, sistema, material, cosPhi } = values;
    const k = sistema === 'mono220' ? 2 : Math.sqrt(3);
    const tension = sistema === 'mono220' ? 220 : 380;
    const conductividad = CONFIG.conductividad[material];

    if (modo === 'directo') {
      const circuitos = (values.circuitos || []).filter((c) => (Number(c.potencia) || 0) > 0);
      const filas = circuitos.map((c) => {
        const limite = limiteDe(CONFIG, c.tipo);
        const potencia = Number(c.potencia) || 0;
        const corriente = sistema === 'mono220'
          ? potencia / (tension * cosPhi)
          : potencia / (Math.sqrt(3) * tension * cosPhi);
        const seccion = Number(c.seccion);
        const caidaV = (k * (Number(c.distancia) || 0) * corriente) / (conductividad * seccion);
        const caidaPct = (caidaV / tension) * 100;
        return { nombre: c.nombre || '(sin nombre)', tipo: c.tipo, corriente, caidaV, caidaPct, limite, ok: caidaPct <= limite };
      });

      if (!filas.length) {
        return { error: 'Agregá al menos un circuito con potencia mayor a 0.' };
      }

      const fueraDeLimite = filas.filter((f) => !f.ok);
      const peor = filas.reduce((max, f) => (max === null || f.caidaPct > max.caidaPct ? f : max), null);

      return {
        results: [
          { label: 'Circuitos dentro del límite', value: filas.length - fueraDeLimite.length, unit: `/ ${filas.length}`, decimals: 0, highlight: true, status: fueraDeLimite.length ? 'danger' : 'ok' },
          { label: `Peor caso — ${peor.nombre}`, value: peor.caidaPct, unit: '%', decimals: 2 },
        ],
        notes: fueraDeLimite.length
          ? [{ type: 'warn', text: `Superan su límite: ${fueraDeLimite.map((f) => f.nombre).join(', ')}. Aumentá la sección o reducí la distancia de esos circuitos.` }]
          : [{ text: 'Todos los circuitos están dentro de su límite admisible.' }],
        formula: 'ΔV = (k×L×I) / (γ×S), con I = P / (V×cosφ) [ó √3×V×cosφ en trifásico]. Límite: IUG ≤3% · TUG/TUE/Motores ≤5% (AEA 90364-7-771).',
        table: {
          caption: 'Detalle por circuito',
          headers: ['Circuito', 'Tipo', 'I (A)', 'ΔV (V)', 'ΔV (%)', 'Límite', 'Estado'],
          rows: filas.map((f) => [
            f.nombre, f.tipo, f.corriente.toFixed(2), f.caidaV.toFixed(2), f.caidaPct.toFixed(2), `${f.limite}%`, f.ok ? '✓ OK' : '✗ Supera',
          ]),
          open: true,
        },
      };
    }

    // modo inverso: sección mínima para un circuito
    const limite = limiteDe(CONFIG, values.tipo);
    const maxPctUsar = values.maxPctManual !== '' && values.maxPctManual !== undefined ? Number(values.maxPctManual) : limite;
    const caidaVAdmisible = (maxPctUsar / 100) * tension;
    const seccionCalculada = (k * values.distancia * values.corriente) / (conductividad * caidaVAdmisible);
    const comerciales = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
    const seccionSugerida = comerciales.find((s) => s >= seccionCalculada) || comerciales[comerciales.length - 1];
    return {
      results: [
        { label: 'Sección teórica mínima', value: seccionCalculada, unit: 'mm²', decimals: 2 },
        { label: 'Sección comercial sugerida', value: seccionSugerida, unit: 'mm²', highlight: true },
      ],
      formula: `S = (k×L×I) / (γ×ΔVadm), con ΔVadm = ${maxPctUsar}% de ${tension}V = ${caidaVAdmisible.toFixed(2)}V.`,
    };
  },
};
