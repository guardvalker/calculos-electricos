export default {
  id: 'proteccion-termomagnetica',
  title: 'Térmica y diferencial (ID)',
  description: 'Elegí la térmica según la carga y enterate al toque qué diferencial (ID) le corresponde.',
  fields: [
    { id: 'modoEntrada', type: 'select', label: 'Calcular térmica a partir de', default: 'seccion', triggersRedraw: true, options: [{ value: 'seccion', label: 'Sección de cable' }, { value: 'corriente', label: 'Corriente de diseño' }] },
    {
      id: 'seccion', type: 'select', label: 'Sección de cable', default: 2.5, visibleIf: (v) => v.modoEntrada === 'seccion',
      options: [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95].map((s) => ({ value: s, label: `${s} mm²` })),
    },
    { id: 'corriente', type: 'number', label: 'Corriente de diseño', unit: 'A', default: 16, min: 0, visibleIf: (v) => v.modoEntrada === 'corriente' },
    {
      id: 'tipoUso', type: 'select', label: 'Tipo de circuito/uso', default: 'tomas', cards: true,
      options: [
        { value: 'iluminacion', label: 'Iluminación' },
        { value: 'tomas', label: 'Tomas de uso general' },
        { value: 'cocina', label: 'Cocina' },
        { value: 'aire_acondicionado', label: 'Aire acondicionado' },
        { value: 'motores', label: 'Motores' },
        { value: 'proteccion_general', label: 'Protección general / incendio' },
        { value: 'otros', label: 'Otras cargas inductivas' },
      ],
    },
    { id: 'sistema', type: 'select', label: 'Sistema', default: 'mono220', options: [{ value: 'mono220', label: '220V — Monofásico' }, { value: 'tri380', label: '380V — Trifásico' }] },
  ],
  calculate(values, CONFIG) {
    let calibreTermica;
    if (values.modoEntrada === 'seccion') {
      calibreTermica = CONFIG.seccionProteccion[values.seccion];
    } else {
      calibreTermica = CONFIG.calibresComercialesTermica.find((c) => c >= values.corriente) || CONFIG.calibresComercialesTermica[CONFIG.calibresComercialesTermica.length - 1];
    }
    const curva = CONFIG.curvaPorUso[values.tipoUso];
    const sensibilidad = values.tipoUso === 'proteccion_general' ? CONFIG.diferencial.proteccionGeneral : CONFIG.diferencial.contactoHumano;
    const polos = values.sistema === 'mono220' ? 2 : 4;
    const calibreDiferencial = CONFIG.calibresComercialesDiferencial.find((c) => c >= calibreTermica) || CONFIG.calibresComercialesDiferencial[CONFIG.calibresComercialesDiferencial.length - 1];

    return {
      results: [
        { label: 'Térmica sugerida', value: calibreTermica, unit: 'A', highlight: true },
        { label: 'Curva de térmica', value: curva, unit: '', decimals: 0 },
        { label: 'Diferencial necesario (mín.)', value: calibreDiferencial, unit: 'A', highlight: true },
        { label: 'Sensibilidad del ID', value: sensibilidad, unit: 'mA', highlight: true },
        { label: 'Polos del ID', value: polos, unit: '' },
      ],
      notes: [
        { text: `Para esta térmica de ${calibreTermica}A necesitás un diferencial de ${calibreDiferencial}A o más, ${sensibilidad}mA, ${polos} polos.` },
        { text: 'Curva B: cargas resistivas/iluminación. Curva C: motores, compresores, cargas con pico de arranque.' },
        { text: '30mA para circuitos con contacto humano directo (tomas, iluminación, baño, cocina). 300mA para protección general o de incendio.' },
      ],
      table: {
        caption: 'Correspondencia sección → térmica sugerida',
        headers: ['Sección (mm²)', 'Térmica sugerida (A)'],
        rows: Object.entries(CONFIG.seccionProteccion).map(([s, a]) => [s, a]),
      },
    };
  },
};
