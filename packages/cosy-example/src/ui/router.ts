/**
 * 路由配置
 *
 * 管理应用的所有路由：
 * 1. 使用 hash 模式，适合桌面应用
 * 2. 配置所有可用的视图路由
 * 3. 设置路由元信息，如标题等
 */

import { createRouter, createWebHashHistory } from 'vue-router';
import PluginStoreView from '@/ui/views/MarketView.vue';
import { useAppStore } from '@/ui/stores/app-store.js';
import HomeView from '@/ui/views/HomeView.vue';
import HeroView from '@/ui/views/HeroView.vue';

export type ViewType = 'home' | 'plugins' | 'chat' | 'plugin-grid' | 'hero';

// 路由配置
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: '首页',
      viewType: 'home',
    },
  },
  {
    path: '/plugins',
    name: 'plugins',
    component: PluginStoreView,
    meta: {
      title: '插件商店',
      viewType: 'plugins',
    },
  },
  {
    path: '/hero',
    name: 'hero',
    component: HeroView,
  },
];

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 路由守卫：处理窗口标题等
router.beforeEach((to, _from, next) => {
  // 设置窗口标题
  if (to.meta.title) {
    document.title = `GitOK - ${to.meta.title}`;
  }

  // 同步更新appStore的currentView状态
  if (to.meta.viewType) {
    // 注意：这里需要延迟调用，因为在路由钩子中不能立即使用pinia store
    setTimeout(() => {
      const appStore = useAppStore();
      appStore.setView(
        to.meta.viewType as 'home' | 'plugins' | 'chat' | 'plugin-grid'
      );
    }, 0);
  }

  next();
});

export default router;
