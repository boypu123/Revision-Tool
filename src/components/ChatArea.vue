<script setup>
import { defineProps, computed } from 'vue';
import { marked } from 'marked';

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

const parseMarkdown = (content) => {
    return marked.parse(content);
};
</script>

<template>
    <div id="chat-history">
        <div 
            v-for="(msg, index) in chatHistory" 
            :key="index" 
            id="chat-message"
            :style="{
                 backgroundColor: msg.role === 'assistant' ? '#2a2a2a' : '#4f6eca',
                 borderRadius: msg.role === 'assistant' ? '16px 16px 16px 0px' : '16px 16px 0px 16px'
                }"
        >
            <strong>{{ msg.role === 'assistant' ? 'DeepSeek' : '你' }}:</strong> 
            <div class="markdown-content" v-html="parseMarkdown(msg.role === 'assistant' ? msg.content[1] : msg.content)"></div>
        </div>
        <div v-if="isThinking">DeepSeek正在思考...</div>
    </div>
</template>

<style scoped>

#chat-history {
    overflow-y: auto; /* 允许垂直滚动 */
    height: calc(100% - 60px); /* 减去标题和输入框的高度 */
    background-color: #1a1a1a;
    padding: 10px; /* 添加内边距 */
}

#chat-message {
    padding: 10px;
    border-radius: 5px;
    margin: 10px;
    background-color: #2a2a2a; /* 作为默认值 */
}

.markdown-content {
    color: inherit;
    line-height: 1.6;
}

.markdown-content >>> pre {
    background-color: #333;
    padding: 15px;
    border-radius: 6px;
    overflow-x: auto;
}

.markdown-content >>> code {
    font-family: 'Courier New', monospace;
    background-color: #333;
    padding: 2px 4px;
    border-radius: 3px;
}

.markdown-content >>> a {
    color: #4f9bca;
    text-decoration: underline;
}

</style>

