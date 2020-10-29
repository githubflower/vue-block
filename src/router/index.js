import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import Test from '@/components/Test'
import MoveForm from '@/components/MoveForm'
import IfForm from '@/components/IfForm'
import SightForm from '@/components/SightForm'
import FlowCanvas from '@/components/FlowCanvas'
import Demo from '@/components/Demo'
import DemoIndex from '@/components/demos/DemoIndex'
import PathAnimation from '@/components/demos/PathAnimation'
import StatePage from '@/components/demos/StatePage'
import IOPage from '@/components/IOPage'

Vue.use(Router)

export default new Router({
  routes: [
    /* {
      path: '*',
      redirect: '/demos/state'
    }, */
    {
      path: '/',
      name: 'page',
      component: DemoIndex,
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
