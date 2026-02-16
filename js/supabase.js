// Configuración de Supabase
// IMPORTANTE: Reemplaza estas variables con tus credenciales de Supabase
// Obtén estas credenciales en: https://supabase.com/dashboard/project/_/settings/api

const SUPABASE_URL = 'https://nbwupfaryhheigvvbxyj.supabase.co'; // Ej: https://abcdefghijklmnop.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5id3VwZmFyeWhoZWlndnZieHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzMzMTQsImV4cCI6MjA4Njc0OTMxNH0.2IUz7WQPWT7CWAH1iFvH-4odh5nn37FiUKwosrQZazA'; // Tu clave anónima pública

// Cloudflare Turnstile Site Key (pública, obtén de https://dash.cloudflare.com)
const TURNSTILE_SITE_KEY = '0x4AAAAAACdWgEGwJTD3TpYV';

// Cliente de Supabase (se inicializa cuando se carga el SDK)
let supabaseClient = null;

// Inicializar cliente de Supabase
function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.warn('Supabase SDK no está cargado');
    return false;
  }

  if (!supabaseClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return true;
}

// Generar código familiar único
function generarCodigoFamiliar() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres confusos (0, O, 1, I)
  let codigo = 'DESPENSA-';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

// Obtener token de Turnstile
async function obtenerTokenTurnstile() {
  return new Promise((resolve, reject) => {
    if (typeof turnstile === 'undefined') {
      reject(new Error('Turnstile no está cargado'));
      return;
    }

    // Buscar o crear contenedor para Turnstile
    let container = document.getElementById('cf-turnstile-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cf-turnstile-container';
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      document.body.appendChild(container);
    }

    // Limpiar renderizados anteriores
    container.innerHTML = '';

    // Renderizar Turnstile
    turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token) => {
        resolve(token);
      },
      'error-callback': (error) => {
        console.error('Turnstile error:', error);
        reject(new Error('Error al verificar CAPTCHA'));
      },
    });
  });
}

// Crear nueva despensa con código (CON TURNSTILE)
async function crearDespensaConCodigo() {
  try {
    // 1. Obtener token de Turnstile
    const captchaToken = await obtenerTokenTurnstile();

    // 2. Llamar a Edge Function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/crear-despensa`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          captchaToken,
          raciones: state.raciones,
          historico: state.racionesHistorico,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al crear despensa');
    }

    return result.codigo;
  } catch (error) {
    console.error('Error creando despensa:', error);
    throw error;
  }
}

// Conectar con código existente
async function conectarConCodigo(codigo) {
  if (!initSupabase()) {
    throw new Error('Supabase no está disponible');
  }

  const { data, error } = await supabaseClient
    .from('despensas')
    .select('*')
    .eq('codigo', codigo.toUpperCase())
    .single();

  if (error) {
    console.error('Error conectando:', error);
    throw new Error('Código no encontrado');
  }

  return data;
}

// Sincronizar datos locales CON Supabase (SUBIR datos) - CON TURNSTILE
async function sincronizarConSupabase(codigo) {
  try {
    // 1. Obtener token de Turnstile
    const captchaToken = await obtenerTokenTurnstile();

    // 2. Llamar a Edge Function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/actualizar-despensa`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          captchaToken,
          codigo,
          raciones: state.raciones,
          historico: state.racionesHistorico,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Error sincronizando:', result.error);
      return false;
    }

    // Guardar timestamp local para evitar loops
    const timestamp = result.data.updated_at;
    localStorage.setItem('last_update_timestamp', timestamp);

    return true;
  } catch (error) {
    console.error('Error sincronizando:', error);
    return false;
  }
}

// Sincronizar datos DESDE Supabase (DESCARGAR datos)
async function sincronizarDesdeSupabase(codigo) {
  if (!initSupabase()) {
    return false;
  }

  try {
    const { data, error } = await supabaseClient
      .from('despensas')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (error) {
      console.error('Error descargando datos:', error);
      return false;
    }

    // Verificar si hay cambios antes de actualizar
    const localTimestamp = localStorage.getItem('last_update_timestamp');
    const remoteTimestamp = data.updated_at;

    if (remoteTimestamp !== localTimestamp) {
      console.log('📥 Sincronizando datos desde servidor...');
      state.raciones = data.raciones || [];

      // Limpiar histórico antes de guardar
      const historico = data.historico || [];
      const { limpio, eliminadas } = limpiarHistoricoAutomatico(historico);
      state.racionesHistorico = limpio;

      if (eliminadas > 0) {
        console.log(`🧹 ${eliminadas} entradas antiguas eliminadas del histórico descargado`);
      }

      // Actualizar localStorage y timestamp
      saveDataLocal(state.raciones, state.racionesHistorico);
      localStorage.setItem('last_update_timestamp', remoteTimestamp);

      return true;
    }

    return false; // No hubo cambios
  } catch (err) {
    console.error('Error en sincronizarDesdeSupabase:', err);
    return false;
  }
}

// Suscribirse a cambios en tiempo real
function suscribirseACambios(codigo) {
  if (!initSupabase()) {
    return null;
  }

  console.log('🔄 Suscribiéndose a cambios en tiempo real para código:', codigo);

  const channel = supabaseClient
    .channel('despensa-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'despensas',
        filter: `codigo=eq.${codigo}`,
      },
      (payload) => {
        console.log('📡 Evento Realtime recibido:', payload);

        // Solo actualizar si el cambio viene de otro dispositivo
        const localTimestamp = localStorage.getItem('last_update_timestamp');
        const remoteTimestamp = payload.new.updated_at;

        console.log('Timestamps - Local:', localTimestamp, 'Remoto:', remoteTimestamp);

        if (remoteTimestamp !== localTimestamp) {
          console.log('📥 Aplicando cambios de otro dispositivo...');
          state.raciones = payload.new.raciones || [];

          // Limpiar histórico antes de guardar
          const historico = payload.new.historico || [];
          const { limpio } = limpiarHistoricoAutomatico(historico);
          state.racionesHistorico = limpio;

          // Actualizar localStorage y timestamp
          saveDataLocal(state.raciones, state.racionesHistorico);
          localStorage.setItem('last_update_timestamp', remoteTimestamp);

          // Re-renderizar
          render();
        } else {
          console.log('⏭️ Cambio ignorado (mismo timestamp = cambio local)');
        }
      }
    )
    .subscribe((status) => {
      console.log('📡 Estado de suscripción Realtime:', status);
    });

  return channel;
}

// Desuscribirse de cambios
function desuscribirseACambios(channel) {
  if (channel) {
    supabaseClient.removeChannel(channel);
  }
}

// Guardar datos solo en localStorage (sin sincronizar)
function saveDataLocal(raciones, racionesHistorico) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ raciones, racionesHistorico }));
}

// Verificar si Supabase está configurado correctamente
function isSupabaseConfigured() {
  return SUPABASE_URL !== 'TU_SUPABASE_URL' &&
         SUPABASE_ANON_KEY !== 'TU_SUPABASE_ANON_KEY';
}
