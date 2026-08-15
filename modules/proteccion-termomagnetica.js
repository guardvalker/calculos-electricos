export default {
  id: 'proteccion-termomagnetica',
  title: 'Protección termomagnética',
  description: 'Calibre de térmica sugerido y curva según el tipo de carga.',
  fields: [
    { id: 'modoEntrada', type: 'select', label: 'Calcular a partir de', default: 'seccion', triggersRedraw: true, options: [{ value: 'seccion', label: 'Sección de cable' }, { value: 'corriente', label: 'Corriente de diseño' }] },
    {
      id: 'seccion', type: 'select', label: 'Sección de cable', default: 2.5, visibleIf: (v) => v.modoEntrada === 'seccion',
      options: [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95].map((s) => ({ value: s, label: `${s} mm²` })),
    },
    { id: 'corriente', type: 'number', label: 'Corriente de diseño', unit: 'A', default: 16, min: 0, visibleIf: (v) => v.modoEntrada === 'corriente' },
    {
      id: 'tipoCarga', type: 'select', label: 'Tipo de carga', default: 'iluminacion',
      options: [
        { value: 'iluminacion', label: 'Iluminación' },
        { value: 'tomas', label: 'Tomas de uso general' },
        { value: 'motores', label: 'Motores' },
        { value: 'aire_acondicionado', label: 'Aire acondicionado' },
        { value: 'otros', label: 'Otras cargas inductivas' },
      ],
    },
  ],
  calculate(values, CONFIG) {
    let calibre;
    if (values.modoEntrada === 'seccion') {
      calibre = CONFIG.seccionProteccion[values.seccion];
    } else {
      calibre = CONFIG.calibresComercialesTermica.find((c) => c >= values.corriente) || CONFIG.calibresComercialesTermica[CONFIG.calibresComercialesTermica.length - 1];
    }
    const curva = CONFIG.curvaPorUso[values.tipoCarga];
    return {
      results: [
        { label: 'Calibre de térmica sugerido', value: calibre, unit: 'A', highlight: true },
        { label: 'Curva sugerida', value: curva, unit: '', decimals: 0 },
      ],
      notes: [{ text: 'Curva B: cargas resistivas/iluminación. Curva C: motores, compresores, cargas con pico de arranque.' }],
      table: {
        caption: 'Correspondencia sección → térmica sugerida',
        headers: ['Sección (mm²)', 'Térmica sugerida (A)'],
        rows: Object.entries(CONFIG.seccionProteccion).map(([s, a]) => [s, a]),
      },
    };
  },
};
