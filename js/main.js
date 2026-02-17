// Mini debug logger para móvil (activar con ?debug en la URL)
const DEBUG_MOBILE = new URLSearchParams(window.location.search).has('debug');
if (DEBUG_MOBILE) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:0;right:0;z-index:99999;';
  const toggle = document.createElement('button');
  toggle.textContent = 'LOG';
  toggle.style.cssText = 'background:#000;color:#0f0;border:1px solid #0f0;font:bold 11px monospace;padding:4px 8px;border-radius:0 0 0 8px;';
  const logDiv = document.createElement('div');
  logDiv.id = 'debug-log';
  logDiv.style.cssText = 'display:none;position:fixed;top:28px;left:0;right:0;max-height:40vh;overflow-y:auto;background:rgba(0,0,0,0.9);color:#0f0;font:11px monospace;padding:8px;z-index:99999;';
  toggle.onclick = () => { logDiv.style.display = logDiv.style.display === 'none' ? 'block' : 'none'; };
  wrapper.appendChild(toggle);
  document.body.appendChild(wrapper);
  document.body.appendChild(logDiv);
  const origLog = console.log, origErr = console.error, origWarn = console.warn;
  function debugAppend(prefix, args) {
    const line = document.createElement('div');
    line.style.color = prefix === '[ERR]' ? '#f44' : prefix === '[WARN]' ? '#fa0' : '#0f0';
    line.textContent = prefix + ' ' + Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    logDiv.appendChild(line);
    logDiv.scrollTop = logDiv.scrollHeight;
    // Mostrar automáticamente si hay error
    if (prefix === '[ERR]' || prefix === '[UNCAUGHT]' || prefix === '[PROMISE]') { logDiv.style.display = 'block'; toggle.style.background = '#f44'; }
  }
  console.log = function() { origLog.apply(console, arguments); debugAppend('[LOG]', arguments); };
  console.error = function() { origErr.apply(console, arguments); debugAppend('[ERR]', arguments); };
  console.warn = function() { origWarn.apply(console, arguments); debugAppend('[WARN]', arguments); };
  window.onerror = (msg, src, line, col, err) => debugAppend('[UNCAUGHT]', [msg, src + ':' + line]);
  window.onunhandledrejection = (e) => debugAppend('[PROMISE]', [e.reason]);
  console.log('Debug mode activado');
}

// Inicializar
loadData();
render();
