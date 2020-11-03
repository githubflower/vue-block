<template>
    <div>
        <iframe :src="`/static/plugins/${$route.params.name}/index.html`" frameborder="0" width="100%" height="100%"></iframe>
        <h1>test</h1>
        <h2>--{{$route.params.name}}</h2>
    </div>
</template>
<script>
export default {
    name: 'PluginIframe',
    data(){
        return {
            // path: `/static/plugins/${$route.params.name}/index.html`
        }
    }
}
</script>