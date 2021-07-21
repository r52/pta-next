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
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
