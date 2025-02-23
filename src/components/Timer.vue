<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import emitter from '../utils/eventBus'

const focusDuration = 25 * 60; // 25分钟
const breakDuration = 5 * 60; // 5分钟
const longBreakDuration = 25 * 60; // 25分钟长休息
const maxFocusSessions = 4; // 最大专注次数
const timeLeft = ref(focusDuration);
const isActive = ref(false);
const isBreak = ref(false);
const anxietyLevel = ref(0);
const distractionCount = ref(0); // 分心次数
const focusTime = ref(0); // 记录专注时间
const focusSessions = ref(0); // 记录专注次数
let timer: ReturnType<typeof setInterval>;
let timeoutId: ReturnType<typeof setTimeout> | null = null; // 添加定时器引用

// 从 localStorage 加载数据
const loadData = () => {
  const storedAnxiety = localStorage.getItem('anxietyLevel');
  const storedDistraction = localStorage.getItem('distractionCount');
  const storedFocusTime = localStorage.getItem('focusTime');
  const storedDate = localStorage.getItem('lastResetDate');

  if (storedDate !== new Date().toLocaleDateString()) {
    // 如果不是今天，重置数据
    localStorage.setItem('anxietyLevel', '0');
    localStorage.setItem('distractionCount', '0');
    localStorage.setItem('focusTime', '0');
    localStorage.setItem('lastResetDate', new Date().toLocaleDateString());
  } else {
    anxietyLevel.value = parseInt(storedAnxiety ?? '0') || 0;
    distractionCount.value = parseInt(storedDistraction ?? '0') || 0;
    focusTime.value = parseInt(storedFocusTime ?? '0') || 0;
  }
};

const saveData = () => {
  localStorage.setItem('anxietyLevel', anxietyLevel.value.toString());
  localStorage.setItem('distractionCount', distractionCount.value.toString());
  localStorage.setItem('focusTime', focusTime.value.toString());
};

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60);
  const seconds = timeLeft.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const startTimer = () => {
  if (isActive.value) return;
  isActive.value = true;
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      clearInterval(timer);
      isActive.value = false;
      if (!isBreak.value) {
        focusTime.value += focusDuration / 60; // 增加专注时间
        focusSessions.value++; // 增加专注次数
        saveData(); // 保存数据
        if (focusSessions.value >= maxFocusSessions) {
          alert('时间到！长休息时间开始！');
          isBreak.value = true;
          timeLeft.value = longBreakDuration; // 切换到长休息时间
          focusSessions.value = 0; // 重置专注次数
        } else {
          alert('时间到！休息时间开始！');
          isBreak.value = true;
          timeLeft.value = breakDuration; // 切换到短休息时间
        }
      } else {
        alert('休息时间结束！专注时间开始！');
        isBreak.value = false;
        timeLeft.value = focusDuration; // 切换到专注时间
      }
      startTimer(); // 自动开始下一个阶段
    }
  }, 1000);
};

const stopTimer = () => {
  clearInterval(timer);
  isActive.value = false;
};

const resetTimer = () => {
  clearInterval(timer);
  timeLeft.value = focusDuration;
  isActive.value = false;
  isBreak.value = false;
  focusTime.value = 0; // 重置专注时间
  focusSessions.value = 0; // 重置专注次数
};

const incrementDistraction = () => {
  distractionCount.value++;
  saveData(); // 保存数据
  sendMessage('分心次数 +1')
};

const decrementDistraction = () => {
  if (distractionCount.value > 0) {
    distractionCount.value--;
    saveData(); // 保存数据
  }
};

const nextPhase = () => {
  if (isBreak.value) {
    timeLeft.value = focusDuration; // 跳到专注时间
    isBreak.value = false;
  } else {
    timeLeft.value = breakDuration; // 跳到休息时间
    isBreak.value = true;
  }
  if (isActive.value) {
    stopTimer(); // 停止当前计时器
    startTimer(); // 启动新的计时器
  }
};

const startLongBreak = () => {
  if (!isActive.value) {
    isBreak.value = true;
    timeLeft.value = longBreakDuration; // 直接开始长休息
    startTimer(); // 启动计时器
  }
};

const handleAnxietyChange = () => {
  if (timeoutId) clearTimeout(timeoutId); // 清除之前的定时器
  timeoutId = setTimeout(() => {
    sendMessage(`现在的焦虑等级是：${anxietyLevel.value}`);
  }, 3000); // 3秒后执行
};

function sendMessage(message: string) {
    emitter.emit('sendMessage', message)
}

onMounted(() => {
  loadData(); // 加载数据
  timeLeft.value = focusDuration; // 初始化时间
});

onBeforeUnmount(() => {
  clearInterval(timer); // 清理定时器
  if (timeoutId) clearTimeout(timeoutId); // 新增清理防抖定时器
  saveData(); // 保存数据
});
</script>

<template>
  <div class="timer-container">
    <h2>番茄钟</h2>
    <div class="phase-indicator">{{ isBreak ? '休息时间' : '工作时间' }}</div>
    <div class="timer-display">{{ formattedTime }}</div>
    <button @click="startTimer" v-if="!isActive && !isBreak">开始</button>
    <button @click="stopTimer" v-if="isActive">停止</button>
    <button @click="resetTimer">重置</button>
    <button @click="nextPhase">下一个阶段</button>
    <button @click="startLongBreak" v-if="!isActive">开始长休息</button>
    <div class="anxiety-scale">
      <label for="anxiety">焦虑等级:</label>
      <input 
        type="range" 
        id="anxiety" 
        v-model="anxietyLevel" 
        min="0" 
        max="100"
        @input="handleAnxietyChange" 
      />
      <span>{{ anxietyLevel }}</span>
    </div>
    <div class="distraction-counter">
      <h3>分心次数: {{ distractionCount }}</h3>
      <button @click="incrementDistraction">分心 +1</button>
      <button @click="decrementDistraction">分心 -1</button>
    </div>
    <div class="focus-time">
      <h3>专注时间: {{ focusTime }} 分钟 &nbsp; 自从长休息之后已经过了：{{ focusSessions }} 次休息圈</h3>
    </div>
  </div>
</template>

<style scoped>
.timer-container {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 8px;
  color: #fff;
  text-align: center;
}

.phase-indicator {
  font-size: 1.5em; /* 增加阶段指示器字体大小 */
  margin: 10px 0;
}

.timer-display {
  font-size: 3em; /* 增加时间显示字体大小 */
  margin: 20px 0;
}

.anxiety-scale {
  margin-top: 20px;
}

.distraction-counter {
  margin-top: 20px;
}

.focus-time {
  margin-top: 20px;
}
</style>