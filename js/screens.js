// Renderizado
function render() {
  const root = document.getElementById('root');

  if (state.screen === 'main') {
    root.innerHTML = renderMain();
  } else if (state.screen === 'registrar') {
    root.innerHTML = renderRegistrar();
  } else if (state.screen === 'consumir') {
    root.innerHTML = renderConsumir();
  } else if (state.screen === 'ver') {
    root.innerHTML = renderVer();
  } else if (state.screen === 'historico') {
    root.innerHTML = renderHistorico();
  }

  attachEventListeners();
}

// Pantalla principal
function renderMain() {
  const totalRaciones = state.raciones.length;
  const racionesProximasCaducar = state.raciones.filter(r => {
    const days = getDaysUntilExpiry(r.caducidad);
    return days <= 2 && days >= 0;
  }).length;
  const racionesCaducadas = state.raciones.filter(r => getDaysUntilExpiry(r.caducidad) < 0).length;

  // Calcular datos para gráfico
  const counts = {};
  state.raciones.forEach(r => {
    counts[r.tipo] = (counts[r.tipo] || 0) + 1;
  });
  const chartData = Object.entries(counts);
  const maxCount = Math.max(...Object.values(counts), 1);

  return `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
      <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <h1 style="font-size: 32px; font-weight: bold; color: #333; margin-bottom: 30px; text-align: center;">🍽️DespensaBoy</h1>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;">
          <div style="padding: 20px; border-radius: 15px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <div style="font-size: 36px; font-weight: bold; margin-bottom: 5px;">${totalRaciones}</div>
            <div style="font-size: 14px; opacity: 0.95;">Raciones disponibles</div>
          </div>
          <div style="padding: 20px; border-radius: 15px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
            <div style="font-size: 36px; font-weight: bold; margin-bottom: 5px;">${racionesProximasCaducar}</div>
            <div style="font-size: 14px; opacity: 0.95;">Próximas a caducar</div>
          </div>
          <div style="padding: 20px; border-radius: 15px; text-align: center; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white;">
            <div style="font-size: 36px; font-weight: bold; margin-bottom: 5px;">${racionesCaducadas}</div>
            <div style="font-size: 14px; opacity: 0.95;">Caducadas</div>
          </div>
        </div>

        <div style="background: #f9f9f9; border-radius: 15px; padding: 20px; margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 15px;">Distribución por tipo</h3>
          ${chartData.length > 0 ? `
            <div class="bar-chart">
              ${chartData.map(([tipo, count]) => `
                <div class="bar-item">
                  <div class="bar" style="height: ${(count / maxCount) * 150}px;">${count}</div>
                  <div class="bar-label">${tipo}</div>
                </div>
              `).join('')}
            </div>
          ` : '<div style="text-align: center; padding: 40px; color: #999; font-size: 16px;">Comienza registrando una compra👇</div>'}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
          <button onclick="goToScreen('registrar')" style="padding: 20px; font-size: 16px; font-weight: 600; border: none; border-radius: 12px; cursor: pointer; color: white; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            📦 Registrar compra
          </button>
          <button onclick="goToScreen('consumir')" style="padding: 20px; font-size: 16px; font-weight: 600; border: none; border-radius: 12px; cursor: pointer; color: white; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            🍴 Consumir raciones
          </button>
          <button onclick="goToScreen('ver')" style="padding: 20px; font-size: 16px; font-weight: 600; border: none; border-radius: 12px; cursor: pointer; color: #333; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
            📋 Ver raciones
          </button>
          <button onclick="goToScreen('historico')" style="padding: 20px; font-size: 16px; font-weight: 600; border: none; border-radius: 12px; cursor: pointer; color: #333; background: linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 100%);">
            📊 Ver histórico
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderRegistrar() {
  return `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
      <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <button onclick="goToScreen('main')" style="background: #f0f0f0; border: none; padding: 10px 20px; border-radius: 10px; font-size: 16px; cursor: pointer; margin-bottom: 15px; font-weight: 600; color: #555;">← Volver</button>
        <h2 style="font-size: 26px; font-weight: bold; color: #333; margin-bottom: 25px; margin-top: 10px;">📦 Registrar Compra</h2>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px;">
          ${TIPOS_RACIONES.map(config => `
            <button onclick="addTipoRacion('${config.tipo}')" style="position: relative; padding: 20px 10px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border: 2px solid transparent; border-radius: 12px; cursor: pointer; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">${config.icono}</div>
              <div style="font-size: 13px; font-weight: 600; color: #333; line-height: 1.2;">${config.tipo}</div>
              ${state.counts[config.tipo] > 0 ? `<div style="position: absolute; top: 8px; right: 8px; background: #667eea; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">${state.counts[config.tipo]}</div>` : ''}
            </button>
          `).join('')}
        </div>

        ${renderCollapsiblePanel({
          show: state.tempRaciones.length > 0,
          title: `${state.tempRaciones.length} raciones añadidas`,
          items: state.tempRaciones,
          expanded: state.panelExpanded,
          renderItem: (racion, index) => {
            const config = TIPOS_RACIONES.find(t => t.tipo === racion.tipo);
            return `
              <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f9f9f9; border-radius: 10px; margin-bottom: 10px;">
                <div style="font-size: 28px; flex-shrink: 0;">${config.icono}</div>
                <div style="flex: 1;">
                  <input type="text" value="${racion.nombre}" onchange="updateRacionNombre(${index}, this.value)" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; width: 100%; margin-bottom: 5px;">
                  <div style="margin-bottom: 5px;">
                    <label style="font-size: 14px; color: #666; display: flex; align-items: center;">
                      Caduca en:
                      <input type="number" value="${racion.caducidad}" onchange="updateRacionCaducidad(${index}, this.value)" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; width: 70px; margin-left: 8px;">
                      días
                    </label>
                  </div>
                  <div style="font-size: 13px; color: #666;">${config.tipo} • ${config.ubicacion}</div>
                </div>
                <button onclick="removeRacion(${index})" style="background: #ff4444; color: white; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; flex-shrink: 0;">✕</button>
              </div>
            `;
          },
          buttons: [{
            label: '✓ Finalizar',
            onClick: 'finalizarRegistro()',
          }],
        })}
      </div>
    </div>
  `;
}

function renderConsumir() {
  const counts = {};
  TIPOS_RACIONES.forEach(config => {
    counts[config.tipo] = state.raciones.filter(r => r.tipo === config.tipo).length;
  });

  return `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
      <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <button onclick="goToScreen('main')" style="background: #f0f0f0; border: none; padding: 10px 20px; border-radius: 10px; font-size: 16px; cursor: pointer; margin-bottom: 15px; font-weight: 600; color: #555;">← Volver</button>
        <h2 style="font-size: 26px; font-weight: bold; color: #333; margin-bottom: 25px; margin-top: 10px;">🍴 Consumir Raciones</h2>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px;">
          ${TIPOS_RACIONES.map(config => {
            const available = counts[config.tipo] || 0;
            const consumed = state.selectedRaciones.filter(r => r.tipo === config.tipo).length;
            const remaining = available - consumed;

            return `
              <button onclick="selectTipoConsumir('${config.tipo}')" ${remaining === 0 ? 'disabled' : ''} style="position: relative; padding: 20px 10px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border: 2px solid transparent; border-radius: 12px; cursor: pointer; text-align: center; ${remaining === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                <div style="font-size: 32px; margin-bottom: 8px;">${config.icono}</div>
                <div style="font-size: 13px; font-weight: 600; color: #333; line-height: 1.2;">${config.tipo}</div>
                ${remaining > 0 ? `<div style="position: absolute; top: 8px; right: 8px; background: #667eea; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">${remaining}</div>` : ''}
              </button>
            `;
          }).join('')}
        </div>

        ${state.showPopup ? `
          <div onclick="closePopup()" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;">
            <div onclick="event.stopPropagation()" style="background: white; border-radius: 20px; padding: 25px; max-width: 500px; width: 90%; max-height: 70vh; overflow: auto;">
              <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #333;">Selecciona una ración</h3>
              <div style="margin-bottom: 15px;">
                ${state.raciones
                  .filter(r => r.tipo === state.currentTipo && !state.selectedRaciones.find(s => s.id === r.id))
                  .map(racion => {
                    const daysLeft = getDaysUntilExpiry(racion.caducidad);
                    const isExpired = daysLeft < 0;
                    const isNearExpiry = daysLeft <= 2 && daysLeft >= 0;

                    return `
                      <button onclick="selectRacion('${racion.id}')" style="width: 100%; padding: 15px; background: ${isExpired ? '#ffe0e0' : isNearExpiry ? '#fff4e0' : '#f9f9f9'}; border: 2px solid ${isExpired ? '#ff4444' : isNearExpiry ? '#ff9944' : 'transparent'}; border-radius: 10px; cursor: pointer; margin-bottom: 10px; text-align: left;">
                        <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 5px;">${racion.nombre}</div>
                        <div style="font-size: 14px; color: #666;">
                          Caduca: ${racion.caducidad}
                          ${isExpired ? ' (caducada)' : ''}
                          ${isNearExpiry ? ` (${daysLeft} días)` : ''}
                        </div>
                      </button>
                    `;
                  }).join('')}
              </div>
              <button onclick="closePopup()" style="width: 100%; padding: 12px; background: #f0f0f0; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; color: #555;">Cancelar</button>
            </div>
          </div>
        ` : ''}

        ${renderCollapsiblePanel({
          show: state.selectedRaciones.length > 0,
          title: `${state.selectedRaciones.length} raciones a consumir`,
          items: state.selectedRaciones,
          expanded: state.panelExpanded,
          renderItem: (racion, index) => {
            const config = TIPOS_RACIONES.find(t => t.tipo === racion.tipo);
            return `
              <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f9f9f9; border-radius: 10px; margin-bottom: 10px;">
                <div style="font-size: 28px; flex-shrink: 0;">${config.icono}</div>
                <div style="flex: 1;">
                  <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 5px;">${racion.nombre}</div>
                  <div style="font-size: 13px; color: #666;">Caduca: ${racion.caducidad} • ${config.ubicacion}</div>
                </div>
                <button onclick="removeSelectedRacion(${index})" style="background: #ff4444; color: white; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; flex-shrink: 0;">✕</button>
              </div>
            `;
          },
          buttons: [{
            label: '✓ Finalizar',
            onClick: 'finalizarConsumo()',
          }],
        })}
      </div>
    </div>
  `;
}

function renderVer() {
  const racionesPorTipo = {};
  state.raciones.forEach(r => {
    if (!racionesPorTipo[r.tipo]) racionesPorTipo[r.tipo] = [];
    racionesPorTipo[r.tipo].push(r);
  });

  Object.keys(racionesPorTipo).forEach(tipo => {
    racionesPorTipo[tipo].sort((a, b) => {
      const dateA = parseDate(a.caducidad);
      const dateB = parseDate(b.caducidad);
      return dateA.getTime() - dateB.getTime();
    });
  });

  return `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
      <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); margin-bottom: ${state.selectedRacionToEdit ? '100px' : '0'};">
        <button onclick="goToScreen('main')" style="background: #f0f0f0; border: none; padding: 10px 20px; border-radius: 10px; font-size: 16px; cursor: pointer; margin-bottom: 15px; font-weight: 600; color: #555;">← Volver</button>
        <h2 style="font-size: 26px; font-weight: bold; color: #333; margin-bottom: 25px; margin-top: 10px;">📋 Ver Raciones</h2>

        ${Object.keys(racionesPorTipo).length === 0
          ? '<div style="text-align: center; padding: 60px 20px; color: #999; font-size: 16px;">No hay raciones registradas</div>'
          : `<div style="margin-top: 20px;">
              ${TIPOS_RACIONES.map(config => {
                const racionesTipo = racionesPorTipo[config.tipo];
                if (!racionesTipo || racionesTipo.length === 0) return '';

                return `
                  <div style="margin-bottom: 30px;">
                    <h3 style="font-size: 20px; font-weight: 600; color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">
                      ${config.icono} ${config.tipo} (${racionesTipo.length})
                    </h3>
                    <div style="display: grid; gap: 10px;">
                      ${racionesTipo.map(racion => {
                        const daysLeft = getDaysUntilExpiry(racion.caducidad);
                        const isExpired = daysLeft < 0;
                        const isNearExpiry = daysLeft <= 2 && daysLeft >= 0;

                        return `
                          <div onclick="selectRacionToEdit('${racion.id}')" style="padding: 15px; background: ${isExpired ? '#ffe0e0' : isNearExpiry ? '#fff4e0' : '#f9f9f9'}; border-radius: 10px; border-left: 4px solid ${isExpired ? '#ff4444' : isNearExpiry ? '#ff9944' : '#667eea'}; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                            <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 5px;">${racion.nombre}</div>
                            <div style="font-size: 14px; color: #666; margin-bottom: 3px;">
                              Caduca: ${racion.caducidad}
                              ${isExpired ? ' ❌' : ''}
                              ${isNearExpiry ? ` ⚠️ (${daysLeft} días)` : ''}
                            </div>
                            <div style="font-size: 13px; color: #999;">${config.ubicacion}</div>
                            <div style="font-size: 12px; color: #999; margin-top: 5px; font-style: italic;">Toca para editar</div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`}
      </div>

      ${renderCollapsiblePanel({
        show: state.selectedRacionToEdit !== null,
        title: 'Editar ración',
        items: state.selectedRacionToEdit ? [state.raciones.find(r => r.id === state.selectedRacionToEdit)].filter(Boolean) : [],
        expanded: state.panelExpanded,
        renderItem: (racion) => {
          const config = TIPOS_RACIONES.find(t => t.tipo === racion.tipo);
          const daysUntilExpiry = getDaysUntilExpiry(racion.caducidad);

          return `
            <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f9f9f9; border-radius: 10px; margin-bottom: 15px;">
              <div style="font-size: 28px; flex-shrink: 0;">${config.icono}</div>
              <div style="flex: 1;">
                <label style="font-size: 14px; color: #666; display: block; margin-bottom: 5px;">Nombre:</label>
                <input id="edit-nombre" type="text" value="${racion.nombre}" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; width: 100%; margin-bottom: 10px;">

                <label style="font-size: 14px; color: #666; display: block; margin-bottom: 5px;">Fecha de caducidad:</label>
                <input id="edit-caducidad" type="text" value="${racion.caducidad}" placeholder="DD/MM/AAAA" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; width: 100%; margin-bottom: 5px;">
                <div style="font-size: 12px; color: #999;">
                  ${daysUntilExpiry >= 0 ? `Faltan ${daysUntilExpiry} días` : `Caducada hace ${Math.abs(daysUntilExpiry)} días`}
                </div>

                <div style="font-size: 13px; color: #666; margin-top: 10px;">${config.tipo} • ${config.ubicacion}</div>
              </div>
            </div>
          `;
        },
        buttons: [
          {
            label: '🗑️ Eliminar',
            onClick: 'deleteRacion()',
            background: '#ff4444',
          },
          {
            label: '✓ Guardar',
            onClick: 'saveEditedRacion()',
          },
        ],
      })}
    </div>
  `;
}

function renderHistorico() {
  const historicoAgrupado = {};

  // Agrupar entradas por fecha
  state.racionesHistorico.forEach(entry => {
    if (!historicoAgrupado[entry.fecha]) {
      historicoAgrupado[entry.fecha] = [];
    }
    historicoAgrupado[entry.fecha].push(entry);
  });

  // Obtener fechas ordenadas (más recientes primero)
  const fechasOrdenadas = Object.keys(historicoAgrupado).sort((a, b) => {
    const dateA = parseDate(a);
    const dateB = parseDate(b);
    return dateB.getTime() - dateA.getTime();
  });

  // Iconos y colores para cada tipo de operación
  const tipoConfig = {
    'añadir': { icono: '➕', color: '#4CAF50', label: 'Añadido' },
    'consumir': { icono: '🍴', color: '#2196F3', label: 'Consumido' },
    'modificar': { icono: '✏️', color: '#FF9800', label: 'Modificado' },
    'eliminar': { icono: '🗑️', color: '#F44336', label: 'Eliminado' },
  };

  return `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
      <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <button onclick="goToScreen('main')" style="background: #f0f0f0; border: none; padding: 10px 20px; border-radius: 10px; font-size: 16px; cursor: pointer; margin-bottom: 15px; font-weight: 600; color: #555;">← Volver</button>
        <h2 style="font-size: 26px; font-weight: bold; color: #333; margin-bottom: 25px; margin-top: 10px;">📊 Histórico de Operaciones</h2>

        ${state.racionesHistorico.length === 0
          ? '<div style="text-align: center; padding: 60px 20px; color: #999; font-size: 16px;">No hay operaciones registradas todavía</div>'
          : `
            <div style="margin-bottom: 20px; padding: 15px; background: #f0f4ff; border-radius: 10px; text-align: center;">
              <div style="font-size: 14px; color: #666;">Total de operaciones: <strong>${state.racionesHistorico.length}</strong></div>
            </div>

            <div style="max-height: 600px; overflow-y: auto; padding-right: 10px;">
              ${fechasOrdenadas.map(fecha => `
                <div style="margin-bottom: 30px;">
                  <h3 style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea; display: flex; align-items: center;">
                    📅 ${fecha}
                    <span style="font-size: 14px; font-weight: normal; color: #666; margin-left: 10px;">(${historicoAgrupado[fecha].length} operaciones)</span>
                  </h3>

                  <div style="display: grid; gap: 12px;">
                    ${historicoAgrupado[fecha].map(entry => {
                      const config = tipoConfig[entry.tipo];
                      const tipoRacionConfig = TIPOS_RACIONES.find(t => t.tipo === entry.racion.tipo);

                      return `
                        <div style="padding: 15px; background: #f9f9f9; border-radius: 10px; border-left: 4px solid ${config.color};">
                          <div style="display: flex; align-items: flex-start; gap: 12px;">
                            <div style="font-size: 24px; flex-shrink: 0;">${config.icono}</div>
                            <div style="flex: 1;">
                              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="font-size: 12px; font-weight: 600; color: white; background: ${config.color}; padding: 4px 10px; border-radius: 12px;">${config.label}</span>
                                <span style="font-size: 13px; color: #999;">${entry.hora}</span>
                              </div>

                              <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 5px;">
                                ${tipoRacionConfig ? tipoRacionConfig.icono : ''} ${entry.racion.nombre}
                              </div>

                              <div style="font-size: 14px; color: #666; margin-bottom: 5px;">
                                Tipo: ${entry.racion.tipo} • Caducidad: ${entry.racion.caducidad}
                              </div>

                              ${entry.tipo === 'modificar' && entry.cambios ? `
                                <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 8px; font-size: 13px;">
                                  <div style="color: #666; margin-bottom: 5px;"><strong>Cambios realizados:</strong></div>
                                  ${entry.cambios.antes.nombre !== entry.cambios.despues.nombre ? `
                                    <div style="color: #555;">
                                      Nombre: <span style="text-decoration: line-through; color: #999;">${entry.cambios.antes.nombre}</span> → <strong>${entry.cambios.despues.nombre}</strong>
                                    </div>
                                  ` : ''}
                                  ${entry.cambios.antes.caducidad !== entry.cambios.despues.caducidad ? `
                                    <div style="color: #555;">
                                      Caducidad: <span style="text-decoration: line-through; color: #999;">${entry.cambios.antes.caducidad}</span> → <strong>${entry.cambios.despues.caducidad}</strong>
                                    </div>
                                  ` : ''}
                                </div>
                              ` : ''}
                            </div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
      </div>
    </div>
  `;
}
