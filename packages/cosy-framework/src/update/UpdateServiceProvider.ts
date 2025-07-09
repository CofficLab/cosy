import { ServiceProvider } from '../setting/ServiceProvider.js';
import { UpdateManager } from './UpdateManager.js';
import { IApplication } from '../contract/IApplication.js';
import { ILogManager } from '../contract/logger/ILogManager.js';
import { AppAbstract, LogAbstract, UpdateContract } from '../constants.js';

export class UpdateServiceProvider extends ServiceProvider {
  public register(): void {
    this.app.singleton(UpdateContract, () => {
      return new UpdateManager(
        this.app.make<IApplication>(AppAbstract),
        this.app.make<ILogManager>(LogAbstract)
      );
    });
  }

  public async boot(): Promise<void> {
    const updateManager = this.app.make<UpdateManager>(UpdateContract);
    updateManager.boot();
  }
}
