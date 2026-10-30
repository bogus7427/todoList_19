const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const todoCount = document.querySelector("#todo-count");
const emptyState = document.querySelector("#empty-state");
const message = document.querySelector("#message");
const listTitle = document.querySelector("#list-title");
const todayButton = document.querySelector("#today-button");
const yesterdayButton = document.querySelector("#yesterday-button");
const nameInput = document.querySelector("#name-input");
const nameEditButton = document.querySelector("#name-edit-button");
const titleOwner = document.querySelector("#title-owner");

const STORAGE_KEY = "daily-note";
const NAME_STORAGE_KEY = "daily-note-name";

function getDateKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const today = getDateKey();
const yesterday = getDateKey(-1);
let selectedDate = today;

function loadName() {
  try {
    return localStorage.getItem(NAME_STORAGE_KEY) || "";
  } catch (error) {
    console.error("이름을 불러오지 못했습니다.", error);
    message.textContent = "저장된 이름을 불러오지 못했어요.";
    return "";
  }
}

function updateName() {
  const name = nameInput.value.trim();
  titleOwner.textContent = name ? `${name}의` : "나의";

  try {
    if (name) {
      localStorage.setItem(NAME_STORAGE_KEY, name);
    } else {
      localStorage.removeItem(NAME_STORAGE_KEY);
    }
    message.textContent = "";
  } catch (error) {
    console.error("이름을 저장하지 못했습니다.", error);
    message.textContent =
      "이름을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.";
  }
}

nameInput.value = loadName();
if (nameInput.value) {
  titleOwner.textContent = `${nameInput.value}의`;
  nameInput.hidden = true;
  nameEditButton.hidden = false;
} else {
  titleOwner.textContent = "나의";
}
nameInput.addEventListener("input", updateName);
nameInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    updateName();
    if (nameInput.value.trim()) {
      nameInput.hidden = true;
      nameEditButton.hidden = false;
    }
  }
});
nameEditButton.addEventListener("click", function () {
  nameEditButton.hidden = true;
  nameInput.hidden = false;
  nameInput.focus();
  nameInput.select();
});

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

    let migrated = false;
    const todosWithDates = parsedTodos.map((todo) => {
      if (typeof todo.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(todo.date)) {
        return todo;
      }

      migrated = true;
      return { ...todo, date: today };
    });

    if (migrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todosWithDates));
    }

    return todosWithDates;
  } catch (error) {
    console.error("할 일을 불러오지 못했습니다.", error);
    message.textContent = "저장된 할 일을 불러오지 못했어요.";
    return [];
  }
}

let todos = loadTodos();

function getSelectedTodos() {
  return todos.filter((todo) => todo.date === selectedDate);
}

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

  const selectedTodos = getSelectedTodos();
  const remainingTodos = selectedTodos.filter((todo) => !todo.completed).length;
  todoCount.textContent = `${remainingTodos}개 남음`;
  emptyState.hidden = selectedTodos.length > 0;
  listTitle.textContent = selectedDate === today ? "오늘의 할 일" : "어제의 할 일";
  todayButton.classList.toggle("active", selectedDate === today);
  yesterdayButton.classList.toggle("active", selectedDate === yesterday);
  todayButton.setAttribute("aria-pressed", String(selectedDate === today));
  yesterdayButton.setAttribute("aria-pressed", String(selectedDate === yesterday));

  const emptyMessages =
    selectedDate === today
      ? ["아직 비어 있는 한 페이지", "첫 번째 할 일을 적어보세요."]
      : ["어제 기록한 할 일이 없어요.", "어제의 할 일을 추가하거나 확인할 수 있어요."];
  emptyState.querySelectorAll("p").forEach((paragraph, index) => {
    paragraph.textContent = emptyMessages[index];
  });

  selectedTodos.forEach(function (todo) {
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
      if (editInput) {
        renderTodos();
        return;
      }

      const editor = document.createElement("input");
      editor.type = "text";
      editor.className = "edit-input";
      editor.maxLength = 100;
      editor.value = todo.text;
      text.replaceWith(editor);
      editButton.insertAdjacentElement("afterend", editor);

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.className = "text-button";
      saveButton.textContent = "저장";
      saveButton.addEventListener("click", saveEdit);
      deleteButton.before(saveButton);

      function saveEdit() {
        const trimmedText = editor.value.trim();
        if (!trimmedText) {
          message.textContent = "수정 할 내용을 입렵해주세요.";
          editor.focus();
          return;
        }

        todo.text = trimmedText;
        message.textContent = "";
        saveTodos();
        renderTodos();
      }

      editor.focus();
      editor.addEventListener("keydown", function (event) {
        if (event.key === "Enter") saveEdit();
        if (event.key === "Escape") renderTodos();
      });
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

todayButton.addEventListener("click", function () {
  selectedDate = today;
  renderTodos();
});

yesterdayButton.addEventListener("click", function () {
  selectedDate = yesterday;
  renderTodos();
});

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
    date: selectedDate,
  });

  message.textContent = "";
  saveTodos();
  renderTodos();
  todoInput.value = "";
  todoInput.focus();
});

renderTodos();
