// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Element from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
/* import MyPlainDraggable1 from 'plain-draggable';
import MyPlainDraggable2 from 'plain-draggable/plain-draggable.min.js'; */

Vue.use(Element, { size: 'small', zIndex: 3000 });

Vue.config.productionTip = false

window.stateManage = {};//状态管理  后续采用vuex实现 TODO
window.genId = (function(){
  var _id = 0;
  return function(type){
    return type + '-' + +new Date();//+ ++_id
  }
})();


/* eslint-disable no-new */
window.EventObj = new Vue();
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
