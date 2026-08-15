export default {
  id: 'balanceo-fases',
  title: 'Balanceo de fases',
  description: 'Distribución sugerida de circuitos entre fases R/S/T buscando el mínimo desbalance.',
  fields: [
    {
      id: 'circuitos', type: 'list', label: 'Circuitos', addLabel: '+ Agregar circuito',
      default: [
        { nombre: 'Circuito 1', potencia: 2000 },
        { nombre: 'Circuito 2', potencia: 1500 },
        { nombre: 'Circuito 3', potencia: 1000 },
      ],
      itemFields: [
        { id: 'nombre', type: 'text', label: 'Nombre', default: '' },
        { id: 'potencia', type: 'number', label: 'Potencia (W)', default: 0 },
      ],
    },
  ],
  calculate(values) {
    const circuitos = (values.circuitos || []).filter((c) => (Number(c.potencia) || 0) > 0);
    const fases = { R: 0, S: 0, T: 0 };
    const asignacion = [];
    [...circuitos].sort((a, b) => Number(b.potencia) - Number(a.potencia)).forEach((c) => {
      const faseMin = Object.keys(fases).reduce((min, f) => (fases[f] < fases[min] ? f : min), 'R');
      fases[faseMin] += Number(c.potencia);
      asignacion.push({ nombre: c.nombre || '(sin nombre)', potencia: Number(c.potencia), fase: faseMin });
    });
    const valores = Object.values(fases);
    const max = Math.max(...valores);
    const min = Math.min(...valores);
    const promedio = valores.reduce((a, b) => a + b, 0) / 3;
    const desbalance = promedio > 0 ? ((max - min) / promedio) * 100 : 0;

    return {
      results: [
        { label: 'Fase R', value: fases.R, unit: 'W' },
        { label: 'Fase S', value: fases.S, unit: 'W' },
        { label: 'Fase T', value: fases.T, unit: 'W' },
        { label: '% de desbalance', value: desbalance, unit: '%', highlight: true, warn: desbalance > 10 },
      ],
      notes: desbalance > 10 ? [{ type: 'warn', text: 'Desbalance mayor a 10% — considerá redistribuir circuitos grandes entre fases.' }] : [],
      table: {
        caption: 'Distribución sugerida por circuito',
        headers: ['Circuito', 'Potencia (W)', 'Fase'],
        rows: asignacion.map((a) => [a.nombre, a.potencia, a.fase]),
        open: true,
      },
    };
  },
};
