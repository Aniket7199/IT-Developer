const list = document.getElementById("list");

fetch("/tasks")
  .then(res => res.json())
  .then(tasks => {
    tasks.forEach(t => createTask(t));
  });

function createTask(task) {
  const li = document.createElement("li");
  li.textContent = task.title;
  li.draggable = true;
  li.dataset.id = task.id;
  li.dataset.status = task.status;
  li.onclick = () => toggle(task, li);
  list.appendChild(li);
}

function addTask() {
  fetch("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: taskInput.value })
  }).then(() => location.reload());
}

function toggle(task, el) {
  task.status = task.status === "pending" ? "completed" : "pending";
  el.style.textDecoration = task.status === "completed" ? "line-through" : "";
  save();
}

function save() {
  const data = [...list.children].map((li, i) => ({
    id: li.dataset.id,
    status: li.dataset.status,
    position: i
  }));
  fetch("/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}
