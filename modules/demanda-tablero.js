export default {
  id: 'demanda-tablero',
  title: 'Demanda / carga total de un tablero',
  description: 'Potencia instalada y potencia de demanda aplicando factores de simultaneidad por tipo de uso.',
  fields: [
    {
      id: 'circuitos', type: 'list', label: 'Circuitos', addLabel: '+ Agregar circuito',
      default: [
        { nombre: 'Iluminación', potencia: 800, uso: 'iluminacion' },
        { nombre: 'Tomas', potencia: 2200, uso: 'tomas_uso_general' },
      ],
      itemFields: [
        { id: 'nombre', type: 'text', label: 'Nombre', default: '' },
        { id: 'potencia', type: 'number', label: 'Potencia (W)', default: 0 },
        {
          id: 'uso', type: 'select', label: 'Uso', default: 'tomas_uso_general',
          options: [
            { value: 'iluminacion', label: 'Iluminación' },
            { value: 'tomas_uso_general', label: 'Tomas uso general' },
            { value: 'aire_acondicionado', label: 'Aire acondicionado' },
            { value: 'cocina', label: 'Cocina' },
            { value: 'termotanque', label: 'Termotanque' },
            { value: 'otros', label: 'Otros' },
          ],
        },
      ],
    },
    { id: 'sistema', type: 'select', label: 'Sistema', default: 'mono220', options: [{ value: 'mono220', label: '220V — Monofásico' }, { value: 'tri380', label: '380V — Trifásico' }] },
    { id: 'cosPhi', type: 'number', label: 'Cos φ', default: 0.9, min: 0.1, max: 1, step: 0.01 },
  ],
  calculate(values, CONFIG) {
    const circuitos = values.circuitos || [];
    const potenciaInstalada = circuitos.reduce((acc, c) => acc + (Number(c.potencia) || 0), 0);
    const potenciaDemanda = circuitos.reduce((acc, c) => acc + (Number(c.potencia) || 0) * (CONFIG.factorSimultaneidad[c.uso] ?? 1), 0);
    const tension = values.sistema === 'mono220' ? 220 : 380;
    const corriente = values.sistema === 'mono220'
      ? potenciaDemanda / (tension * values.cosPhi)
      : potenciaDemanda / (Math.sqrt(3) * tension * values.cosPhi);
    return {
      results: [
        { label: 'Potencia instalada', value: potenciaInstalada, unit: 'W' },
        { label: 'Potencia de demanda', value: potenciaDemanda, unit: 'W', highlight: true },
        { label: 'Corriente total (interruptor general)', value: corriente, unit: 'A', highlight: true },
      ],
      formula: 'P_demanda = Σ(potencia_circuito × factor_simultaneidad_por_uso). I = P_demanda / (V×cosφ) [ó √3×V×cosφ en trifásico].',
      table: {
        caption: 'Factores de simultaneidad usados',
        headers: ['Uso', 'Factor'],
        rows: Object.entries(CONFIG.factorSimultaneidad).map(([k, v]) => [k, v]),
      },
    };
  },
};
