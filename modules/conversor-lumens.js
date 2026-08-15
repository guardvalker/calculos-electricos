const TECNOLOGIAS = [
  { value: 'LED', label: 'LED' },
  { value: 'halogena', label: 'Halógena' },
  { value: 'incandescente', label: 'Incandescente' },
  { value: 'fluorescente', label: 'Fluorescente' },
];

export default {
  id: 'conversor-lumens',
  title: 'Conversor lumens / watts / lux',
  description: 'Conversión entre lumens, watts (según tecnología) y lux, más comparador de equivalencia entre lámparas.',
  fields: [
    {
      id: 'modo', type: 'select', label: 'Qué querés calcular', default: 'lm_a_w', triggersRedraw: true,
      options: [
        { value: 'lm_a_w', label: 'Lumens → Watts' },
        { value: 'w_a_lm', label: 'Watts → Lumens' },
        { value: 'lm_a_lux', label: 'Lumens → Lux (según superficie)' },
        { value: 'comparador', label: 'Comparar LED vs otra tecnología' },
      ],
    },
    { id: 'lumens', type: 'number', label: 'Lumens', unit: 'lm', default: 800, min: 0, visibleIf: (v) => v.modo === 'lm_a_w' || v.modo === 'lm_a_lux' },
    { id: 'watts', type: 'number', label: 'Watts', unit: 'W', default: 60, min: 0, visibleIf: (v) => v.modo === 'w_a_lm' },
    { id: 'tecnologia', type: 'select', label: 'Tecnología', default: 'LED', options: TECNOLOGIAS, visibleIf: (v) => v.modo === 'lm_a_w' || v.modo === 'w_a_lm' },
    { id: 'area', type: 'number', label: 'Superficie', unit: 'm²', default: 12, min: 0.1, visibleIf: (v) => v.modo === 'lm_a_lux' },
    { id: 'potenciaLED', type: 'number', label: 'Potencia de la lámpara LED', unit: 'W', default: 9, min: 0, visibleIf: (v) => v.modo === 'comparador' },
    { id: 'tecnologiaComparar', type: 'select', label: 'Comparar contra', default: 'incandescente', options: TECNOLOGIAS.filter((t) => t.value !== 'LED'), visibleIf: (v) => v.modo === 'comparador' },
  ],
  calculate(values, CONFIG) {
    const eficacia = CONFIG.eficaciaLuminaria;
    if (values.modo === 'lm_a_w') {
      const watts = values.lumens / eficacia[values.tecnologia];
      return { results: [{ label: 'Watts equivalentes', value: watts, unit: 'W', highlight: true }], formula: 'W = lm / eficacia(lm/W)' };
    }
    if (values.modo === 'w_a_lm') {
      const lumens = values.watts * eficacia[values.tecnologia];
      return { results: [{ label: 'Lumens', value: lumens, unit: 'lm', highlight: true }], formula: 'lm = W × eficacia(lm/W)' };
    }
    if (values.modo === 'lm_a_lux') {
      const lux = values.lumens / values.area;
      return { results: [{ label: 'Lux', value: lux, unit: 'lx', highlight: true }], formula: 'lux = lm / m²' };
    }
    // comparador
    const lumensLED = values.potenciaLED * eficacia.LED;
    const potenciaEquivalente = lumensLED / eficacia[values.tecnologiaComparar];
    return {
      results: [
        { label: 'Lumens de la LED', value: lumensLED, unit: 'lm' },
        { label: `Watts equivalentes en ${values.tecnologiaComparar}`, value: potenciaEquivalente, unit: 'W', highlight: true },
      ],
      notes: [{ text: `Una LED de ${values.potenciaLED}W equivale aproximadamente a una lámpara ${values.tecnologiaComparar} de ${potenciaEquivalente.toFixed(0)}W.` }],
      table: {
        caption: 'Eficacia lumínica de referencia (lm/W)',
        headers: ['Tecnología', 'lm/W'],
        rows: Object.entries(eficacia).map(([k, v]) => [k, v]),
      },
    };
  },
};
