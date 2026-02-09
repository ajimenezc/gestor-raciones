// Configuración de tipos de raciones
const TIPOS_RACIONES = [
  { tipo: 'Fresco', icono: '🐟🥩🍗', caducidadMin: 1, caducidadMax: 3, ubicacion: 'nevera' },
  { tipo: 'Refrigerado', icono: '🥚🧀🥛', caducidadMin: 3, caducidadMax: 14, ubicacion: 'nevera' },
  { tipo: 'Congelado', icono: '❄️🧊🍨', caducidadMin: 90, caducidadMax: 365, ubicacion: 'congelador' },
  { tipo: 'Conserva', icono: '🥫🥒🫒', caducidadMin: 365, caducidadMax: 1825, ubicacion: 'despensa' },
  { tipo: 'Conserva en frío', icono: '🫙🥬🥕', caducidadMin: 30, caducidadMax: 180, ubicacion: 'nevera' },
  { tipo: 'Cereal', icono: '🍚🫘🌾', caducidadMin: 180, caducidadMax: 730, ubicacion: 'despensa' },
  { tipo: 'Embutido', icono: '🥪🍖🌭', caducidadMin: 30, caducidadMax: 365, ubicacion: 'despensa o nevera' },
  { tipo: 'Precocinado', icono: '🍲🍛🥘', caducidadMin: 3, caducidadMax: 30, ubicacion: 'nevera' },
  { tipo: 'Preparado listo para comer', icono: '🍝🥗🍱', caducidadMin: 1, caducidadMax: 4, ubicacion: 'nevera' },
  { tipo: 'Bollería / snack', icono: '🍪🍿🥨', caducidadMin: 90, caducidadMax: 365, ubicacion: 'despensa' },
  { tipo: 'Panadería / repostería', icono: '🥖🧁🥐', caducidadMin: 1, caducidadMax: 5, ubicacion: 'despensa' },
  { tipo: 'Higiene / cosmética', icono: '🧴🪥💄', caducidadMin: 365, caducidadMax: 1095, ubicacion: 'baño o despensa' },
  { tipo: 'Limpieza', icono: '🧽🧼🧹', caducidadMin: 365, caducidadMax: 1825, ubicacion: 'despensa o lavadero' },
];

const LOCAL_STORAGE_KEY = 'raciones';
