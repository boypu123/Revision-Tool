<script setup lang="ts">
import WithDeepseek from './components/WithDeepseek.vue'
import Timer from './components/Timer.vue';
import TodoList from './components/TodoList.vue';
</script>

<template>
  <div class="todo-container">
    <TodoList />
  </div>
  <div class="timer-container">
    <Timer />
  </div>
  <div class="deepseek-container">
    <WithDeepseek id="withDeepseek"/>
  </div>
  
</template>

<style scoped>
.todo-container {
    position: fixed; /* 替代 relative */
    height: 60%;
    width: 50vw; /* 使用视口宽度单位 */
    background: #1a1a1a;
    left: 0;
    top: 0; /* 需要指定垂直位置 */
}
.deepseek-container {
    position: fixed; /* 固定定位 */
    bottom: 0;
    left: 0;
    right: 0;
    height: 40%; /* 严格固定高度 */
    background: #1a1a1a;
}
.timer-container {
    position: fixed; /* 固定定位 */
    top: 0; /* 修改为顶部 */
    right: 0; /* 保持在右侧 */
    width: 50vw;
    height: 60%; /* 严格固定高度 */
    background: #1a1a1a;
}
#withDeepseek {
    height: 100%; /* 继承容器高度 */
    width: 100%;
}
</style>
