const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const fontSelect = document.getElementById("font-select");
const fontSizeInput = document.getElementById("font-size");
const boldButton = document.getElementById("bold");
const italicButton = document.getElementById("italic");
const textInputBox = document.getElementById("text-input-box");
const textInput = document.getElementById("text-input");
const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");
const deleteButton = document.getElementById("delete");
const shapeButtons = {
  rectangle: document.getElementById("rectangle"),
  circle: document.getElementById("circle"),
  line: document.getElementById("line"),
  arrow: document.getElementById("arrow"),
};

let texts = [];
let redoStack = [];
let inputPosition = { x: 0, y: 0 };
let isBold = false;
let isItalic = false;
let draggingTextIndex = null;
let selectedTextIndex = null;
let dragOffset = { x: 0, y: 0 };
let currentShape = null;
let isDrawing = false;
let startX, startY;

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = isDark ? "#ffffff" : "#000000";
  ctx.strokeStyle = isDark ? "#ffffff" : "#000000";

  texts.forEach((obj) => {
    if (obj.type) {
      drawShape(obj.type, obj.start, obj.end);
      saveState();
    } else {
      ctx.font = `${obj.isItalic ? "italic" : ""} ${obj.isBold ? "bold" : ""} ${
        obj.fontSize
      }px ${obj.font}`;
      ctx.fillText(obj.text, obj.x, obj.y);
    }
  });
}

function saveState() {
  redoStack = [];
  texts = structuredClone
    ? structuredClone(texts)
    : JSON.parse(JSON.stringify(texts));
}

function addTextAtPosition(text, x, y) {
  const font = fontSelect.value;
  const fontSize = Math.max(10, parseInt(fontSizeInput.value, 10)) || 20;
  texts.push({ text, font, fontSize, x, y, isBold, isItalic });
  saveState();
  drawCanvas();
}

function getSelectedTextIndex(x, y) {
  return texts.findIndex(
    (textObj) =>
      x >= textObj.x &&
      x <= textObj.x + ctx.measureText(textObj.text).width &&
      y <= textObj.y &&
      y >= textObj.y - textObj.fontSize
  );
}

function updateDeleteButtonState() {
  if (selectedTextIndex !== null) {
    deleteButton.disabled = false;
    deleteButton.classList.remove("disabled");
  } else {
    deleteButton.disabled = true;
    deleteButton.classList.add("disabled");
  }
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const selectedIndex = getSelectedTextIndex(x, y);

  if (selectedIndex === -1) {
    inputPosition = { x, y };
    textInputBox.style.display = "block";
    textInputBox.style.left = `${e.clientX}px`;
    textInputBox.style.top = `${e.clientY}px`;
    textInput.value = "";
    textInput.focus();
  }
});

// Clean mousedown to handle only dragging
canvas.addEventListener("mousedown", (e) => {
  if (currentShape) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const selectedIndex = getSelectedTextIndex(x, y);

  if (selectedIndex !== -1) {
    selectedTextIndex = selectedIndex;
    draggingTextIndex = selectedIndex;
    dragOffset.x = x - texts[selectedIndex].x;
    dragOffset.y = y - texts[selectedIndex].y;
  } else {
    selectedTextIndex = null;
  }

  updateDeleteButtonState();
});

canvas.addEventListener("click", (e) => {
  if (!currentShape && !isDrawing) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const selectedIndex = getSelectedTextIndex(x, y);

    if (selectedIndex === -1) {
      inputPosition = { x, y };
      textInputBox.style.display = "block";
      textInputBox.style.left = `${e.clientX}px`;
      textInputBox.style.top = `${e.clientY}px`;
      textInput.value = "";
      textInput.focus();
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing && currentShape) {
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    drawCanvas();
    drawShape(
      currentShape,
      { x: startX, y: startY },
      { x: currentX, y: currentY }
    );
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (draggingTextIndex !== null) {
    const draggedText = texts[draggingTextIndex];
    draggedText.x = Math.max(
      0,
      Math.min(
        canvas.width - ctx.measureText(draggedText.text).width,
        x - dragOffset.x
      )
    );
    draggedText.y = Math.max(
      draggedText.fontSize,
      Math.min(canvas.height, y - dragOffset.y)
    );
    drawCanvas();
  } else {
    const hoveredIndex = getSelectedTextIndex(x, y);
    canvas.style.cursor = hoveredIndex !== -1 ? "pointer" : "default";
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (isDrawing && currentShape) {
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    texts.push({
      type: currentShape,
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
    });

    isDrawing = false;
    saveState();
    drawCanvas();
    return;
  }
  draggingTextIndex = null;
});

textInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const text = textInput.value.trim();
    if (text) {
      addTextAtPosition(text, inputPosition.x, inputPosition.y);
      textInputBox.style.display = "none";
    }
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    textInputBox.style.display = "none";
  }
});

boldButton.addEventListener("click", () => {
  isBold = !isBold;
  boldButton.classList.toggle("active", isBold);
});

italicButton.addEventListener("click", () => {
  isItalic = !isItalic;
  italicButton.classList.toggle("active", isItalic);
});

undoButton.addEventListener("click", () => {
  if (texts.length > 0) {
    redoStack.push(
      structuredClone
        ? structuredClone(texts)
        : JSON.parse(JSON.stringify(texts))
    );
    texts.pop();
    drawCanvas();
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    texts = redoStack.pop();
    drawCanvas();
  }
});

deleteButton.addEventListener("click", () => {
  if (selectedTextIndex !== null) {
    texts.splice(selectedTextIndex, 1);
    selectedTextIndex = null;
    saveState();
    drawCanvas();
    updateDeleteButtonState();
  }
});

const themeToggle = document.getElementById("theme-toggle");
let isDark = false;

themeToggle.addEventListener("click", () => {
  isDark = !isDark;
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light"
  );
  ctx.fillStyle = isDark ? "#ffffff" : "#000000";
  drawCanvas();
});

function drawShape(shape, start, end) {
  ctx.beginPath();
  ctx.lineWidth = 2;

  switch (shape) {
    case "rectangle":
      const width = end.x - start.x;
      const height = end.y - start.y;
      ctx.rect(start.x, start.y, width, height);
      break;
    case "circle":
      const radius = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      break;
    case "line":
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      break;
    case "arrow":
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLength = 20;

      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      ctx.lineTo(
        end.x - headLength * Math.cos(angle - Math.PI / 6),
        end.y - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLength * Math.cos(angle + Math.PI / 6),
        end.y - headLength * Math.sin(angle + Math.PI / 6)
      );
      break;
  }
  ctx.stroke();

  ctx.closePath();
}

Object.entries(shapeButtons).forEach(([shape, button]) => {
  button.addEventListener("click", () => {
    currentShape = currentShape === shape ? null : shape;
    Object.values(shapeButtons).forEach((btn) =>
      btn.classList.remove("active")
    );
    if (currentShape) {
      button.classList.add("active");
    }
  });
});
