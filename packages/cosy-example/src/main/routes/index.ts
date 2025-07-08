import { registerCommonRoutes } from './common-route.js';
import { registerSettingRoutes } from './setting-route.js';
import { registerStateRoutes } from './state-route.js';
import { registerIpcRoutes } from './ipc.js';
import { registerViewRoutes } from './view-route.js';

export function registerRoutes(): void {
  registerCommonRoutes();
  registerSettingRoutes();
  registerStateRoutes();
  registerIpcRoutes();
  registerViewRoutes();
}
