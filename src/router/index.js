import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import Test from '@/components/Test'
import MoveForm from '@/components/MoveForm'
import IfForm from '@/components/IfForm'
import SightForm from '@/components/SightForm'
import FlowCanvas from '@/components/FlowCanvas'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      path: '/test',
      name: 'Test',
      component: Test
    },
    {
      path: '/moveForm',
      name: 'MoveForm',
      component: MoveForm
    },
    {
      path: '/ifForm',
      name: 'IfForm',
      component: IfForm
    },
    {
      path: '/SightForm',
      name: 'SightForm',
      component: SightForm
    },
    {
      path: '/FlowCanvas',
      name: 'FlowCanvas',
      component: FlowCanvas
    }
  ]
})
