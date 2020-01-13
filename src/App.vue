<template>
  <div id="app">
    <TopMenu/>
    <router-view/>
  </div>
</template>

<script>
import TopMenu from '@/components/Header'
export default {
  name: 'App',
  components: {
    TopMenu
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  color: #2c3e50;
  /* margin-top: 60px; */

}
body{
  margin: 0;
  padding: 0;
}
</style>
