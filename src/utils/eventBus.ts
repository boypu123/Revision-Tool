import mitt from 'mitt'

// 创建mitt实例
const emitter = mitt()

// 导出可复用的发布订阅对象
export default emitter 