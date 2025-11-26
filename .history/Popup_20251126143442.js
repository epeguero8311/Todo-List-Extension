let todos = [];
let currentFilter = 'all';

const todoInput = document.getElementById('todoInput');
const taskType = document.getElementById('taskType');
const goalInput = document.getElementById('goalInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const todoCount = document.getElementById('todoCount');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompleted');

taskType.addEventListener('change', () => {
  if (taskType.value === 'counter') {
    goalInput.classList.remove('hidden');
    goalInput.focus();
  } else {
    goalInput.classList.add('hidden');
  }
});

chrome.storage.local.get(['todos'], (result) => {
  if (result.todos) {
    todos = result.todos;
    renderTodos();
  }
});

function saveTodos() {
  chrome.storage.local.set({ todos });
  updateStats();
}

function addTodo() {
  const text = todoInput.value.trim();
  if (text === '') return;

  const type = taskType.value;
  
  if (type === 'counter') {
    const goal = parseInt(goalInput.value);
    if (!goal || goal < 1) {
      alert('Please enter a valid goal number');
      return;
    }
    
    const todo = {
      id: Date.now(),
      text: text,
      type: 'counter',
      current: 0,
      goal: goal,
      completed: false,
      createdAt: new Date().toISOString()
    };
    todos.unshift(todo);
  } else {
    const todo = {
      id: Date.now(),
      text: text,
      type: 'boolean',
      completed: false,
      createdAt: new Date().toISOString()
    };
    todos.unshift(todo);
  }

  todoInput.value = '';
  goalInput.value = '';
  taskType.value = 'boolean';
  goalInput.classList.add('hidden');
  
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo && todo.type === 'boolean') {
    todo.completed = !todo.completed;
    saveTodos();
    renderTodos();
  }
}

function incrementCounter(id) {
  const todo = todos.find(t => t.id === id);
  if (todo && todo.type === 'counter') {
    if (todo.current < todo.goal) {
      todo.current++;
      if (todo.current === todo.goal) {
        todo.completed = true;
      }
      saveTodos();
      renderTodos();
    }
  }
}

function decrementCounter(id) {
  const todo = todos.find(t => t.id === id);
  if (todo && todo.type === 'counter') {
    if (todo.current > 0) {
      todo.current--;
      todo.completed = false;
      saveTodos();
      renderTodos();
    }
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  saveTodos();
  renderTodos();
}

function filterTodos() {
  switch (currentFilter) {
    case 'active':
      return todos.filter(t => !t.completed);
    case 'completed':
      return todos.filter(t => t.completed);
    default:
      return todos;
  }
}

function updateStats() {
  const activeCount = todos.filter(t => !t.completed).length;
  const totalCount = todos.length;
  
  if (totalCount === 0) {
    todoCount.textContent = '0 tasks';
  } else if (activeCount === totalCount) {
    todoCount.textContent = `${totalCount} ${totalCount === 1 ? 'task' : 'tasks'}`;
  } else {
    todoCount.textContent = `${activeCount} of ${totalCount} active`;
  }
}

function renderTodos() {
  const filteredTodos = filterTodos();
  todoList.innerHTML = '';

  if (filteredTodos.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 11l3 3L22 4"></path>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
      </svg>
      <p>${currentFilter === 'completed' ? 'No completed tasks' : 
           currentFilter === 'active' ? 'No active tasks' : 
           'No tasks yet. Add one above!'}</p>
    `;
    todoList.appendChild(emptyState);
  } else {
    filteredTodos.forEach(todo => {
      const li = document.createElement('li');
      li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
      
      if (todo.type === 'counter') {
        const percentage = (todo.current / todo.goal) * 100;
        li.innerHTML = `
          <div class="counter-controls">
            <button class="counter-btn increment-btn" data-id="${todo.id}">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 4v8M4 8l4-4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="counter-btn decrement-btn" data-id="${todo.id}">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 12V4M4 8l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="counter-info">
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <div class="counter-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
              </div>
              <span class="counter-display">${todo.current}/${todo.goal}</span>
            </div>
          </div>
          <button class="delete-btn" data-id="${todo.id}">✕</button>
        `;
      } else {
        li.innerHTML = `
          <div class="checkbox ${todo.completed ? 'checked' : ''}" data-id="${todo.id}"></div>
          <span class="todo-text">${escapeHtml(todo.text)}</span>
          <button class="delete-btn" data-id="${todo.id}">✕</button>
        `;
      }
      
      todoList.appendChild(li);
    });
  }

  updateStats();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addTodo();
  }
});

goalInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addTodo();
  }
});

todoList.addEventListener('click', (e) => {
  const target = e.target.closest('button, .checkbox');
  if (!target) return;

  if (target.classList.contains('checkbox')) {
    const id = parseInt(target.dataset.id);
    toggleTodo(id);
  } else if (target.classList.contains('increment-btn')) {
    const id = parseInt(target.dataset.id);
    incrementCounter(id);
  } else if (target.classList.contains('decrement-btn')) {
    const id = parseInt(target.dataset.id);
    decrementCounter(id);
  } else if (target.classList.contains('delete-btn')) {
    const id = parseInt(target.dataset.id);
    deleteTodo(id);
  }
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

clearCompletedBtn.addEventListener('click', () => {
  if (todos.some(t => t.completed)) {
    if (confirm('Clear all completed tasks?')) {
      clearCompleted();
    }
  }
});

todoInput.focus();