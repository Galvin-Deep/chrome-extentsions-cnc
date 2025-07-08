let items = [];
let editingIndex = null;
let isSettingsViewVisible = false;

document.addEventListener('DOMContentLoaded', () => {
  loadItems();
  document.getElementById("saveBtn").addEventListener("click", saveItem);
  document.getElementById("updateBtn").addEventListener("click", updateItem);
  document.getElementById("settingsBtn").addEventListener("click", toggleSettingsView);
});

function toggleSettingsView() {
  isSettingsViewVisible = !isSettingsViewVisible;
  const settingsView = document.getElementById('settingsView');
  settingsView.style.display = isSettingsViewVisible ? 'block' : 'none';
  renderList();
}

function loadItems() {
  chrome.storage.local.get(["items"], (result) => {
    items = result.items || [];
    renderList();
  });
}

function saveItem() {
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  let index = parseInt(document.getElementById("index").value.trim());

  if (!title || !content || isNaN(index)) return alert("请填写完整信息");

  if (items.some(i => i.index === index)) {
    alert("该序号已被占用");
    return;
  }

  items.push({ title, content, index });
  saveAndReload();
}

function updateItem() {
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  let index = parseInt(document.getElementById("index").value.trim());

  if (!title || !content || isNaN(index)) return alert("请填写完整信息");

  if (items.some((i, idx) => i.index === index && idx !== editingIndex)) {
    alert("该序号已被占用");
    return;
  }

  items[editingIndex] = { title, content, index };
  saveAndReload();
}

function saveAndReload() {
  items.sort((a, b) => a.index - b.index);
  chrome.storage.local.set({ items }, () => {
    clearForm();
    loadItems();
  });
}

function renderList() {
  const listDiv = document.getElementById("contentList");
  listDiv.innerHTML = "";

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    const titleSpan = document.createElement("span");
    titleSpan.className = "item-title";
    titleSpan.textContent = item.title;
    div.appendChild(titleSpan);

    div.addEventListener("click", (e) => {
      if (e.target !== titleSpan) return;
      navigator.clipboard.writeText(item.content).then(() => {
        const originalText = titleSpan.textContent;
        titleSpan.textContent = "Copied!";
        setTimeout(() => {
          titleSpan.textContent = originalText;
        }, 1000);
      }).catch(err => {
        console.error('Could not copy text: ', err);
        alert("Copy failed");
      });
    });

    if (isSettingsViewVisible) {
      const btnContainer = document.createElement("div");
      btnContainer.className = "item-buttons";

      const editBtn = document.createElement("button");
      editBtn.textContent = "编辑";
      editBtn.className = "edit-btn";
      editBtn.onclick = (e) => {
        e.stopPropagation();
        editingIndex = index;
        document.getElementById("title").value = item.title;
        document.getElementById("content").value = item.content;
        document.getElementById("index").value = item.index;
        document.getElementById("saveBtn").style.display = "none";
        document.getElementById("updateBtn").style.display = "inline-block";
      };

      const delBtn = document.createElement("button");
      delBtn.textContent = "删除";
      delBtn.className = "delete-btn";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm("确定删除？")) {
          items.splice(index, 1);
          saveAndReload();
        }
      };

      btnContainer.appendChild(editBtn);
      btnContainer.appendChild(delBtn);
      div.appendChild(btnContainer);
    }

    listDiv.appendChild(div);
  });
}

function clearForm() {
  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
  document.getElementById("index").value = "";
  document.getElementById("saveBtn").style.display = "block";
  document.getElementById("updateBtn").style.display = "none";
  editingIndex = null;
}
