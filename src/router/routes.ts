/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { RouteConfig } from 'vue-router';

const routes: RouteConfig[] = [
  {
    path: '/about',
    component: () => import('layouts/About.vue')
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
      },
      {
        path: '/prediction',
        name: 'prediction',
        props: true,
        component: () => import('pages/Prediction.vue')
      }
    ]
  },
  {
    path: '/tradebar',
    component: () => import('layouts/Tradebar.vue')
  },
  {
    path: '/tradehistory',
    component: () => import('layouts/TradeHistory.vue')
  },
  {
    path: '/trade',
    component: () => import('layouts/TradeNotification.vue')
  },
  {
    path: '/stashsetup',
    component: () => import('layouts/StashSetup.vue')
  },
  {
    path: '/stashhighlight',
    component: () => import('layouts/StashHighlight.vue')
  }
];

// Always leave this as last one
routes.push({
  path: '*',
  component: () => import('pages/Error404.vue')
});

export default routes;
