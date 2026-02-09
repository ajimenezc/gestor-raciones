// Estado de la aplicación
let state = {
  screen: 'main',
  raciones: [],
  tempRaciones: [],
  selectedRaciones: [],
  counts: {},
  panelExpanded: false,
  showPopup: false,
  currentTipo: '',
  selectedRacionToEdit: null,
};

// Cargar datos
function loadData() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      state.raciones = data.raciones || [];
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }
}

// Guardar datos
function saveData(raciones) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ raciones }));
  state.raciones = raciones;
}
