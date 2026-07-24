const state = {
  posts: [],
  originalSlug: null,
  blocks: [],
  detailBlocks: [],
  assets: new Map(),
};

const form = document.querySelector("#post-form");
const fields = {
  title: document.querySelector("#title"),
  date: document.querySelector("#date"),
  summary: document.querySelector("#summary"),
  tags: document.querySelector("#tags"),
  preview: document.querySelector("#preview-source"),
  hasDetail: document.querySelector("#has-detail"),
  detailEditor: document.querySelector("#detail-editor"),
  status: document.querySelector("#save-status"),
  editorTitle: document.querySelector("#editor-title"),
};

function id() {
  return crypto.randomUUID();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function newBlock(type) {
  if (type === "text") return { id: id(), type, content: "" };
  if (type === "callout") return { id: id(), type, content: "" };
  if (type === "divider") return { id: id(), type };
  if (type === "code") {
    return { id: id(), type, language: "tsx", code: "" };
  }
  return { id: id(), type: "image", src: "", alt: "", caption: "" };
}

function setStatus(message, error = false) {
  fields.status.textContent = message;
  fields.status.dataset.error = String(error);
}

function addMenus() {
  const template = document.querySelector("#add-buttons");
  document.querySelectorAll(".add-menu").forEach((menu) => {
    menu.append(template.content.cloneNode(true));
    menu.addEventListener("click", (event) => {
      const button = event.target.closest("[data-add]");
      if (!button) return;
      const target = menu.dataset.target;
      state[target].push(newBlock(button.dataset.add));
      renderBlocks(target);
    });
  });
}

function blockInput(block, key, value) {
  block[key] = value;
}

function textArea(block, key, className = "") {
  const area = document.createElement("textarea");
  area.rows = key === "code" ? 8 : 5;
  area.className = className;
  area.value = block[key] ?? "";
  area.placeholder =
    block.type === "callout"
      ? "A short idea to emphasize."
      : block.type === "text"
        ? "Write a paragraph. Separate paragraphs with an empty line."
        : "Paste code here.";
  area.addEventListener("input", () => blockInput(block, key, area.value));
  return area;
}

function labeledInput(labelText, value, onInput, placeholder = "") {
  const label = document.createElement("label");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.value = value ?? "";
  input.placeholder = placeholder;
  input.addEventListener("input", () => onInput(input.value));
  label.append(input);
  return label;
}

function setImageFile(block, file) {
  if (!file) return;
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    setStatus("Use PNG, JPG, GIF, WebP, or AVIF images.", true);
    return;
  }
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  state.assets.set(cleanName, file);
  block.src = `./assets/${cleanName}`;
  renderBlocks("blocks");
  renderBlocks("detailBlocks");
}

function imageEditor(block) {
  const wrapper = document.createElement("div");
  const drop = document.createElement("label");
  drop.className = "image-drop";
  drop.textContent = block.src
    ? `Image: ${block.src.split("/").pop()} · click or drop to replace`
    : "Drop an image here or click to choose";
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png,image/jpeg,image/gif,image/webp,image/avif";
  input.addEventListener("change", () => setImageFile(block, input.files[0]));
  drop.append(input);
  for (const eventName of ["dragenter", "dragover"]) {
    drop.addEventListener(eventName, (event) => {
      event.preventDefault();
      drop.dataset.over = "true";
    });
  }
  for (const eventName of ["dragleave", "drop"]) {
    drop.addEventListener(eventName, (event) => {
      event.preventDefault();
      drop.dataset.over = "false";
    });
  }
  drop.addEventListener("drop", (event) => {
    setImageFile(block, event.dataTransfer.files[0]);
  });

  const options = document.createElement("div");
  options.className = "image-options";
  options.append(
    labeledInput("Alternative text", block.alt, (value) => {
      block.alt = value;
    }, "Describe the image"),
    labeledInput("Caption (optional)", block.caption, (value) => {
      block.caption = value;
    }),
  );
  wrapper.append(drop, options);
  return wrapper;
}

function codeEditor(block) {
  const wrapper = document.createElement("div");
  const options = document.createElement("div");
  options.className = "code-options";
  const language = document.createElement("label");
  language.textContent = "Language";
  const select = document.createElement("select");
  for (const option of ["tsx", "jsx", "typescript", "javascript", "css", "html", "json", "text"]) {
    const element = document.createElement("option");
    element.value = option;
    element.textContent = option;
    element.selected = block.language === option;
    select.append(element);
  }
  select.addEventListener("change", () => {
    block.language = select.value;
  });
  language.append(select);
  options.append(language);
  wrapper.append(options, textArea(block, "code", "block-code"));
  return wrapper;
}

