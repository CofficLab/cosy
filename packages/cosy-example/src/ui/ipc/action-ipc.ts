import { ActionResult, IpcResponse } from '@coffic/buddy-it';
import { SendableAction } from '@/types/sendable-action.js';
import { IPC_METHODS } from '@/types/ipc-methods.js';
const ipc = window.ipc;

export const actionIpc = {
  async getActions(keyword = ''): Promise<SendableAction[]> {
    const response: IpcResponse<SendableAction[]> = await ipc.invoke(
      IPC_METHODS.GET_ACTIONS,
      keyword
    );
    if (response.success) {
      return response.data as SendableAction[];
    } else {
      throw new Error(response.error);
    }
  },

  async executeAction(
    actionId: string,
    keyword: string
  ): Promise<ActionResult> {
    const response = await ipc.invoke(
      IPC_METHODS.EXECUTE_PLUGIN_ACTION,
      actionId,
      keyword
    );

    if (!response.success) {
      throw new Error(response.error);
    }

    return response.data as ActionResult;
  },

  async getActionView(actionId: string): Promise<string> {
    const response = await ipc.invoke(
      IPC_METHODS.GET_ACTION_VIEW_HTML,
      actionId
    );
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error);
    }
  },
};
