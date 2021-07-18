import { createRouter, createWebHashHistory } from 'vue-router';
import Splash from '/@/pages/Splash.vue';

const routes = [
  { path: '/splash', name: 'Splash', component: Splash },
  {
    path: '/about',
    name: 'About',
    component: () => import('/@/pages/About.vue'),
  },
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
