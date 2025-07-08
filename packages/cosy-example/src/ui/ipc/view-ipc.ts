import { createViewArgs } from '@/types/args.js';
import { IPC_METHODS } from '@/types/ipc-methods.js';

const ipc = window.ipc;

export const viewIpc = {
  async upsertView(args: createViewArgs): Promise<void> {
    await ipc.invoke(IPC_METHODS.UPSERT_VIEW, args);
  },

  async batchUpsertViews(viewsArgs: createViewArgs[]): Promise<void> {
    await ipc.invoke(IPC_METHODS.BATCH_UPSERT_VIEWS, viewsArgs);
  },

  async destroyViews(): Promise<void> {
    await ipc.invoke(IPC_METHODS.Destroy_Plugin_Views);
  },
};
