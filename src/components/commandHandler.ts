import eventBus from '../utils/eventBus';

// Handle the commands passed to here

export function handleCommand(command: string) {
    // First, parse all the commands. Multiple commands may exist and they are separated by semi-colons.
    const commands = command.split(';');
    
    for (const cmd of commands) {
        const [cmdType, layer, content] = cmd.split(',');
        if (cmdType === 'todo') {
            // The command format: "todo,[待办层级],[具体内容]"
            // Add a todo
            updateTodo(Number(layer), content);
        }
    }
}

function updateTodo(layer: number, content: string){
    // Update the todo list
    eventBus.emit('updateTodo', {'layer': layer, 'content': content});
}

