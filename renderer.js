(() => {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  ready(async () => {
    const api = window.messenger;
    const $ = id => document.getElementById(id);
    const els = {
      messages: $("messages"),
      composer: $("composer"),
      message: $("message"),
      attach: $("attach"),
      clearChat: $("clearChat"),
      board: $("board"),
      openBoard: $("openBoard"),
      closeBoard: $("closeBoard"),
      clearBoard: $("clearBoard"),
      sendBoard: $("sendBoard"),
      canvas: $("canvas"),
      color: $("color"),
      size: $("size")
    };

    let state = await api.load();
    if (!state || !Array.isArray(state.messages)) state = { messages: [] };

    const ctx = els.canvas.getContext("2d");
    let drawing = false;
    let last = null;

    function id() {
      return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    }

    function save() {
      return api.save(state);
    }

    function escapeText(text) {
      const span = document.createElement("span");
      span.textContent = text == null ? "" : String(text);
      return span.innerHTML;
    }

    function bytes(size) {
      if (!size) return "0 B";
      if (size < 1024) return `${size} B`;
      if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / 1048576).toFixed(1)} MB`;
    }

    function renderFile(file) {
      const wrap = document.createElement("div");
      wrap.className = "file";
      const url = api.fileUrl(file.storedName);

      if (file.category === "image") {
        const img = document.createElement("img");
        img.src = url;
        img.alt = file.name;
        wrap.append(img);
      } else if (file.category === "video") {
        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        wrap.append(video);
      } else if (file.category === "audio") {
        const audio = document.createElement("audio");
        audio.src = url;
        audio.controls = true;
        wrap.append(audio);
      } else {
        const name = document.createElement("strong");
        name.textContent = file.name;
        wrap.append(name);
      }

      const bar = document.createElement("div");
      bar.className = "filebar";
      bar.innerHTML = `<span>${escapeText(file.name)} · ${bytes(file.size)}</span>`;

      const buttons = document.createElement("span");
      const open = document.createElement("button");
      open.type = "button";
      open.textContent = "Open";
      open.addEventListener("click", () => api.openFile(file.storedName));

      const reveal = document.createElement("button");
      reveal.type = "button";
      reveal.textContent = "Show";
      reveal.addEventListener("click", () => api.revealFile(file.storedName));

      buttons.append(open, reveal);
      bar.append(buttons);
      wrap.append(bar);
      return wrap;
    }

    function render() {
      els.messages.textContent = "";
      if (!state.messages.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No messages yet.";
        els.messages.append(empty);
        return;
      }
      for (const msg of state.messages) {
        const row = document.createElement("article");
        row.className = "msg";
        if (msg.text) {
          const text = document.createElement("div");
          text.className = "text";
          text.textContent = msg.text;
          row.append(text);
        }
        for (const file of msg.files || []) row.append(renderFile(file));
        const time = document.createElement("time");
        time.dateTime = new Date(msg.createdAt).toISOString();
        time.textContent = new Date(msg.createdAt).toLocaleString();
        row.append(time);
        els.messages.append(row);
      }
      els.messages.scrollTop = els.messages.scrollHeight;
    }

    async function addMessage(text, files) {
      const clean = String(text || "").trim();
      if (!clean && (!files || !files.length)) return;
      state.messages.push({ id: id(), text: clean, files: files || [], createdAt: Date.now() });
      els.message.value = "";
      render();
      await save();
    }

    function resizeCanvas() {
      const rect = els.canvas.getBoundingClientRect();
      const old = document.createElement("canvas");
      old.width = els.canvas.width;
      old.height = els.canvas.height;
      old.getContext("2d").drawImage(els.canvas, 0, 0);
      const dpr = window.devicePixelRatio || 1;
      els.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      els.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (old.width) ctx.drawImage(old, 0, 0, old.width / dpr, old.height / dpr);
    }

    function clearCanvas() {
      const rect = els.canvas.getBoundingClientRect();
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    function point(event) {
      const rect = els.canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function start(event) {
      drawing = true;
      last = point(event);
      els.canvas.setPointerCapture(event.pointerId);
    }

    function move(event) {
      if (!drawing) return;
      const next = point(event);
      ctx.strokeStyle = els.color.value;
      ctx.lineWidth = Number(els.size.value);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
      last = next;
    }

    function stop(event) {
      drawing = false;
      last = null;
      if (els.canvas.hasPointerCapture(event.pointerId)) els.canvas.releasePointerCapture(event.pointerId);
    }

    els.composer.addEventListener("submit", event => {
      event.preventDefault();
      addMessage(els.message.value, []);
    });

    els.attach.addEventListener("click", async () => {
      const files = await api.pickFiles();
      await addMessage(els.message.value, files);
    });

    els.clearChat.addEventListener("click", async () => {
      state.messages = [];
      render();
      await save();
    });

    els.openBoard.addEventListener("click", () => {
      els.board.hidden = false;
      requestAnimationFrame(() => {
        resizeCanvas();
        clearCanvas();
      });
    });

    els.closeBoard.addEventListener("click", () => {
      els.board.hidden = true;
    });

    els.clearBoard.addEventListener("click", clearCanvas);

    els.sendBoard.addEventListener("click", async () => {
      const file = await api.saveCanvas(els.canvas.toDataURL("image/png"));
      if (file) await addMessage("", [file]);
      els.board.hidden = true;
    });

    els.canvas.addEventListener("pointerdown", start);
    els.canvas.addEventListener("pointermove", move);
    els.canvas.addEventListener("pointerup", stop);
    els.canvas.addEventListener("pointercancel", stop);
    els.canvas.addEventListener("pointerleave", event => { if (drawing) stop(event); });

    window.addEventListener("resize", () => {
      if (!els.board.hidden) resizeCanvas();
    });

    render();
  });
})();
