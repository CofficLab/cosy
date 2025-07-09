import { IModel } from '@/main/service/chat/contract/IModel.js';

export enum ProviderType {
  DEEPSEEK = 'deepseek',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

export interface IProvider {
  type: ProviderType;
  apiKey: string;
  models: IModel[];
}
