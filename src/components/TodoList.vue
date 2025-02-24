<template>
  <div id="todo-container">
    <h2>待办事项</h2>
    <div class="level-control">
      <button @click="changeLevel('down')">➡️ 增加层级</button>
      <button @click="changeLevel('up')">⬅️ 减少层级</button>
      <span>当前层级：{{ Math.max(0, currentLevel) + 1 }}</span>
    </div>
    <input v-model="newTask" placeholder="创建新的待办事项..." />
    <button @click="addTask">添加</button>
    <ul>
      <TaskItem 
        v-for="task in tasks" 
        :key="task.id" 
        :task="task" 
        @remove="removeTask"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted, onUnmounted } from 'vue';
import eventBus from '../utils/eventBus';

const STORAGE_KEY = 'todo-tasks';

onMounted(() => {
  eventBus.on('updateTodo', (data) => {
    currentLevel.value = data.layer;
    newTask.value = data.content;
    addTask();
    // Clear so it does not interfere with the next command
    newTask.value = '';
    currentLevel.value = 0;
  });
});

onUnmounted(() => {
  eventBus.off('updateTodo');
});

// 在script setup部分添加generateId函数
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// 从localStorage加载初始数据
const loadTasks = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  
  try {
    const parsed = JSON.parse(saved);
    return parsed.map((task: any) => ({
      id: task.id || generateId(),
      text: task.text || '未命名任务',
      completed: !!task.completed,
      children: Array.isArray(task.children) 
        ? task.children.map((child: any) => ({
            ...child,
            id: child.id || generateId(),
            level: Number(child.level) || 0,
            children: child.children || []
          }))
        : [],
      level: Number(task.level) || 0
    }));
  } catch (e) {
    console.error('数据加载失败:', e);
    return [];
  }
};

const newTask = ref('');
const tasks = ref<{ text: string; completed: boolean }[]>(loadTasks());
const currentLevel = ref<number>(0); // 明确指定类型

// 自动保存到localStorage
watchEffect(() => {
  try {
    const saveData = JSON.stringify(tasks.value, (key, value) => {
      return key === 'parent' ? undefined : value; // 避免循环引用
    });
    localStorage.setItem(STORAGE_KEY, saveData);
  } catch (e) {
    console.error('保存失败:', e);
  }
});

const addTask = () => {
  if (newTask.value.trim()) {
    const newTaskObj: TodoTask = {
      id: generateId(),
      text: newTask.value,
      completed: false,
      children: [],
      level: currentLevel.value
    };

    // 自动层级匹配逻辑
    if (currentLevel.value === 0) {
      tasks.value.push(newTaskObj)
    } else {
      const parent = findParent(tasks.value, currentLevel.value)
      if (parent) {
        parent.children.push(newTaskObj)
      } else {
        // 如果找不到父级，自动创建父级链
        let currentParent: TodoTask | null = null
        for (let l = currentLevel.value - 1; l >= 0; l--) {
          const tempParent = findParent(tasks.value, l + 1)
          if (tempParent) {
            currentParent = tempParent
            break
          }
        }
        if (currentParent) {
          currentParent.children.push(newTaskObj)
        } else {
          // 如果完全找不到父级，重置层级
          currentLevel.value = 0
          tasks.value.push(newTaskObj)
        }
      }
    }
    // eventBus.emit('sendMessage', newTask.value + "待办已经添加，待办子母层级为" + (currentLevel.value + 1));
    newTask.value = ''
  }
}

const removeTask = (taskId: string) => {
  const removeFromTree = (tasks: TodoTask[]): TodoTask[] => {
    return tasks.filter(task => {
      if (task.id === taskId) return false
      if (task.children.length > 0) {
        task.children = removeFromTree(task.children)
      }
      return true
    })
  }
  tasks.value = removeFromTree(tasks.value)
}

const changeLevel = (direction: 'up' | 'down') => {
  const newLevel = direction === 'up' 
    ? currentLevel.value - 1 
    : currentLevel.value + 1;
  
  currentLevel.value = Math.max(0, newLevel);
};

// 改进的findParent方法
const findParent = (taskList: TodoTask[], targetLevel: number): TodoTask | null => {
  // 从最后一项开始查找最近的父级
  for (let i = taskList.length - 1; i >= 0; i--) {
    const task = taskList[i]
    if (task.level === targetLevel - 1) return task
    if (task.children.length > 0) {
      const found = findParent(task.children, targetLevel)
      if (found) return found
    }
  }
  return null
}

</script>

<style scoped>
#todo-container {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 8px;
  color: #fff;
}

.level-control {
  margin: 10px 0;
  padding: 8px;
  background: #2a2a2a;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.level-control button {
  padding: 6px 12px;
  background: #3a3a3a;
  border: 1px solid #4a4a4a;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.level-control button:hover {
  background: #4a4a4a;
}

.level-control span {
  color: #888;
}

.todo-list {
  /* 其他样式 */
}

.todo-item {
  margin: 5px 0; /* 调整每个项之间的间距 */
  padding: 5px; /* 可选：调整内边距 */
}
</style>

<script lang="ts">
import { defineComponent, h, VNode } from 'vue';
import type { PropType } from 'vue';

interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  children: TodoTask[];
  level: number;
}

const TaskItem = defineComponent({
  props: {
    task: {
      type: Object as PropType<TodoTask>,
      required: true
    }
  },
  setup(props, { emit }): () => VNode {
    return () => h('li', {
      style: { 
        marginLeft: `${(props.task.level - 1) * 20}px`,
        transition: 'margin 0.3s ease',
        textDecoration: props.task.completed ? 'line-through' : 'none'
      }
    }, [
      h('input', {
        type: 'checkbox',
        checked: props.task.completed,
        onChange: () => {
          props.task.completed = !props.task.completed;
          eventBus.emit('sendMessage', props.task.text + "待办的状态已经调整为：" + (props.task.completed ? '已完成' : '未完成'));
        }
      }),
      props.task.text,
      h('button', {
        onClick: () => emit('remove', props.task.id)
      }, '删除'),
      (props.task.children?.length ?? 0) > 0 && h('ul', 
        props.task.children?.map(child => 
          h(TaskItem, {
            task: child,
            onRemove: (id: string) => emit('remove', id)
          })
        ) ?? []
      )
    ]);
  }
});
</script> 