<template>
    <div>
        <iframe :src="`/static/plugins/${$route.params.name}/index.html`" frameborder="0" width="100%" height="100%"></iframe>
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