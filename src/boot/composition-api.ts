import VueCompositionAPI from '@vue/composition-api';
import { boot } from 'quasar/wrappers';

export default boot(({ Vue }) => {
  Vue.use(VueCompositionAPI);
});
