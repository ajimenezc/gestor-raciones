// Utilidades
const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getDaysUntilExpiry = (expiryDate) => {
  const expiry = parseDate(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Función reutilizable para el panel collapsible
const renderCollapsiblePanel = (config) => {
  const {
    show,
    title,
    items = [],
    renderItem,
    buttons = [],
    expanded,
  } = config;

  if (!show) return '';

  return `
    <div id="panel" style="position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top-left-radius: 20px; border-top-right-radius: 20px; box-shadow: 0 -4px 20px rgba(0,0,0,0.2); max-height: ${expanded ? '70vh' : '70px'}; overflow-y: auto; z-index: 1000; transition: max-height 0.3s ease;">
      <div onclick="togglePanel()" style="padding: 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 600; color: #333; border-bottom: 1px solid #e0e0e0;">
        <span>${title}</span>
        <span>${expanded ? '▼' : '▲'}</span>
      </div>
      ${expanded ? `
        <div style="padding: 20px;">
          ${items.map((item, index) => renderItem(item, index)).join('')}
          ${buttons.length > 0 ? `
            <div style="${buttons.length > 1 ? 'display: grid; grid-template-columns: ' + '1fr '.repeat(buttons.length) + '; gap: 10px;' : ''}">
              ${buttons.map(btn => `
                <button onclick="${btn.onClick}" style="width: 100%; padding: ${buttons.length > 1 ? '12px' : '15px'}; background: ${btn.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; color: white; border: none; border-radius: 10px; font-size: ${buttons.length > 1 ? '14px' : '16px'}; font-weight: 600; cursor: pointer; ${buttons.length > 1 ? '' : 'margin-top: 15px;'}">
                  ${btn.label}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
};
