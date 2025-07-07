import { ILogManager } from '@/contract/logger/ILogManager';
import { createFacade } from '@/facades/createFacade';
import { Facade } from '@/facades/Facade';

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
