export default {
  id: 'seccion-cable',
  title: 'Sección de cable por corriente admisible',
  description: 'Sección mínima según corriente admisible (AEA/IRAM 2178), con cruce automático opcional contra el criterio de caída de tensión.',
  fields: [
    { id: 'corriente', type: 'number', label: 'Corriente de diseño', unit: 'A', default: 20, min: 0 },
    { id: 'aislacion', type: 'select', label: 'Aislación', default: 'PVC', options: [{ value: 'PVC', label: 'PVC (70°C)' }, { value: 'XLPE', label: 'XLPE (90°C)' }] },
    {
      id: 'metodo', type: 'select', label: 'Método de instalación', default: 'canio_embutido',
      options: [
        { value: 'canio_embutido', label: 'Caño embutido en pared' },
        { value: 'canio_a_la_vista', label: 'Caño a la vista' },
        { value: 'bandeja', label: 'Bandeja portacable' },
        { value: 'enterrado', label: 'Enterrado' },
        { value: 'al_aire', label: 'Al aire libre' },
      ],
    },
    {
      id: 'tempAmbiente', type: 'select', label: 'Temperatura ambiente', default: '30',
      options: [20, 25, 30, 35, 40, 45, 50].map((t) => ({ value: String(t), label: `${t} °C` })),
    },
    {
      id: 'agrupados', type: 'select', label: 'Conductores/circuitos agrupados', default: '1',
      options: Array.from({ length: 10 }, (_, i) => i + 1).map((n) => ({ value: String(n), label: String(n) })),
    },
    { id: 'incluirCaida', type: 'select', label: 'Cruzar con caída de tensión', default: 'no', triggersRedraw: true, options: [{ value: 'no', label: 'No' }, { value: 'si', label: 'Sí' }] },
    { id: 'sistema', type: 'select', label: 'Sistema', default: 'mono220', visibleIf: (v) => v.incluirCaida === 'si', options: [{ value: 'mono220', label: '220V — Monofásico' }, { value: 'tri380', label: '380V — Trifásico' }] },
    { id: 'material', type: 'select', label: 'Conductor', default: 'cobre', visibleIf: (v) => v.incluirCaida === 'si', options: [{ value: 'cobre', label: 'Cobre' }, { value: 'aluminio', label: 'Aluminio' }] },
    { id: 'distancia', type: 'number', label: 'Distancia (ida)', unit: 'm', default: 20, min: 0, visibleIf: (v) => v.incluirCaida === 'si' },
    {
      id: 'tipoUso', type: 'select', label: 'Tipo de circuito', default: 'iluminacion', visibleIf: (v) => v.incluirCaida === 'si',
      options: [{ value: 'iluminacion', label: 'Iluminación (máx. 3%)' }, { value: 'fuerza_motriz', label: 'Fuerza motriz (máx. 5%)' }],
    },
  ],
  calculate(values, CONFIG) {
    const tabla = values.aislacion === 'PVC' ? CONFIG.corrienteAdmisiblePVC : CONFIG.corrienteAdmisibleXLPE;
    const factorTotal = CONFIG.factorMetodoInstalacion[values.metodo]
      * CONFIG.factorTemperatura[values.tempAmbiente]
      * CONFIG.factorAgrupamiento[values.agrupados];

    const secciones = Object.keys(tabla).map(Number).sort((a, b) => a - b);
    let seccionPorCorriente = secciones[secciones.length - 1];
    let izSeleccionado = tabla[seccionPorCorriente] * factorTotal;
    for (const s of secciones) {
      const iz = tabla[s] * factorTotal;
      if (iz >= values.corriente) { seccionPorCorriente = s; izSeleccionado = iz; break; }
    }

    const results = [
      { label: 'Factor de corrección total', value: factorTotal, unit: '', decimals: 3 },
      { label: 'Sección por corriente admisible', value: seccionPorCorriente, unit: 'mm²', highlight: true },
      { label: 'Corriente admisible corregida (Iz)', value: izSeleccionado, unit: 'A' },
    ];
    const notes = [];
    let seccionFinal = seccionPorCorriente;

    if (values.incluirCaida === 'si') {
      const k = values.sistema === 'mono220' ? 2 : Math.sqrt(3);
      const tension = values.sistema === 'mono220' ? 220 : 380;
      const conductividad = CONFIG.conductividad[values.material];
      const maxPct = values.tipoUso === 'iluminacion' ? CONFIG.caidaTensionMax.iluminacion : CONFIG.caidaTensionMax.fuerzaMotriz;
      const caidaVAdmisible = (maxPct / 100) * tension;
      const seccionTeorica = (k * values.distancia * values.corriente) / (conductividad * caidaVAdmisible);
      const comerciales = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
      const seccionPorCaida = comerciales.find((s) => s >= seccionTeorica) || comerciales[comerciales.length - 1];
      results.push({ label: 'Sección por caída de tensión', value: seccionPorCaida, unit: 'mm²' });
      seccionFinal = Math.max(seccionPorCorriente, seccionPorCaida);
      results.push({ label: 'Sección final recomendada (mayor de ambos criterios)', value: seccionFinal, unit: 'mm²', highlight: true });
    }

    return {
      results,
      notes,
      formula: 'Iz = I_tabla × factor_método × factor_temperatura × factor_agrupamiento. Se elige la menor sección cuyo Iz ≥ corriente de diseño.',
      table: {
        caption: `Corriente admisible base (${values.aislacion}, cobre, caño embutido) por sección`,
        headers: ['Sección (mm²)', 'I admisible (A)'],
        rows: secciones.map((s) => [s, tabla[s]]),
      },
    };
  },
};
