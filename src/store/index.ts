import Vue from 'vue';
import Vuex from 'vuex';

export interface RootState {
  example: unknown;
}

Vue.use(Vuex);

export default new Vuex.Store<RootState>({
  modules: {
    //example
  },

  // enable strict mode (adds overhead!)
  // for dev mode only
  strict: !!process.env.DEV
});
