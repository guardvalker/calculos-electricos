// Tablas y constantes de referencia. Todos son valores editables:
// ajustá acá si tenés datos más precisos para tu zona/proveedor.

export const CONFIG = {
  cosPhiDefault: 0.9,
  cosPhiObjetivoDefault: 0.95,

  seccionesComerciales: [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95],

  // Conductividad práctica (m/Ω·mm²) usada para ΔV = k·L·I·cosφ / (S·conductividad)
  conductividad: { cobre: 56, aluminio: 35 },

  // Clasificación de circuitos terminales según AEA 90364-7-771, con el límite de
  // caída de tensión admisible (%) que corresponde a cada uno.
  tiposCircuito: [
    { value: 'IUG', label: 'IUG — Iluminación de uso general', limite: 3 },
    { value: 'TUG', label: 'TUG — Tomas de uso general', limite: 5 },
    { value: 'TUE', label: 'TUE — Tomas de uso especial (horno, aire acond., termotanque)', limite: 5 },
    { value: 'motores', label: 'Motores (bombas, portones, ascensores)', limite: 5 },
  ],

  // Corriente admisible de referencia (A) por sección, aislación PVC, cobre,
  // método "caño embutido en pared aislante" — base para aplicar factores de corrección.
  corrienteAdmisiblePVC: {
    1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 111, 50: 134, 70: 171, 95: 207,
  },
  corrienteAdmisibleXLPE: {
    1.5: 19, 2.5: 26, 4: 35, 6: 45, 10: 61, 16: 81, 25: 106, 35: 131, 50: 158, 70: 200, 95: 241,
  },

  // Factor según método de instalación (relativo a caño embutido = 1)
  factorMetodoInstalacion: {
    canio_embutido: 1.0,
    canio_a_la_vista: 1.05,
    bandeja: 1.15,
    enterrado: 0.85,
    al_aire: 1.25,
  },

  // Factor de agrupamiento según cantidad de conductores/circuitos agrupados
  factorAgrupamiento: {
    1: 1, 2: 0.8, 3: 0.7, 4: 0.65, 5: 0.6, 6: 0.57, 7: 0.54, 8: 0.52, 9: 0.5, 10: 0.48,
  },

  // Factor de corrección por temperatura ambiente (base 30°C = 1.0), aislación PVC
  factorTemperatura: {
    20: 1.15, 25: 1.08, 30: 1.0, 35: 0.91, 40: 0.82, 45: 0.71, 50: 0.58,
  },

  // Correspondencia sección -> calibre de térmica sugerido (A), residencial típico
  seccionProteccion: {
    1.5: 10, 2.5: 20, 4: 25, 6: 32, 10: 40, 16: 63, 25: 80, 35: 100, 50: 125, 70: 160, 95: 200,
  },
  calibresComercialesTermica: [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200],

  // Tipo de circuito/uso — se usa tanto para la curva de térmica como para el diferencial
  curvaPorUso: {
    iluminacion: 'B', tomas: 'B', cocina: 'B', motores: 'C', aire_acondicionado: 'C', proteccion_general: 'C', otros: 'C',
  },

  diferencial: {
    contactoHumano: 30, // mA — tomas, iluminación, baño, cocina
    proteccionGeneral: 300, // mA — incendio / protección general
  },
  calibresComercialesDiferencial: [25, 40, 63, 80, 100],

  // Factor de simultaneidad por tipo de uso (editable según criterio propio)
  factorSimultaneidad: {
    iluminacion: 0.9,
    tomas_uso_general: 0.5,
    aire_acondicionado: 0.8,
    cocina: 0.7,
    termotanque: 1.0,
    otros: 0.6,
  },

  modulosTableroComercial: [12, 18, 24, 36, 48, 72],
  margenReservaTablero: 0.25, // 25%

  luxRecomendado: {
    living: 200, cocina: 300, bano: 150, dormitorio: 150, oficina: 500, taller: 500, garage: 150, exterior: 100,
  },

  eficaciaLuminaria: {
    LED: 100, halogena: 20, incandescente: 12, fluorescente: 60,
  },

  // Placeholders — ajustar según tarifa/mano de obra vigente
  tarifaElectricaDefault: 120, // $/kWh
  valorHoraAAIERICDefault: 6000, // $/hora

  presetsElectrodomesticos: [
    { nombre: 'Heladera', potencia: 150, horasDia: 24, diasMes: 30 },
    { nombre: 'Aire frío/calor (2500W)', potencia: 2500, horasDia: 4, diasMes: 30 },
    { nombre: 'Termotanque eléctrico', potencia: 1500, horasDia: 2, diasMes: 30 },
    { nombre: 'TV LED', potencia: 100, horasDia: 4, diasMes: 30 },
    { nombre: 'Lavarropas', potencia: 500, horasDia: 1, diasMes: 12 },
    { nombre: 'Microondas', potencia: 1200, horasDia: 0.3, diasMes: 30 },
    { nombre: 'PC + monitor', potencia: 250, horasDia: 5, diasMes: 30 },
  ],

  equivalenciasUnidades: {
    kW_a_HP: 1.341,
    kW_a_CV: 1.359,
  },
};
