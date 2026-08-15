export default {
  id: 'dimensionamiento-tablero',
  title: 'Dimensionamiento de tablero',
  description: 'Cantidad de módulos DIN necesarios y tablero comercial sugerido, con margen de reserva.',
  fields: [
    {
      id: 'elementos', type: 'list', label: 'Elementos a instalar', addLabel: '+ Agregar elemento',
      default: [
        { nombre: 'Interruptor general', modulos: 2 },
        { nombre: 'Diferencial', modulos: 2 },
        { nombre: 'Térmica', modulos: 1 },
      ],
      itemFields: [
        { id: 'nombre', type: 'text', label: 'Nombre', default: '' },
        { id: 'modulos', type: 'number', label: 'Ancho (módulos DIN)', default: 1, min: 0 },
      ],
    },
    { id: 'margenPct', type: 'number', label: 'Margen de reserva', unit: '%', default: 25, min: 0, step: 1, advanced: true },
  ],
  calculate(values, CONFIG) {
    const elementos = values.elementos || [];
    const totalModulos = elementos.reduce((acc, e) => acc + (Number(e.modulos) || 0), 0);
    const conReserva = totalModulos * (1 + (values.margenPct ?? CONFIG.margenReservaTablero * 100) / 100);
    const comerciales = CONFIG.modulosTableroComercial;
    const sugerido = comerciales.find((m) => m >= conReserva) || comerciales[comerciales.length - 1];
    return {
      results: [
        { label: 'Total de módulos requeridos', value: totalModulos, unit: 'mód.' },
        { label: 'Con margen de reserva', value: conReserva, unit: 'mód.', decimals: 1 },
        { label: 'Tablero comercial sugerido', value: sugerido, unit: 'mód.', highlight: true, status: sugerido < conReserva ? 'danger' : 'ok' },
      ],
      notes: sugerido < conReserva ? [{ type: 'warn', text: 'Ni el tablero comercial más grande de la lista alcanza el margen calculado — considerá dos tableros o uno mayor.' }] : [],
      table: {
        caption: 'Tableros comerciales disponibles',
        headers: ['Módulos'],
        rows: comerciales.map((m) => [m]),
      },
    };
  },
};
