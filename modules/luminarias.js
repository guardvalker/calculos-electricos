import { CONFIG } from '../config.js';

export default {
  id: 'luminarias',
  title: 'Luminarias por ambiente',
  description: 'Lumens totales necesarios y cantidad de luminarias sugerida según el uso del ambiente.',
  fields: [
    { id: 'superficie', type: 'number', label: 'Superficie del ambiente', unit: 'm²', default: 12, min: 0 },
    {
      id: 'tipoUso', type: 'select', label: 'Tipo de uso', default: 'living', triggersRedraw: true,
      sideEffect: (values, v) => { values.lux = CONFIG.luxRecomendado[v]; },
      options: [
        { value: 'living', label: 'Living' }, { value: 'cocina', label: 'Cocina' }, { value: 'bano', label: 'Baño' },
        { value: 'dormitorio', label: 'Dormitorio' }, { value: 'oficina', label: 'Oficina' }, { value: 'taller', label: 'Taller' },
        { value: 'garage', label: 'Garage' }, { value: 'exterior', label: 'Exterior' },
      ],
    },
    { id: 'lux', type: 'number', label: 'Lux recomendados (editable)', default: 200, min: 0 },
    { id: 'eficienciaLuminaria', type: 'number', label: 'Eficiencia de la luminaria', unit: 'lm/W', default: 100, min: 1 },
    { id: 'lumenPorLuminaria', type: 'number', label: 'Flujo de cada luminaria a instalar', unit: 'lm', default: 1000, min: 1 },
  ],
  calculate(values) {
    const lumenesTotales = values.superficie * values.lux;
    const wattsTotales = lumenesTotales / values.eficienciaLuminaria;
    const cantidad = Math.ceil(lumenesTotales / values.lumenPorLuminaria);
    return {
      results: [
        { label: 'Lumens totales necesarios', value: lumenesTotales, unit: 'lm', highlight: true },
        { label: 'Potencia total estimada', value: wattsTotales, unit: 'W' },
        { label: 'Cantidad de luminarias sugerida', value: cantidad, unit: 'u.', highlight: true },
      ],
      formula: 'Lumens = superficie × lux. Cantidad = ⌈Lumens / lumen_por_luminaria⌉.',
    };
  },
};
