import { ILogManager } from '@coffic/cosy-framework';
import { IAIManager } from '@/main/providers/ai/IAIManager.js';

export interface IAIServerConfig {
  port: number;
  logger: ILogManager;
  aiManager: IAIManager;
}
