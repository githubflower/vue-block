<template>
  <div class="menu-wrap">
    <ul v-if="showMenu" class="line-context-menu">
      <li
        v-for="(item, index) in menuData"
        :key="index"
        :type="item.type"
        @click="onItemClick($event, index)"
      >{{ item.desc }}</li>
    </ul>
    <el-form
      v-if="showForm"
      ref="form"
      :model="form"
      label-width="80px"
      style="background-color: #ffffff; width: 400px; padding: 5px; border-radius: 4px;"
    >
      <el-form-item label="事件描述">
        <el-input type="textarea" v-model="form.desc"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">确定</el-button>
        <el-button @click="showForm = false">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: "LineContextMenu",
  props: ['lineId', 'threadIndex', 'lineData', 'mustShowMenu'],
  data() {
    return {
      showMenu: true,
      //TODO: 添加一个新的boolean,判断是否关闭整个面板
      showForm: false,
      form: {
        desc: ""
      },
      menuData: [
        {
          desc: "触发事件描述",
          type: "editDesc"
        },
        {
          desc: "删除",
          type: "delete"
        }
      ],
    };
  },
  methods: {
    onItemClick(e, index) {
      let data = this.menuData[index];
      switch (data.type) {
        case "editDesc":
          this.showMenu = false;
          this.showForm = true;
          break;
        case "delete":
            this.showMenu = false;
            store.deleteLine({
                lineId: this.lineId,
                threadIndex: this.threadIndex,
            });
            //通知外层元素修改mustShowMenu为false
            this.$emit('toggleLineContextMenu', false);
          break;
        default:
        
        // pass through
      }
      e.stopPropagation();
      //   this.$emit('selectItem', this.menuData[index])
    },
    onSubmit() {
        //通知StatePage更新lineAry中对应的line对象的数据
        EventObj.$emit('updateLineData', {
            lineId: this.lineId,
            threadIndex: this.threadIndex,
            desc: this.form.desc
        });
        this.showForm = false;
    }
  },
  watch: {
      'mustShowMenu': function(v){
          if(v){
              this.showMenu = true;
              this.form.desc = this.lineData && this.lineData.desc;
          }
      }
  },
  created() {
    this.form.desc = this.lineData && this.lineData.desc;
  }
};
</script>

<style>
.menu-wrap {
  position: absolute;
  width: 0;
  z-index: 1;
}
.line-context-menu {
  /*  position: absolute;
  top: 0;
  left: 0; */
  width: 120px;
  border-radius: 4px;
  background-color: #ffffff;
}
.line-context-menu li {
  list-style: none;
  padding: 5px 10px;
}
.line-context-menu li:hover {
  background-color: #e6f7ff;
  cursor: pointer;
}
</style>