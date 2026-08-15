export default {
  id: 'corriente-circuito',
  title: 'Corriente de un circuito',
  description: 'Corriente en amperios a partir de la potencia del circuito.',
  fields: [
    { id: 'potencia', type: 'number', label: 'Potencia', default: 2000, min: 0 },
    { id: 'unidadPotencia', type: 'select', label: 'Unidad', default: 'W', options: [{ value: 'W', label: 'W' }, { value: 'kW', label: 'kW' }] },
    { id: 'sistema', type: 'select', label: 'Sistema', default: 'mono220', options: [{ value: 'mono220', label: '220V — Monofásico' }, { value: 'tri380', label: '380V — Trifásico' }] },
    { id: 'cosPhi', type: 'number', label: 'Cos φ (0.9 resistivo, ajustar para motores)', default: 0.9, min: 0.1, max: 1, step: 0.01 },
  ],
  calculate(values) {
    const potenciaW = values.unidadPotencia === 'kW' ? values.potencia * 1000 : values.potencia;
    const tension = values.sistema === 'mono220' ? 220 : 380;
    const corriente = values.sistema === 'mono220'
      ? potenciaW / (tension * values.cosPhi)
      : potenciaW / (Math.sqrt(3) * tension * values.cosPhi);
    return {
      results: [
        { label: 'Corriente', value: corriente, unit: 'A', highlight: true },
      ],
      formula: values.sistema === 'mono220' ? 'I = P / (V × cos φ)' : 'I = P / (√3 × V × cos φ)',
    };
  },
};
