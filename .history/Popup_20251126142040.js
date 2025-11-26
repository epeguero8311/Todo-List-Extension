let todos = [];
let currentFilter = 'all';

// DOM elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const todoCount = document.getElementById('todoCount');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompleted');

// Load todos from storage
chrome.storage.local.get(['todos'], (result) => {
  if (result.todos) {
    todos = result.todos;
    renderTodos();
  }
});

// Save todos to storage
function saveTodos() {
  chrome.storage.local.set({ todos });
  updateStats();
}

// Add todo
function addTodo() {
  const text = todoInput.value.trim();
  if (text === '') return;

  const todo = {
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: new Date().toISOString()
  };

  todos.unshift(todo);
  todoInput.value = '';
  saveTodos();
  renderTodos();
}

// Toggle todo completion
function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
    renderTodos();
  }
}

// Delete todo
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

// Clear completed todos
function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  saveTodos();
  renderTodos();
}

// Filter todos
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

// Update stats
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

// Render todos
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
      li.innerHTML = `
        <div class="checkbox ${todo.completed ? 'checked' : ''}" data-id="${todo.id}"></div>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <button class="delete-btn" data-id="${todo.id}">✕</button>
      `;
      todoList.appendChild(li);
    });
  }

  updateStats();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addTodo();
  }
});

todoList.addEventListener('click', (e) => {
  if (e.target.classList.contains('checkbox')) {
    const id = parseInt(e.target.dataset.id);
    toggleTodo(id);
  } else if (e.target.classList.contains('delete-btn')) {
    const id = parseInt(e.target.dataset.id);
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

// Focus input on load
todoInput.focus();