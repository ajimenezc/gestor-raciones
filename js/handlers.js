// Event handlers
function goToScreen(screen) {
  state.screen = screen;
  state.panelExpanded = false;
  state.showPopup = false;
  state.selectedRacionToEdit = null;
  if (screen === 'registrar') {
    state.tempRaciones = [];
    state.counts = {};
  } else if (screen === 'consumir') {
    state.selectedRaciones = [];
  }
  render();
}

function addTipoRacion(tipo) {
  const config = TIPOS_RACIONES.find(t => t.tipo === tipo);
  const defaultDays = Math.floor((config.caducidadMin + config.caducidadMax) / 2);

  state.counts[tipo] = (state.counts[tipo] || 0) + 1;
  state.tempRaciones.push({
    tipo,
    nombre: tipo,
    caducidad: defaultDays,
  });
  render();
}

function updateRacionNombre(index, value) {
  state.tempRaciones[index].nombre = value;
}

function updateRacionCaducidad(index, value) {
  state.tempRaciones[index].caducidad = parseInt(value, 10);
}

function removeRacion(index) {
  const racion = state.tempRaciones[index];
  state.counts[racion.tipo] = Math.max(0, (state.counts[racion.tipo] || 1) - 1);
  state.tempRaciones.splice(index, 1);
  render();
}

function togglePanel() {
  state.panelExpanded = !state.panelExpanded;
  render();
}

function finalizarRegistro() {
  const now = new Date();
  const nuevasRaciones = state.tempRaciones.map(temp => ({
    id: `${Date.now()}-${Math.random()}`,
    nombre: temp.nombre,
    tipo: temp.tipo,
    caducidad: formatDate(addDays(now, temp.caducidad)),
    fechaRegistro: formatDate(now),
  }));

  saveData([...state.raciones, ...nuevasRaciones]);
  goToScreen('main');
}

function selectTipoConsumir(tipo) {
  state.currentTipo = tipo;
  state.showPopup = true;
  render();
}

function selectRacion(id) {
  const racion = state.raciones.find(r => r.id === id);
  if (racion) {
    state.selectedRaciones.push(racion);
  }
  state.showPopup = false;
  render();
}

function closePopup() {
  state.showPopup = false;
  render();
}

function removeSelectedRacion(index) {
  state.selectedRaciones.splice(index, 1);
  render();
}

function finalizarConsumo() {
  const idsToRemove = new Set(state.selectedRaciones.map(r => r.id));
  const remaining = state.raciones.filter(r => !idsToRemove.has(r.id));
  saveData(remaining);
  goToScreen('main');
}

function selectRacionToEdit(id) {
  state.selectedRacionToEdit = id;
  state.panelExpanded = true;
  render();
}

function saveEditedRacion() {
  const nombre = document.getElementById('edit-nombre').value;
  const caducidad = document.getElementById('edit-caducidad').value;

  // Validar formato de fecha
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(caducidad)) {
    alert('Formato de fecha inválido. Usa DD/MM/AAAA');
    return;
  }

  // Actualizar la ración
  state.raciones = state.raciones.map(r => {
    if (r.id === state.selectedRacionToEdit) {
      return { ...r, nombre, caducidad };
    }
    return r;
  });

  saveData(state.raciones);
  state.selectedRacionToEdit = null;
  state.panelExpanded = false;
  render();
}

function deleteRacion() {
  if (confirm('¿Estás seguro de que quieres eliminar esta ración?')) {
    state.raciones = state.raciones.filter(r => r.id !== state.selectedRacionToEdit);
    saveData(state.raciones);
    state.selectedRacionToEdit = null;
    state.panelExpanded = false;
    render();
  }
}

function attachEventListeners() {
  // Los eventos ya están inline en el HTML
}
