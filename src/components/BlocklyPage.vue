<template>
    <div id="blocklyPage">
        <iframe :src="`/static/blockly/demos/code/index.html`" frameborder="0" width="100%" height="100%"></iframe>
    </div>
</template>
<script>
export default {
    name: 'BlocklyPage',
    data(){
        return {
            
        }
    }
}
</script>

<style lang="less" scoped>
@topMenuHeight: 60px;
#blocklyPage{
    height: 100%;
}
</style>