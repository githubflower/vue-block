// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Element from 'element-ui';

import 'element-ui/lib/theme-chalk/index.css';
import axios from 'axios';
import i18next from 'i18next';
import vueI18Next from '@panter/vue-i18next';
import messages_zh from 'static/messages/zh.js';
import messages_en from 'static/messages/en.js';
import QBlockCfg from './config'
import createStore from './store'

Vue.use(vueI18Next);
if(!window.localStorage.getItem('QBlockCfg')){
  window.localStorage.setItem('QBlockCfg', JSON.stringify(QBlockCfg))
}
i18next.init({
  lng: QBlockCfg.lang || 'zh', // zh-hans是为了和Google Blockly的语言名称保持一致   i18next这个库有点问题，如果将id配置为zh-hans则加载资源失败
  fallbackLng: 'en',
  resources: {
    'zh': {
      translation: messages_zh, //require('static/messages/zh.js'),
    },
    "en": {
      translation: messages_en//require('static/messages/en.js'),
    }
    
  }
}, function(err, t){
  // debugger;
})
const i18n = new vueI18Next(i18next);
/*const i18n = new vueI18n({
  locale: 'zh-hans',
  messages: {
    "zh-hans": require('static/messages/zh-hans.js'),
    "en": require('static/messages/en.js'),
  }
})*/



Vue.use(Element, { size: 'small', zIndex: 3000 });
Vue.prototype.axios = axios;

Vue.config.productionTip = false

const jQuery = require('jquery');
window.jQuery = jQuery;
window.store = createStore(i18n.i18next.t.bind(i18next));

window.stateManage = {};//状态管理  后续采用vuex实现 TODO


router.beforeEach((to, from, next) => {
  console.log(to);
  if ((from.name === 'blockly' && to.name === 'state') || (to.name === 'blockly' && from.name === 'state')) {
    console.log('同步数据... '); //TODO
  }
  next();
})
/* eslint-disable no-new */
window.EventObj = new Vue();
new Vue({
  el: '#app',
  router,
  components: { App },
  i18n: i18n,
  template: '<App/>'
})
