// Mini debug logger para móvil (activar con ?debug en la URL)
const DEBUG_MOBILE = new URLSearchParams(window.location.search).has('debug');
if (DEBUG_MOBILE) {
  const logDiv = document.createElement('div');
  logDiv.id = 'debug-log';
  logDiv.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:40vh;overflow-y:auto;background:rgba(0,0,0,0.9);color:#0f0;font:11px monospace;padding:8px;z-index:99999;';
  document.body.appendChild(logDiv);
  const origLog = console.log, origErr = console.error, origWarn = console.warn;
  function debugAppend(prefix, args) {
    const line = document.createElement('div');
    line.textContent = prefix + ' ' + Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    logDiv.appendChild(line);
    logDiv.scrollTop = logDiv.scrollHeight;
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
