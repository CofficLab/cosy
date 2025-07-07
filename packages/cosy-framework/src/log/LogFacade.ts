import { ILogManager } from '@/contract/logger/ILogManager.js';
import { createFacade } from '@/facades/createFacade.js';
import { Facade } from '@/facades/Facade.js';

/**
 * Log Facade
 * Provides a static interface to the log manager.
 */
class BaseFacade extends Facade {
  /**
   * Get the registered name of the component.
   */
  protected static override getFacadeAccessor(): string {
    return 'log';
  }
}

export const LogFacade = createFacade<ILogManager>(BaseFacade);
