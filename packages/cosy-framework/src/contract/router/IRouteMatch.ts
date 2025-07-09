import { IRouteConfig } from './IRouteConfig.js';

/**
 * 路由匹配结果
 */
export interface IRouteMatch {
  route: IRouteConfig;
  params: Record<string, any>;
}
