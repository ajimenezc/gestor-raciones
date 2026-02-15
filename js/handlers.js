// Event handlers

// Añadir entrada al histórico
function addHistoricoEntry(tipo, racion, cambios = null) {
  const entry = {
    id: `hist-${Date.now()}-${Math.random()}`,
    fecha: formatDate(new Date()),
    hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    tipo, // 'añadir', 'consumir', 'modificar', 'eliminar'
    racion: {
      nombre: racion.nombre,
      tipo: racion.tipo,
      caducidad: racion.caducidad,
    },
  };

  if (cambios) {
    entry.cambios = cambios;
  }

  state.racionesHistorico.unshift(entry); // Añadir al principio para mostrar los más recientes primero
}

async function goToScreen(screen) {
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

  // Refrescar datos desde Supabase al volver a main, ver o historico
  if ((screen === 'main' || screen === 'ver' || screen === 'historico') && typeof refreshDataFromSupabase === 'function') {
    await refreshDataFromSupabase();
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

  // Registrar cada ración añadida en el histórico
  nuevasRaciones.forEach(racion => {
    addHistoricoEntry('añadir', racion);
  });

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
  // Registrar cada ración consumida en el histórico
  state.selectedRaciones.forEach(racion => {
    addHistoricoEntry('consumir', racion);
  });

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

  // Encontrar la ración original para el histórico
  const racionOriginal = state.raciones.find(r => r.id === state.selectedRacionToEdit);

  // Actualizar la ración
  state.raciones = state.raciones.map(r => {
    if (r.id === state.selectedRacionToEdit) {
      return { ...r, nombre, caducidad };
    }
    return r;
  });

  const racionActualizada = state.raciones.find(r => r.id === state.selectedRacionToEdit);

  // Registrar en el histórico solo si hubo cambios
  if (racionOriginal && (racionOriginal.nombre !== nombre || racionOriginal.caducidad !== caducidad)) {
    addHistoricoEntry('modificar', racionActualizada, {
      antes: { nombre: racionOriginal.nombre, caducidad: racionOriginal.caducidad },
      despues: { nombre, caducidad },
    });
  }

  saveData(state.raciones);
  state.selectedRacionToEdit = null;
  state.panelExpanded = false;
  render();
}

function deleteRacion() {
  if (confirm('¿Estás seguro de que quieres eliminar esta ración?')) {
    // Guardar la ración antes de eliminarla para el histórico
    const racionAEliminar = state.raciones.find(r => r.id === state.selectedRacionToEdit);

    if (racionAEliminar) {
      addHistoricoEntry('eliminar', racionAEliminar);
    }

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

// Handlers de sincronización

async function crearNuevoCodigo() {
  try {
    const codigo = await crearDespensaConCodigo();

    // Guardar código en localStorage y estado
    localStorage.setItem('sync_code', codigo);
    state.syncCode = codigo;
    state.syncEnabled = true;

    // Suscribirse a cambios
    state.syncChannel = suscribirseACambios(codigo);

    render();

    alert(`✓ Código creado exitosamente:\n\n${codigo}\n\n¡Compártelo con tu familia!`);
  } catch (error) {
    console.error('Error creando código:', error);
    alert('Error al crear el código. Revisa la consola para más detalles.');
  }
}

async function conectarConCodigoExistente() {
  const input = document.getElementById('codigo-input');
  const codigo = input.value.trim().toUpperCase();

  if (!codigo) {
    alert('Por favor introduce un código');
    return;
  }

  try {
    const data = await conectarConCodigo(codigo);

    // Preguntar si quiere mezclar datos o reemplazar
    const mezclar = confirm(
      '¿Quieres mantener tus datos locales y mezclarlos con los del servidor?\n\n' +
      'Sí = Mantener ambos\n' +
      'No = Usar solo datos del servidor'
    );

    if (mezclar) {
      // Mezclar datos (evitar duplicados por ID)
      const idsExistentes = new Set(state.raciones.map(r => r.id));
      const racionesNuevas = (data.raciones || []).filter(r => !idsExistentes.has(r.id));
      state.raciones = [...state.raciones, ...racionesNuevas];

      const idsHistoricoExistentes = new Set(state.racionesHistorico.map(h => h.id));
      const historicoNuevo = (data.historico || []).filter(h => !idsHistoricoExistentes.has(h.id));
      state.racionesHistorico = [...state.racionesHistorico, ...historicoNuevo];
    } else {
      // Reemplazar con datos del servidor
      state.raciones = data.raciones || [];
      state.racionesHistorico = data.historico || [];
    }

    // Guardar datos localmente
    saveDataLocal(state.raciones, state.racionesHistorico);

    // Guardar código
    localStorage.setItem('sync_code', codigo);
    state.syncCode = codigo;
    state.syncEnabled = true;

    // Suscribirse a cambios
    state.syncChannel = suscribirseACambios(codigo);

    // Sincronizar por si mezclamos datos
    if (mezclar) {
      await sincronizarConSupabase(codigo);
    }

    render();

    alert('✓ Conectado exitosamente!\n\nTus dispositivos están ahora sincronizados.');
  } catch (error) {
    console.error('Error conectando:', error);
    alert('Código no encontrado. Verifica que sea correcto.');
  }
}

function copiarCodigo() {
  if (!state.syncCode) return;

  navigator.clipboard.writeText(state.syncCode).then(() => {
    alert('✓ Código copiado al portapapeles:\n\n' + state.syncCode);
  }).catch(() => {
    // Fallback si no funciona clipboard API
    prompt('Copia este código:', state.syncCode);
  });
}

function desactivarSincronizacion() {
  if (!confirm('¿Estás seguro de que quieres desactivar la sincronización?\n\nTus datos locales se mantendrán, pero dejarán de sincronizarse con otros dispositivos.')) {
    return;
  }

  // Desuscribirse de cambios
  if (state.syncChannel) {
    desuscribirseACambios(state.syncChannel);
  }

  // Limpiar estado
  localStorage.removeItem('sync_code');
  state.syncCode = null;
  state.syncEnabled = false;
  state.syncChannel = null;

  render();

  alert('Sincronización desactivada.\n\nPuedes reactivarla cuando quieras con el mismo código.');
}
