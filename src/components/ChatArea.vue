<script setup>
import { defineProps } from 'vue';

// This is a component of WithDeepseek.vue, it receives chatHistory and isThinking as props
const props = defineProps({
    chatHistory: {
        type: Array,
        required: true
    },
    isThinking: {
        type: Boolean,
        required: true
    }
});

</script>

<template>
    <div id="chat-history">
        <div v-for="(msg, index) in chatHistory" :key="index">
            <strong>{{ msg.role }}:</strong> 
            {{ msg.role === 'assistant' ? msg.content[1] : msg.content }}
        </div>
        <div v-if="isThinking">DeepSeek正在思考...</div>
    </div>
</template>

<style scoped>
/* It just couldn't scroll - I don't know why */
#chat-history {
    overflow-y: auto; /* 允许垂直滚动 */
    height: calc(100% - 60px); /* 减去标题和输入框的高度 */
    background-color: #1a1a1a;
    padding: 10px; /* 添加内边距 */
}
</style>

