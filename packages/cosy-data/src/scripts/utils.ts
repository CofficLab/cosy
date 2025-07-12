// utils.ts - 工具函数
export type StatusType = 'success' | 'error' | 'info';

export function showStatus(message: string, type: StatusType = 'info') {
  const colors = {
    success: 'text-green-600 bg-green-100',
    error: 'text-red-600 bg-red-100',
    info: 'text-blue-600 bg-blue-100',
  };

  const connectionStatus = document.getElementById('connectionStatus');
  if (connectionStatus) {
    connectionStatus.innerHTML = `
      <div class="p-3 rounded-md ${colors[type]}">
        ${message}
      </div>
    `;
  }
}
