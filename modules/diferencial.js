export default {
  id: 'diferencial',
  title: 'Interruptor diferencial (ID)',
  description: 'Sensibilidad recomendada y cantidad de polos según el uso del circuito.',
  fields: [
    {
      id: 'uso', type: 'select', label: 'Tipo de circuito/uso', default: 'tomas',
      options: [
        { value: 'tomas', label: 'Tomas de uso general' },
        { value: 'iluminacion', label: 'Iluminación' },
        { value: 'aire_acondicionado', label: 'Aire acondicionado' },
        { value: 'cocina', label: 'Cocina' },
        { value: 'proteccion_general', label: 'Protección general / incendio' },
      ],
    },
    { id: 'sistema', type: 'select', label: 'Sistema', default: 'mono220', options: [{ value: 'mono220', label: '220V — Monofásico' }, { value: 'tri380', label: '380V — Trifásico' }] },
  ],
  calculate(values, CONFIG) {
    const sensibilidad = values.uso === 'proteccion_general' ? CONFIG.diferencial.proteccionGeneral : CONFIG.diferencial.contactoHumano;
    const polos = values.sistema === 'mono220' ? 2 : 4;
    return {
      results: [
        { label: 'Sensibilidad recomendada', value: sensibilidad, unit: 'mA', highlight: true },
        { label: 'Cantidad de polos', value: polos, unit: '' },
      ],
      notes: [{ text: '30mA para circuitos con contacto humano directo (tomas, iluminación, baño, cocina). 300mA para protección general o de incendio.' }],
    };
  },
};
