import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import PathAnimation from '@/components/statepage/PathAnimation'
import StatePage from '@/components/statepage/StatePage'
import IOPage from '@/components/io/IOPage'

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
        }
      ]
    }
  ]
})
