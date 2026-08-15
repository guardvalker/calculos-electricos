export default {
  id: 'caida-tension',
  title: 'Caída de tensión',
  description: 'Calculá el % de caída de tensión de un circuito, o la sección mínima necesaria para no superar el límite admisible (AEA 90364).',
  fields: [
    {
      id: 'modo', type: 'select', label: 'Modo de cálculo', triggersRedraw: true, default: 'directo',
      options: [{ value: 'directo', label: 'Calcular % de caída' }, { value: 'inverso', label: 'Calcular sección mínima' }],
    },
    {
      id: 'sistema', type: 'select', label: 'Sistema', default: 'mono220',
      options: [{ value: 'mono220', label: '220V — Monofásico' }, { value: 'tri380', label: '380V — Trifásico' }],
    },
    { id: 'material', type: 'select', label: 'Conductor', default: 'cobre', advanced: true, options: [{ value: 'cobre', label: 'Cobre' }, { value: 'aluminio', label: 'Aluminio' }] },
    { id: 'distancia', type: 'number', label: 'Distancia (ida)', unit: 'm', default: 20, min: 0 },
    {
      id: 'tipoUso', type: 'select', label: 'Tipo de circuito (límite admisible)', default: 'iluminacion',
      options: [{ value: 'iluminacion', label: 'Iluminación (máx. 3%)' }, { value: 'fuerza_motriz', label: 'Fuerza motriz (máx. 5%)' }],
    },
    {
      id: 'ingresarPor', type: 'select', label: 'Ingresar corriente por', default: 'potencia', triggersRedraw: true,
      visibleIf: (v) => v.modo === 'directo',
      options: [{ value: 'potencia', label: 'Potencia' }, { value: 'corriente', label: 'Corriente' }],
    },
    { id: 'potencia', type: 'number', label: 'Potencia', unit: 'W', default: 2000, min: 0, visibleIf: (v) => v.modo === 'directo' && v.ingresarPor === 'potencia' },
    { id: 'cosPhi', type: 'number', label: 'Cos φ', default: 0.9, min: 0.1, step: 0.01, advanced: true, visibleIf: (v) => v.modo === 'directo' && v.ingresarPor === 'potencia' },
    { id: 'corriente', type: 'number', label: 'Corriente', unit: 'A', default: 10, min: 0, visibleIf: (v) => v.ingresarPor === 'corriente' || v.modo === 'inverso' },
    {
      id: 'seccion', type: 'select', label: 'Sección de cable', default: 2.5, visibleIf: (v) => v.modo === 'directo',
      options: [1.5, 2.5, 4, 6, 10, 16, 25, 35].map((s) => ({ value: s, label: `${s} mm²` })),
    },
    { id: 'maxPctManual', type: 'number', label: '% máximo admisible (opcional, sobreescribe el límite AEA)', default: '', min: 0, step: 0.1, advanced: true, visibleIf: (v) => v.modo === 'inverso' },
  ],
  calculate(values, CONFIG) {
    const { modo, sistema, material, distancia, tipoUso } = values;
    const k = sistema === 'mono220' ? 2 : Math.sqrt(3);
    const tension = sistema === 'mono220' ? 220 : 380;
    const conductividad = CONFIG.conductividad[material];
    const maxPct = tipoUso === 'iluminacion' ? CONFIG.caidaTensionMax.iluminacion : CONFIG.caidaTensionMax.fuerzaMotriz;

    if (modo === 'directo') {
      let corriente = values.corriente;
      let formulaCorriente = '';
      if (values.ingresarPor === 'potencia') {
        corriente = sistema === 'mono220'
          ? values.potencia / (tension * values.cosPhi)
          : values.potencia / (Math.sqrt(3) * tension * values.cosPhi);
        formulaCorriente = sistema === 'mono220' ? 'I = P / (V×cosφ). ' : 'I = P / (√3×V×cosφ). ';
      }
      const seccion = Number(values.seccion);
      const caidaV = (k * distancia * corriente) / (conductividad * seccion);
      const caidaPct = (caidaV / tension) * 100;
      return {
        results: [
          { label: 'Corriente', value: corriente, unit: 'A' },
          { label: 'Caída de tensión', value: caidaV, unit: 'V' },
          { label: '% de caída', value: caidaPct, unit: '%', highlight: true, status: caidaPct > maxPct ? 'danger' : 'ok' },
        ],
        notes: caidaPct > maxPct ? [{ type: 'warn', text: `Supera el límite admisible de ${maxPct}% (AEA 90364). Aumentá la sección o reducí la distancia.` }] : [{ text: `Dentro del límite admisible de ${maxPct}%.` }],
        formula: `${formulaCorriente}ΔV = (k×L×I) / (γ×S), con k=${k.toFixed(3)}, γ(${material})=${conductividad} m/Ω·mm².`,
      };
    }

    // modo inverso: sección mínima
    const maxPctUsar = values.maxPctManual !== '' && values.maxPctManual !== undefined ? Number(values.maxPctManual) : maxPct;
    const caidaVAdmisible = (maxPctUsar / 100) * tension;
    const seccionCalculada = (k * distancia * values.corriente) / (conductividad * caidaVAdmisible);
    const comerciales = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
    const seccionSugerida = comerciales.find((s) => s >= seccionCalculada) || comerciales[comerciales.length - 1];
    return {
      results: [
        { label: 'Sección teórica mínima', value: seccionCalculada, unit: 'mm²', decimals: 2 },
        { label: 'Sección comercial sugerida', value: seccionSugerida, unit: 'mm²', highlight: true },
      ],
      formula: `S = (k×L×I) / (γ×ΔVadm), con ΔVadm = ${maxPctUsar}% de ${tension}V = ${fmtLocal(caidaVAdmisible)}V.`,
    };
  },
};

function fmtLocal(n) { return Number(n).toFixed(2); }
