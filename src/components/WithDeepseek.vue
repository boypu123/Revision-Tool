<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted, onUnmounted } from 'vue';
import ChatArea from './ChatArea.vue';
import eventBus from '../utils/eventBus';
import emitter from '../utils/eventBus'

// 新增对话历史存储
const chatHistory = ref<Array<{ role: string; content: string }>>([]);
const userInput = ref<string>('');
const isThinking = ref(false); // 新增加载状态

// 新增文件内容存储
const fileContent = ref<string>('');

// 新增文件上传处理函数
async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    // 添加文件大小限制（5MB）
    if (file.size > 5 * 1024 * 1024) {
        alert('文件大小超过5MB限制');
        return;
    }

    try {
        isThinking.value = true;
        const text = await (file.type === 'application/pdf' 
            ? parsePDF(file) 
            : readTextFile(file));
        
        fileContent.value = text;
        let prompt = `我已上传文档：${file.name}，文档内容：${text}`
        chatHistory.value.push({ role: 'user', content: prompt });
        

    } catch (error) {
        console.error('文件读取失败:', error);
        alert('文件读取失败，请确保是文本文件或PDF');
    } finally {
        isThinking.value = false;
    }
}

// 文本文件读取
function readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// 修改PDF解析为使用pdfjs-dist的正确配置
async function parsePDF(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist');
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry.js');
    
    // 正确设置worker源
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
    }

    return text;
}

// 修改后的请求函数（添加 async/await）
async function requestDeepSeek(prompt: string) {
    try {
        // 添加空值校验
        if (!prompt.trim()) return;
        console.log(prompt)
        chatHistory.value.push({ role: 'user', content: prompt });
        isThinking.value = true;
        console.log(chatHistory.value)
        // 保持原有请求逻辑
        const response = await axios({
            method: 'POST',
            url: 'http://localhost:11434/api/generate',
            data: {
                model: 'deepseek-r1:14b',
                prompt: `Context: ${JSON.stringify(chatHistory.value)} Question: ${prompt} Answer:`,
                stream: false
            }
        });

        // 确保响应处理
        if (response.data?.response) {
            console.log(response.data)
            // Split the thinking part and the response part
            let str = response.data.response;
            str = str.slice("<think>".length);
            const parts = str.split(/<\/?think>/);
            // 如果parts[1]，assisstant传回的东西里面有任何</?command>，则将<command>里面的内容提取出来，然后执行

            if (parts[1].includes("<command>")) {
                const command = parts[1].split(/<\/?command>/);
                console.log(command)
            }

            
            chatHistory.value.push({
                role: 'assistant',
                content: parts
            });
        }
    } catch (error) {
        console.error('请求失败:', error);
        // 可以添加用户提示
        alert('请求失败，请检查控制台');
    } finally {
        isThinking.value = false;
    }
}

// First, give the context to it
let prompt = `
你是一个精通IB课程的ADHD学习教练，目的是为了帮助我，一个患有ADHD+焦虑症的INFJ复习，以准备即将到来的IB大考，请按照以下规则：
1. 每个任务必须包含动态emoji（如🎯⚡🔥）
2. 用游戏化描述（如「5分钟攻破向量堡垒」）
3. 使用较为中二化的语言对话
4. 响应模板：{情绪状态检测} ➔ {认知资源分配} ➔ {多模态反馈}
5. 所有如调整待办项等操作的指令必须以<command></command>包围，每条指令应该由英文分号(;)分割，具体的指令以及使用方法会在等会提出

你的任务包括：
1. 当用户提出复习内容时，请将复习内容分割成几个微小，容易完成，小于15分钟的卡片任务，降低启动阻力。如果用户有上传复习资料，请结合复习资料风格任务。每完成3个任务插入随机奖励提示。避免出现超过15分钟的任务
示例：
[8min] 向量点积速算5题
[5min] 楞次定律记忆卡
待办的操作指令：
"todo,[待办层级],[具体内容]"
比如说，创建一个名叫"数学复习"的母代办，并且想要在这个母待办下方创建"Sequences and Series刷5道Section B的题"的子待办，之后还要创建另一个"物理复习"的母待办，则需要输出在输出正常内容的时候同时操作待办项："<command>todo,1,数学复习;todo,2,Sequences and Series刷5道Section B的题;todo,1,物理复习"，这只是一个示例，你应该依照用户想要复习的内容自己整理出来一个大概的待办列表，然后再改动并使用这些指令
2. 一个待办完成之后，激励用户，无需进行任何指令操作
3. 如果用户的分心次数上升了：
(1-2次分心)：战术提醒，正向强化 + 即时奖励预告
(3次分心)：调用生物传感器数据增强紧迫感
(5次分心)：利用内向直觉的人格特质激发深层动机
分心时自动发送的苏格拉底式提问
"你正在逃避的任务中，最微小的可执行子步骤是什么？  
（例：只需打开笔记本 → 获得✨坚持点x1）"
## 神经多样性适配版本
"这个任务让你联想到哪个已掌握的技能？  
（ADHD优势：模式识别 → 建立积极联结）"
4. 如果用户的焦虑指数上升了，自动激活苏格拉底提问法
5. 不要照着我给你的示例抄，要自己想
如果你已经了解，请输出："你好！"只需要输出这句，不需要介绍功能，也不需要直接输出我给你的prompt,，如果用户要求介绍你的功能再总结prompt
`
// prompt="等会我会上传文档，请阅读文档，并总结内容"
requestDeepSeek(prompt)

// 修改发送函数
function sendMessage() {
    if (userInput.value !== "") { // 使用.value访问ref的值
        requestDeepSeek(userInput.value)
            .then(() => {
                userInput.value = '';
            })
            .catch(() => {
                userInput.value = '';
            });
    }
}

function handleMyEvent(message: string) {
    requestDeepSeek(message);
}

onMounted(() => {
  emitter.on('sendMessage', (event: unknown) => handleMyEvent(event as string))
})

onUnmounted(() => {
  // 组件卸载时记得移除事件监听，避免内存泄漏
  emitter.off('sendMessage', (event: unknown) => handleMyEvent(event as string))
})

</script>

<template>
    <div id="container">
        <h2>DeepSeek</h2>
        <!-- 消息列表 -->
        <div id="chat-area">
        <ChatArea :chatHistory="chatHistory" :isThinking="isThinking"/>
        </div>

        <div class="input-container">
            <input v-model="userInput" placeholder="输入你的问题..." />
            <div class="button-group">
                <button @click="sendMessage">发送</button>
                <label class="upload-btn">
                    📁 上传文档
                    <input 
                        type="file" 
                        accept=".txt,.pdf" 
                        @change="handleFileUpload"
                        style="display: none;"
                    >
                </label>
            </div>
        </div>
    </div>

</template>

<style scoped>
#container {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
}

#chat-area {
    height: calc(100% - 90px);
    flex: 1;/* 允许垂直滚动 */
    margin-top: 50px; /* 确保聊天区域不被标题遮挡 */
}

h2 {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: #1a1a1a;
    padding: 10px;
    margin: 0;
    z-index: 2;
}

.input-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: #1a1a1a;
    padding: 15px;
    z-index: 2;
}

.button-group {
    display: flex;
    gap: 10px;
}

.upload-btn {
    background: #4CAF50;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
}

.upload-btn:hover {
    background: #45a049;
}

input {
    width: 65%; /* 调整输入框宽度 */
}
</style>
