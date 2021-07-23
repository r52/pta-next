import { createRouter, createWebHashHistory } from 'vue-router';
import Splash from '/@/pages/Splash.vue';

const routes = [
  { path: '/splash', name: 'Splash', component: Splash },
  {
    path: '/about',
    name: 'About',
    component: () => import('/@/pages/About.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('/@/pages/Settings.vue'),
  },
  {
    path: '/tradebar',
    name: 'Tradebar',
    component: () => import('/@/pages/Tradebar.vue'),
  },
  {
    path: '/trade',
    name: 'TradeNotification',
    component: () => import('/@/pages/TradeNotification.vue'),
  },
  {
    path: '/tradehistory',
    name: 'TradeHistory',
    component: () => import('/@/pages/TradeHistory.vue'),
  },
  // {
  //   path: '/stashsetup',
  //   name: 'StashSetup',
  //   component: () => import('/@/pages/StashSetup.vue'),
  // },
  // {
  //   path: '/stashhighlight',
  //   name: 'StashHighlight',
  //   component: () => import('/@/pages/StashHighlight.vue'),
  // },
  {
    path: '/cheatsheet',
    name: 'CheatSheet',
    component: () => import('/@/pages/CheatSheet.vue'),
  },
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
