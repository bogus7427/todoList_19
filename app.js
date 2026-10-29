const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const todoCount = document.querySelector("#todo-count");
const emptyState = document.querySelector("#empty-state");
const message = document.querySelector("#message");

const STORAGE_KEY = "daily-note";

function loadTodos() {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    if (savedTodos === null) return [];

    const parsedTodos = JSON.parse(savedTodos);
    if (
      !Array.isArray(parsedTodos) ||
      parsedTodos.some(
        (todo) =>
          !todo ||
          typeof todo.id !== "string" ||
          typeof todo.text !== "string" ||
          typeof todo.completed !== "boolean",
      )
    ) {
      throw new Error("저장된 할 일의 형식이 올바르지 않습니다.");
    }

    return parsedTodos;
  } catch (error) {
    console.error("할 일을 불러오지 못했습니다.", error);
    message.textContent = "저장된 할 일을 불러오지 못했어요.";
    return [];
  }
}

let todos = loadTodos();

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch (error) {
    console.error("할 일을 저장하지 못했습니다.", error);
    message.textContent =
      "할 일을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.";
    return false;
  }
}

function renderTodos() {
  todoList.replaceChildren();

  const remainingTodos = todos.filter((todo) => !todo.completed).length;
  todoCount.textContent = `${remainingTodos}개 남음`;
  emptyState.hidden = todos.length > 0;

  todos.forEach(function (todo) {
    const item = document.createElement("li");
    item.className = "todo-item";
    if (todo.completed) item.classList.add("completed");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `${todo.text} 완료 여부`);
    checkbox.addEventListener("change", function () {
      todo.completed = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "text-button";
    editButton.textContent = "수정";
    editButton.addEventListener("click", function () {
      const editInput = item.querySelector(".edit-input");
      if (!editInput) {
        const editor = document.createElement("input");
        editor.type = "text";
        editor.className = "edit-input";
        editor.maxLength = 100;
        editor.value = todo.text;
        text.replaceWith(editor);
        editButton.textContent = "저장";
        editor.focus();
        editor.addEventListener("keydown", function (event) {
          if (event.key === "Enter") editButton.click();
          if (event.key === "Escape") renderTodos();
        });
        return;
      }

      const trimmedText = editInput.value.trim();
      if (!trimmedText) {
        message.textContent = "할 일은 빈칸으로 저장할 수 없어요.";
        editInput.focus();
        return;
      }

      todo.text = trimmedText;
      message.textContent = "";
      saveTodos();
      renderTodos();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "text-button delete-button";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", function () {
      todos = todos.filter(function (currentTodo) {
        return currentTodo.id !== todo.id;
      });
      saveTodos();
      renderTodos();
    });

    item.append(checkbox, text, editButton, deleteButton);
    todoList.append(item);
  });
}

todoForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const text = todoInput.value.trim();
  if (!text) {
    message.textContent = "할 일을 입력해 주세요.";
    todoInput.focus();
    return;
  }

  todos.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: text,
    completed: false,
  });

  message.textContent = "";
  saveTodos();
  renderTodos();
  todoInput.value = "";
  todoInput.focus();
});

renderTodos();
