export default {
  id: 'banco-capacitores',
  title: 'Banco de capacitores',
  description: 'Corrección de factor de potencia — potencia reactiva necesaria del banco.',
  fields: [
    { id: 'potenciaActiva', type: 'number', label: 'Potencia activa', unit: 'kW', default: 10, min: 0 },
    { id: 'cosPhiActual', type: 'number', label: 'Cos φ actual', default: 0.75, min: 0.1, max: 1, step: 0.01 },
    { id: 'cosPhiObjetivo', type: 'number', label: 'Cos φ objetivo', default: 0.95, min: 0.1, max: 1, step: 0.01 },
  ],
  calculate(values) {
    const tan1 = Math.tan(Math.acos(values.cosPhiActual));
    const tan2 = Math.tan(Math.acos(values.cosPhiObjetivo));
    const kvar = values.potenciaActiva * (tan1 - tan2);
    return {
      results: [
        { label: 'Potencia reactiva del banco', value: Math.max(kvar, 0), unit: 'kVAR', highlight: true },
      ],
      notes: kvar <= 0 ? [{ text: 'El cos φ actual ya es mayor o igual al objetivo — no se necesita corrección.' }] : [],
      formula: 'Q = P × (tan(φ1) − tan(φ2)), con φ1 = acos(cosφ actual), φ2 = acos(cosφ objetivo).',
    };
  },
};
