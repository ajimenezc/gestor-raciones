// Estado de la aplicación
let state = {
  screen: 'main',
  raciones: [],
  racionesHistorico: [],
  tempRaciones: [],
  selectedRaciones: [],
  counts: {},
  panelExpanded: false,
  showPopup: false,
  currentTipo: '',
  selectedRacionToEdit: null,
  // Sincronización
  syncEnabled: false,
  syncCode: null,
  syncChannel: null,
};

// Cargar datos
function loadData() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      state.raciones = data.raciones || [];
      state.racionesHistorico = data.racionesHistorico || [];
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }

  // Cargar código de sincronización si existe
  const syncCode = localStorage.getItem('sync_code');
  if (syncCode) {
    state.syncCode = syncCode;
    state.syncEnabled = true;
    // Suscribirse a cambios en tiempo real
    if (typeof suscribirseACambios === 'function') {
      state.syncChannel = suscribirseACambios(syncCode);
    }
    // Sincronizar datos desde servidor al cargar la app
    if (typeof sincronizarDesdeSupabase === 'function') {
      sincronizarDesdeSupabase(syncCode).then(changed => {
        if (changed) {
          console.log('✅ Datos actualizados desde servidor al cargar');
          render();
        }
      }).catch(err => {
        console.error('Error al sincronizar desde servidor:', err);
      });
    }
  }
}

// Refrescar datos desde Supabase (llamar al cambiar de pantalla)
async function refreshDataFromSupabase() {
  if (state.syncEnabled && state.syncCode && typeof sincronizarDesdeSupabase === 'function') {
    try {
      const changed = await sincronizarDesdeSupabase(state.syncCode);
      if (changed) {
        console.log('✅ Datos refrescados desde servidor');
        return true;
      }
    } catch (err) {
      console.error('Error al refrescar datos:', err);
    }
  }
  return false;
}

// Guardar datos
function saveData(raciones, racionesHistorico = state.racionesHistorico) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ raciones, racionesHistorico }));
  state.raciones = raciones;
  state.racionesHistorico = racionesHistorico;

  // Sincronizar con Supabase si está habilitado
  if (state.syncEnabled && state.syncCode) {
    sincronizarConSupabase(state.syncCode).catch(err => {
      console.error('Error sincronizando con Supabase:', err);
    });
  }
}
