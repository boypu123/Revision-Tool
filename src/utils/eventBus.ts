import mitt from 'mitt'

type Events = {
  updateTodo: { layer: number; content: string };
  sendMessage: string; // 新增事件类型
  // 添加其他事件类型...
};

// 创建mitt实例
const emitter = mitt<Events>()

// 导出可复用的发布订阅对象
export default emitter 