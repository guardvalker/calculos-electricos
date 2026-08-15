export default {
  id: 'presupuesto',
  title: 'Calculadora de presupuesto',
  description: 'Materiales, mano de obra y margen — con texto listo para copiar y enviar al cliente.',
  fields: [
    {
      id: 'materiales', type: 'list', label: 'Materiales', addLabel: '+ Agregar material',
      default: [{ nombre: 'Cable 2.5mm² (m)', cantidad: 20, precioUnitario: 0 }],
      itemFields: [
        { id: 'nombre', type: 'text', label: 'Material', default: '' },
        { id: 'cantidad', type: 'number', label: 'Cantidad', default: 1, min: 0 },
        { id: 'precioUnitario', type: 'number', label: 'Precio unitario ($)', default: 0, min: 0 },
      ],
    },
    { id: 'horasManoObra', type: 'number', label: 'Horas de mano de obra', default: 4, min: 0 },
    { id: 'valorHora', type: 'number', label: 'Valor hora (referencia AAIERIC, editable)', unit: '$', default: 6000, min: 0 },
    { id: 'margenPct', type: 'number', label: 'Margen', unit: '%', default: 20, min: 0 },
  ],
  calculate(values) {
    const materiales = values.materiales || [];
    const subtotalMateriales = materiales.reduce((acc, m) => acc + (Number(m.cantidad) || 0) * (Number(m.precioUnitario) || 0), 0);
    const subtotalManoObra = values.horasManoObra * values.valorHora;
    const subtotalSinMargen = subtotalMateriales + subtotalManoObra;
    const margen = subtotalSinMargen * (values.margenPct / 100);
    const total = subtotalSinMargen + margen;

    const money = (n) => `$${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    const lineasMateriales = materiales
      .filter((m) => m.nombre)
      .map((m) => `• ${m.nombre} x${m.cantidad} — ${money((Number(m.cantidad) || 0) * (Number(m.precioUnitario) || 0))}`)
      .join('\n');
    const copyText = [
      'PRESUPUESTO',
      '',
      lineasMateriales,
      '',
      `Mano de obra (${values.horasManoObra}h): ${money(subtotalManoObra)}`,
      `Subtotal: ${money(subtotalSinMargen)}`,
      `Total: ${money(total)}`,
    ].join('\n');

    return {
      results: [
        { label: 'Subtotal materiales', value: subtotalMateriales, unit: '$' },
        { label: 'Subtotal mano de obra', value: subtotalManoObra, unit: '$' },
        { label: 'Margen', value: margen, unit: '$' },
        { label: 'Total', value: total, unit: '$', highlight: true },
      ],
      copyText,
    };
  },
};
