import { CONFIG } from '../config.js';

export default {
  id: 'consumo-mensual',
  title: 'Consumo mensual estimado',
  description: 'kWh/mes por artefacto y costo estimado según tarifa.',
  fields: [
    {
      id: 'electrodomesticos', type: 'list', label: 'Electrodomésticos', addLabel: '+ Agregar electrodoméstico',
      default: [{ nombre: 'Heladera', potencia: 150, horasDia: 24, diasMes: 30 }],
      presets: CONFIG.presetsElectrodomesticos,
      itemFields: [
        { id: 'nombre', type: 'text', label: 'Nombre', default: '' },
        { id: 'potencia', type: 'number', label: 'Potencia (W)', default: 0 },
        { id: 'horasDia', type: 'number', label: 'Horas/día', default: 1, min: 0, step: 0.1 },
        { id: 'diasMes', type: 'number', label: 'Días/mes', default: 30, min: 0, max: 31 },
      ],
    },
    { id: 'tarifa', type: 'number', label: 'Tarifa (referencia, editable)', unit: '$/kWh', default: 120, min: 0 },
  ],
  calculate(values) {
    const items = values.electrodomesticos || [];
    const filas = items.map((it) => {
      const kwhMes = ((Number(it.potencia) || 0) * (Number(it.horasDia) || 0) * (Number(it.diasMes) || 0)) / 1000;
      return { nombre: it.nombre || '(sin nombre)', kwhMes, costo: kwhMes * values.tarifa };
    });
    const totalKwh = filas.reduce((acc, f) => acc + f.kwhMes, 0);
    const totalCosto = totalKwh * values.tarifa;

    return {
      results: [
        { label: 'Consumo total mensual', value: totalKwh, unit: 'kWh', highlight: true },
        { label: 'Costo total estimado', value: totalCosto, unit: '$', highlight: true },
      ],
      table: {
        caption: 'Detalle por artefacto',
        headers: ['Artefacto', 'kWh/mes', 'Costo ($)'],
        rows: filas.map((f) => [f.nombre, f.kwhMes.toFixed(1), f.costo.toFixed(0)]),
        open: true,
      },
    };
  },
};
