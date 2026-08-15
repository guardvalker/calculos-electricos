export default {
  id: 'conversor-unidades',
  title: 'Conversor de unidades eléctricas',
  description: 'kW ↔ HP ↔ CV, A ↔ kVA, W ↔ kWh, ley de Ohm y factor de potencia.',
  fields: [
    {
      id: 'categoria', type: 'select', label: 'Categoría', default: 'potencia', triggersRedraw: true, cards: true,
      options: [
        { value: 'potencia', label: 'Potencia mecánica (kW / HP / CV)' },
        { value: 'corriente_kva', label: 'Corriente ↔ kVA' },
        { value: 'energia', label: 'Energía (W × tiempo → kWh)' },
        { value: 'ohm', label: 'Ley de Ohm (V, Ω, A)' },
        { value: 'factor_potencia', label: 'Factor de potencia (cos φ)' },
      ],
    },
    { id: 'potenciaKW', type: 'number', label: 'Potencia', unit: 'kW', default: 1, min: 0, visibleIf: (v) => v.categoria === 'potencia' },

    { id: 'direccionKVA', type: 'select', label: 'Dirección', default: 'a_kva', triggersRedraw: true, visibleIf: (v) => v.categoria === 'corriente_kva', options: [{ value: 'a_kva', label: 'Corriente → kVA' }, { value: 'a_corriente', label: 'kVA → Corriente' }] },
    { id: 'sistemaKVA', type: 'select', label: 'Sistema', default: 'mono220', visibleIf: (v) => v.categoria === 'corriente_kva', options: [{ value: 'mono220', label: '220V — Monofásico' }, { value: 'tri380', label: '380V — Trifásico' }] },
    { id: 'corrienteKVA', type: 'number', label: 'Corriente', unit: 'A', default: 10, min: 0, visibleIf: (v) => v.categoria === 'corriente_kva' && v.direccionKVA === 'a_kva' },
    { id: 'kva', type: 'number', label: 'Potencia aparente', unit: 'kVA', default: 3, min: 0, visibleIf: (v) => v.categoria === 'corriente_kva' && v.direccionKVA === 'a_corriente' },

    { id: 'potenciaW', type: 'number', label: 'Potencia', unit: 'W', default: 1000, min: 0, visibleIf: (v) => v.categoria === 'energia' },
    { id: 'horas', type: 'number', label: 'Tiempo de uso', unit: 'h', default: 5, min: 0, visibleIf: (v) => v.categoria === 'energia' },

    { id: 'incognitaOhm', type: 'select', label: 'Calcular', default: 'V', triggersRedraw: true, visibleIf: (v) => v.categoria === 'ohm', options: [{ value: 'V', label: 'Tensión (V)' }, { value: 'I', label: 'Corriente (A)' }, { value: 'R', label: 'Resistencia (Ω)' }] },
    { id: 'ohmV', type: 'number', label: 'Tensión', unit: 'V', default: 220, min: 0, visibleIf: (v) => v.categoria === 'ohm' && v.incognitaOhm !== 'V' },
    { id: 'ohmI', type: 'number', label: 'Corriente', unit: 'A', default: 5, min: 0, visibleIf: (v) => v.categoria === 'ohm' && v.incognitaOhm !== 'I' },
    { id: 'ohmR', type: 'number', label: 'Resistencia', unit: 'Ω', default: 44, min: 0, visibleIf: (v) => v.categoria === 'ohm' && v.incognitaOhm !== 'R' },

    { id: 'fpPotencia', type: 'number', label: 'Potencia activa', unit: 'W', default: 1500, min: 0, visibleIf: (v) => v.categoria === 'factor_potencia' },
    { id: 'fpTension', type: 'number', label: 'Tensión', unit: 'V', default: 220, min: 0, visibleIf: (v) => v.categoria === 'factor_potencia' },
    { id: 'fpCorriente', type: 'number', label: 'Corriente', unit: 'A', default: 8, min: 0, visibleIf: (v) => v.categoria === 'factor_potencia' },
    { id: 'fpSistema', type: 'select', label: 'Sistema', default: 'mono220', visibleIf: (v) => v.categoria === 'factor_potencia', options: [{ value: 'mono220', label: '220V — Monofásico' }, { value: 'tri380', label: '380V — Trifásico' }] },
  ],
  calculate(values, CONFIG) {
    if (values.categoria === 'potencia') {
      const hp = values.potenciaKW * CONFIG.equivalenciasUnidades.kW_a_HP;
      const cv = values.potenciaKW * CONFIG.equivalenciasUnidades.kW_a_CV;
      return { results: [{ label: 'HP', value: hp, unit: 'HP', highlight: true }, { label: 'CV', value: cv, unit: 'CV', highlight: true }] };
    }
    if (values.categoria === 'corriente_kva') {
      const tension = values.sistemaKVA === 'mono220' ? 220 : 380;
      if (values.direccionKVA === 'a_kva') {
        const kva = values.sistemaKVA === 'mono220' ? (tension * values.corrienteKVA) / 1000 : (Math.sqrt(3) * tension * values.corrienteKVA) / 1000;
        return { results: [{ label: 'Potencia aparente', value: kva, unit: 'kVA', highlight: true }] };
      }
      const corriente = values.sistemaKVA === 'mono220' ? (values.kva * 1000) / tension : (values.kva * 1000) / (Math.sqrt(3) * tension);
      return { results: [{ label: 'Corriente', value: corriente, unit: 'A', highlight: true }] };
    }
    if (values.categoria === 'energia') {
      const kwh = (values.potenciaW * values.horas) / 1000;
      return { results: [{ label: 'Energía', value: kwh, unit: 'kWh', highlight: true }] };
    }
    if (values.categoria === 'ohm') {
      if (values.incognitaOhm === 'V') return { results: [{ label: 'Tensión', value: values.ohmI * values.ohmR, unit: 'V', highlight: true }], formula: 'V = I × R' };
      if (values.incognitaOhm === 'I') return { results: [{ label: 'Corriente', value: values.ohmV / values.ohmR, unit: 'A', highlight: true }], formula: 'I = V / R' };
      return { results: [{ label: 'Resistencia', value: values.ohmV / values.ohmI, unit: 'Ω', highlight: true }], formula: 'R = V / I' };
    }
    // factor_potencia
    const cosPhi = values.fpSistema === 'mono220'
      ? values.fpPotencia / (values.fpTension * values.fpCorriente)
      : values.fpPotencia / (Math.sqrt(3) * values.fpTension * values.fpCorriente);
    return { results: [{ label: 'Cos φ', value: cosPhi, unit: '', decimals: 3, highlight: true }], formula: values.fpSistema === 'mono220' ? 'cosφ = P / (V×I)' : 'cosφ = P / (√3×V×I)' };
  },
};