function blockCard(block, target, index) {
  const card = document.createElement("div");
  card.className = "content-block";
  const head = document.createElement("div");
  head.className = "block-head";
  const type = document.createElement("span");
  type.className = "block-type";
  type.textContent = block.type;
  const actions = document.createElement("div");
  actions.className = "block-actions";
  for (const [label, action] of [
    ["↑", "up"],
    ["↓", "down"],
    ["Remove", "remove"],
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      const blocks = state[target];
      if (action === "remove") blocks.splice(index, 1);
      if (action === "up" && index > 0) {
        [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]];
      }
      if (action === "down" && index < blocks.length - 1) {
        [blocks[index + 1], blocks[index]] = [blocks[index], blocks[index + 1]];
      }
      renderBlocks(target);
    });
    actions.append(button);
  }
  head.append(type, actions);
  card.append(head);
  if (block.type === "text" || block.type === "callout") {
    card.append(textArea(block, "content"));
  } else if (block.type === "image") {
    card.append(imageEditor(block));
  } else if (block.type === "code") {
    card.append(codeEditor(block));
  } else {
    const note = document.createElement("div");
    note.className = "empty-blocks";
    note.textContent = "A divider will appear here.";
    card.append(note);
  }
  return card;
}

function renderBlocks(target) {
  const container = document.querySelector(
    target === "blocks" ? "#blocks" : "#detail-blocks",
  );
  container.replaceChildren();
  if (!state[target].length) {
    const empty = document.createElement("div");
    empty.className = "empty-blocks";
    empty.textContent = "Add a content block to begin.";
    container.append(empty);
    return;
  }
  state[target].forEach((block, index) => {
    container.append(blockCard(block, target, index));
  });
}

function renderPostList() {
  const list = document.querySelector("#post-list");
  list.replaceChildren();
  for (const post of state.posts) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.active = String(post.slug === state.originalSlug);
    const title = document.createElement("span");
    title.textContent = post.title;
    const date = document.createElement("small");
    date.textContent = post.date;
    button.append(title, date);
    button.addEventListener("click", () => loadPost(post));
    list.append(button);
  }
}

function resetEditor() {
  state.originalSlug = null;
  state.blocks = [newBlock("text")];
  state.detailBlocks = [];
  state.assets.clear();
  fields.title.value = "";
  fields.date.value = today();
  fields.summary.value = "";
  fields.tags.value = "";
  fields.preview.value = "";
  fields.hasDetail.checked = false;
  fields.detailEditor.hidden = true;
  fields.editorTitle.textContent = "New experiment";
  setStatus("");
  renderBlocks("blocks");
  renderBlocks("detailBlocks");
  renderPostList();
  fields.title.focus();
}

function loadPost(post) {
  state.originalSlug = post.slug;
  state.blocks = structuredClone(post.blocks ?? []);
  state.detailBlocks = structuredClone(post.detailBlocks ?? []);
  state.assets.clear();
  fields.title.value = post.title;
  fields.date.value = post.date;
  fields.summary.value = post.summary;
  fields.tags.value = (post.tags ?? []).join(", ");
  fields.preview.value = post.previewSource ?? "";
  fields.hasDetail.checked = state.detailBlocks.length > 0;
  fields.detailEditor.hidden = !fields.hasDetail.checked;
  fields.editorTitle.textContent = post.title;
  setStatus("");
  renderBlocks("blocks");
  renderBlocks("detailBlocks");
  renderPostList();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function fileData(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function save(event) {
  event.preventDefault();
  setStatus("Saving…");
  const assets = [];
  for (const [name, file] of state.assets) {
    assets.push({
      name,
      type: file.type,
      data: await fileData(file),
    });
  }

  const payload = {
    originalSlug: state.originalSlug,
    title: fields.title.value,
    date: fields.date.value,
    summary: fields.summary.value,
    tags: fields.tags.value,
    blocks: state.blocks,
    detailBlocks: fields.hasDetail.checked ? state.detailBlocks : [],
    previewSource: fields.preview.value,
    assets,
  };

  try {
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    state.originalSlug = result.slug;
    state.assets.clear();
    await loadPosts(false);
    setStatus("Saved. The local site will update automatically.");
  } catch (error) {
    setStatus(error.message ?? "Could not save experiment.", true);
  }
}

async function loadPosts(reset = true) {
  const response = await fetch("/api/posts");
  state.posts = await response.json();
  renderPostList();
  if (reset) resetEditor();
  else {
    const saved = state.posts.find((post) => post.slug === state.originalSlug);
    if (saved) loadPost(saved);
  }
}

fields.hasDetail.addEventListener("change", () => {
  fields.detailEditor.hidden = !fields.hasDetail.checked;
  if (fields.hasDetail.checked && !state.detailBlocks.length) {
    state.detailBlocks.push(newBlock("text"));
    renderBlocks("detailBlocks");
  }
});
fields.title.addEventListener("input", () => {
  fields.editorTitle.textContent = fields.title.value || "New experiment";
});
document.querySelector("#new-post").addEventListener("click", resetEditor);
form.addEventListener("submit", save);

addMenus();
loadPosts();
