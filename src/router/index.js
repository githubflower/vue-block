import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import PathAnimation from '@/components/statepage/PathAnimation'

const StatePage = ()=>{
  // 此注释不能删除，生产打包时会根据此配置创建相应的文件
  return import(/* webpackChunkName: "StatePage" */ '@/components/statepage/StatePage')
}

const IOPage = () => {
  return import(/* webpackChunkName: "IOPage" */ '@/components/io/IOPage')
}
const PluginIframe = ()=>{
  return import(/* webpackChunkName: "PluginIframe" */ '@/components/plugin_iframe/PluginIframe')
}

Vue.use(Router)

export default new Router({
  routes: [
    /* {
      path: '*',
      redirect: '/statepage/state'
    }, */
    {
      path: '/',
      name: 'page',
      component: Home,
      redirect: '/state',
      children: [
        {
          path: 'dashoffset',
          component: PathAnimation
        },
        {
          path: 'state',
          component: StatePage
        },
        {
          path: 'io',
          component: IOPage
        },
        {
          path: 'plugin/:name',
          name: 'plugin',
          component: PluginIframe
        }
      ]
    }
  ]
})
