import { RouteConfig } from 'vue-router';

const routes: RouteConfig[] = [
  {
    path: '/about',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Index.vue') }]
  },
  {
    path: '/settings',
    component: () => import('layouts/Settings.vue')
  },
  {
    path: '/item',
    component: () => import('layouts/Item.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/Loading.vue')
      },
      {
        path: '/mods',
        name: 'mods',
        props: true,
        component: () => import('pages/Mods.vue')
      },
      {
        path: '/results',
        name: 'results',
        props: true,
        component: () => import('pages/Results.vue')
      }
    ]
  }
];

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue')
  });
}

export default routes;
