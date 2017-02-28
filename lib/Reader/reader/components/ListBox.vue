<template>
<div class="model-select-box">
  <div class="model-select-text" v-bind:value="selected.value">{{selected.text}}</div>
  <ul class="model-select-option">
    <li v-for="(option,index) in options" v-bind:value="option.value" v-on:click="select($index)" index="{{index}}">{{option.text}}</li>
  </ul>
</div>
</template>

<script>
module.exports = {
  data:{
    selected:{text:"",value:""},
    options:[
      {text:"1",value:"1"},
      {text:"2",value:"2"},
      {text:"3",value:"3"}
    ]
  },
  methods: {
    select:function (index){
      this.selected = this.options[index];
    }
  }
}
</script>

<style scoped>
.model-select-box { 
    width: 197px; 
    height: 27px; 
    line-height: 27px; 
    border: 1px solid #aaa; 
    float: left; 
    margin-right: 20px; 
    text-indent: 5px; 
    position: relative; 
}
.model-select-text { 
    height: 27px; 
    padding-right: 27px; 
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAIAAAACtmMCAAAAcklEQVRIx2PUmfqCgaqAibrGjZo4auIgM5EFU2iH/x8Iw2MjCx6duJRhcSNcBVwPSbZi9zV+Q/F7Amc44jKUYJjgixlMQ4kJYkaCpRmmx/HHGOHUg6Yfv3FEmYhsCkHjGLCmR2JcSqkbSQKjJo6aSD4AAEs2KXw/5kNCAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAABJRU5ErkJgggAA) no-repeat right 0; 
    cursor: pointer; 
    -moz-user-select: none; 
    -webkit-user-select: none; 
    user-select: none; 
}
.model-select-option { 
    display: none; 
    position: absolute; 
    background: #fff; 
    width: 100%; 
    left: -1px; 
    border: 1px solid #aaa; 
}
.model-select-option li { 
    height: 22px; 
    line-height: 22px; 
    color: #555; 
    cursor: pointer; 
}
.model-select-option li.seleced { 
    background: #06C; 
    color: #fff; 
}
</style>