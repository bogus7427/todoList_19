const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");

// 할 일 데이터는 배열로 관리하고, 목록은 localStorage에서 복원합니다.
let todos = JSON.parse(localStorage.getItem("daily-note") || "[]");

function renderTodos() {
  todoList.replaceChildren();

  todos.forEach(function (todo) {
    const item = document.createElement("li");
    item.textContent = todo.text;
    todoList.append(item);
  });
}

renderTodos();

todoForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const text = todoInput.value.trim();
  if (!text) return;

  const newTodo = {
    id: Date.now().toString() + "-" + Math.random().toString(36).slice(2, 8),
    text: text,
    completed: false,
  };

  todos.push(newTodo);
  localStorage.setItem("daily-note", JSON.stringify(todos));
  renderTodos();
  todoInput.value = "";
  todoInput.focus();
});
