import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import Test from '@/components/Test'
import PathAnimation from '@/components/statepage/PathAnimation'

const StatePage = () => {
  // 此注释不能删除，生产打包时会根据此配置创建相应的文件
  return import(/* webpackChunkName: "StatePage" */ '@/components/statepage/StatePage')
}

const IOPage = () => {
  return import(/* webpackChunkName: "IOPage" */ '@/components/io/IOPage')
}
const PluginIframe = () => {
  return import(/* webpackChunkName: "PluginIframe" */ '@/components/plugin_iframe/PluginIframe')
}

const BlocklyPage = () => {
  return import(/* webpackChunkName: "BlocklyPage" */ '@/components/BlocklyPage')
}

const QblockPage = () => {
  return import(/* webpackChunkName: "QblockPage" */ '@/components/QblockPage')
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
      redirect: '/qblock',
      children: [
        {
          path: 'qblock',
          name: 'qblock',
          component: QblockPage
        },
        {
          path: 'test',
          component: Test
        },
        {
          path: 'dashoffset',
          component: PathAnimation
        },
        {
          path: 'state',
          name: 'state',
          component: StatePage,
          beforeRouteLeave(to, from, next) {
            next();
          }
        },
        {
          path: 'blockly',
          name: 'blockly',
          component: BlocklyPage,
          beforeRouteLeave(to, from, next){
            next();
          }
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
