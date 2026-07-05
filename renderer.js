(() => {
  "use strict";

  /* Wait for DOM */
  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  onReady(async () => {
    const api = window.api;
    if (!api) { console.error("API bridge not found"); return; }

    const $ = id => document.getElementById(id);

    /* State */
    let state = { messages: [] };
    let settings = { darkMode: false, theme: "blue" };
    let ctxTarget = null;
    let searchHits = [], searchIdx = -1;
    let dragCounter = 0;
    let typingTimeout, toastTimer;
    let mediaRecorder, audioChunks = [], recordingStart, recordingTimer, isRecording = false;
    let drawing = false, lastPt = null, currentTool = "pen", strokes = 0;
    let editingId = null;

    /* Utilities */
    function uid() { try { return crypto.randomUUID(); } catch { return Date.now() + "-" + Math.random(); } }
    function esc(t) { const s = document.createElement("span"); s.textContent = t == null ? "" : String(t); return s.innerHTML; }
    function bytes(s) { if (!s) return "0 B"; if (s < 1024) return s + " B"; if (s < 1048576) return (s / 1024).toFixed(1) + " KB"; return (s / 1048576).toFixed(1) + " MB"; }
    function fmtTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    function fmtDate(ts) {
      const d = new Date(ts), now = new Date();
      if (d.toDateString() === now.toDateString()) return "Today";
      const y = new Date(now); y.setDate(y.getDate() - 1);
      if (d.toDateString() === y.toDateString()) return "Yesterday";
      return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    }

    function toast(msg) {
      const t = $("toast");
      if (!t) return;
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
    }

    function closeAll() {
      ["ctxMenu", "reactionPicker", "emojiPicker", "themePicker", "editModal"].forEach(id => {
        const el = $(id); if (el) el.hidden = true;
      });
    }
    document.addEventListener("click", closeAll);

    /* Save helpers */
    function save() { return api.save(state); }
    function saveCfg() { return api.saveSettings(settings); }

    /* Theme */
    function applyTheme() {
      document.body.classList.toggle("dark", !!settings.darkMode);
      document.body.className = document.body.className.replace(/theme-\S+/g, "");
      if (settings.theme && settings.theme !== "blue") document.body.classList.add("theme-" + settings.theme);
      const cb = $("settingDarkMode"); if (cb) cb.checked = !!settings.darkMode;
      document.querySelectorAll(".theme-dot").forEach(s => s.classList.toggle("active", s.dataset.theme === settings.theme));
      api.setTheme(settings.darkMode ? "dark" : "light");
    }

    /* Render messages */
    function render(scroll) {
      const msgs = $("messages");
      if (!msgs) return;
      msgs.innerHTML = "";
      const empty = $("emptyState");
      if (!state.messages.length) {
        if (empty) { msgs.append(empty); empty.hidden = false; }
        return;
      }
      if (empty) empty.hidden = true;
      let lastDate = "";
      for (const msg of state.messages) {
        const d = fmtDate(msg.createdAt);
        if (d !== lastDate) {
          lastDate = d;
          const div = document.createElement("div");
          div.className = "day-divider";
          div.textContent = d;
          msgs.append(div);
        }
        msgs.append(buildMsg(msg));
      }
      if (scroll) msgs.scrollTop = msgs.scrollHeight;
      updatePinned();
      markRead();
    }

    function buildMsg(msg) {
      const row = document.createElement("div");
      row.className = "msg-row me";
      row.dataset.id = msg.id;
      const inner = document.createElement("div");
      inner.className = "msg-inner";

      /* Hover actions */
      const hover = document.createElement("div");
      hover.className = "msg-hover-actions";
      hover.innerHTML = '<button class="msg-hover-btn" data-act="react"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></button><button class="msg-hover-btn" data-act="more"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>';
      hover.querySelector('[data-act="react"]').onclick = function (e) { e.stopPropagation(); showReactionPicker(e, msg.id); };
      hover.querySelector('[data-act="more"]').onclick = function (e) { e.stopPropagation(); showCtxMenu(e, msg.id); };
      inner.append(hover);

      /* Bubble */
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      if (msg.files && msg.files.length) bubble.classList.add("has-attachment");
      if (msg.deleted) {
        bubble.innerHTML = '<em style="opacity:0.6">Message deleted</em>';
      } else {
        if (msg.text) {
          const txt = document.createElement("div");
          txt.innerHTML = esc(msg.text).replace(/\n/g, "<br>");
          bubble.append(txt);
        }
        if (msg.edited) {
          const el = document.createElement("span");
          el.className = "edited-label";
          el.textContent = " edited";
          bubble.append(el);
        }
        for (const file of (msg.files || [])) bubble.append(buildFile(file));
      }
      inner.append(bubble);

      /* Reactions */
      if (msg.reactions && Object.keys(msg.reactions).length) {
        const rDiv = document.createElement("div");
        rDiv.className = "msg-reactions";
        for (const [emoji, count] of Object.entries(msg.reactions)) {
          const chip = document.createElement("span");
          chip.className = "reaction-chip";
          chip.innerHTML = emoji + '<span class="count">' + count + '</span>';
          chip.onclick = function () { toggleReaction(msg.id, emoji); };
          rDiv.append(chip);
        }
        inner.append(rDiv);
      }

      /* Pin */
      if (msg.pinned) {
        const pin = document.createElement("div");
        pin.className = "pin-badge";
        pin.innerHTML = '<svg viewBox="0 0 24 24" width="10" height="10" fill="#fff"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>';
        inner.append(pin);
      }

      /* Time */
      const time = document.createElement("div");
      time.className = "msg-time";
      time.textContent = fmtTime(msg.createdAt);
      inner.append(time);

      /* Read receipt */
      if (msg.read) {
        const rr = document.createElement("div");
        rr.className = "read-receipt";
        rr.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12l5 5L17 6"/><path d="M7 12l5 5L23 6"/></svg> Read';
        inner.append(rr);
      }

      row.append(inner);
      return row;
    }

    function buildFile(file) {
      const wrap = document.createElement("div");
      wrap.className = "attach";
      const url = api.fileUrl(file.storedName);
      if (file.category === "image") {
        const imgWrap = document.createElement("div");
        imgWrap.className = "attach-image";
        const img = document.createElement("img");
        img.src = url;
        img.alt = file.name;
        img.onclick = function () { api.openFile(file.storedName); };
        imgWrap.append(img);
        wrap.append(imgWrap);
      } else if (file.category === "video") {
        const v = document.createElement("video");
        v.src = url; v.controls = true;
        v.style.maxWidth = "320px"; v.style.borderRadius = "12px";
        wrap.append(v);
      } else if (file.category === "audio") {
        const a = document.createElement("audio");
        a.src = url; a.controls = true; a.style.width = "260px";
        wrap.append(a);
      } else {
        const card = document.createElement("div");
        card.className = "attach-card";
        const ext = (file.name.split(".").pop() || "?").toUpperCase().slice(0, 4);
        card.innerHTML = '<div class="attach-icon">' + esc(ext) + '</div><div class="attach-info"><div class="attach-name">' + esc(file.name) + '</div><div class="attach-meta">' + bytes(file.size) + '</div></div>';
        wrap.append(card);
      }
      const footer = document.createElement("div");
      footer.className = "attach-footer";
      footer.innerHTML = '<div class="attach-meta-full">' + esc(file.name) + ' &middot; ' + bytes(file.size) + '</div>';
      const actions = document.createElement("div");
      actions.className = "attach-actions";
      const openBtn = document.createElement("button");
      openBtn.textContent = "Open";
      openBtn.onclick = function () { api.openFile(file.storedName); };
      const showBtn = document.createElement("button");
      showBtn.textContent = "Show";
      showBtn.onclick = function () { api.revealFile(file.storedName); };
      actions.append(openBtn, showBtn);
      footer.append(actions);
      wrap.append(footer);
      return wrap;
    }

    async function addMessage(text, files) {
      const clean = String(text || "").trim();
      if (!clean && (!files || !files.length)) return;
      state.messages.push({
        id: uid(), text: clean, files: files || [],
        createdAt: Date.now(), read: false, reactions: {}, pinned: false, edited: false
      });
      const input = $("messageInput"); if (input) input.value = "";
      render(true);
      await save();
      try { api.notify({ title: "Message Sent", body: clean || "File sent" }); } catch {}
    }

    function markRead() {
      let changed = false;
      for (const m of state.messages) { if (!m.read) { m.read = true; changed = true; } }
      if (changed) save();
    }

    function findMsg(id) { return state.messages.find(m => m.id === id); }

    /* Context menu */
    function showCtxMenu(e, msgId) {
      e.preventDefault();
      ctxTarget = msgId;
      const msg = findMsg(msgId);
      const menu = $("ctxMenu");
      if (!menu) return;
      menu.hidden = false;
      menu.style.left = Math.min(e.clientX, window.innerWidth - 180) + "px";
      menu.style.top = Math.min(e.clientY, window.innerHeight - 250) + "px";
      const editLi = menu.querySelector('[data-action="edit"]');
      const copyLi = menu.querySelector('[data-action="copy"]');
      const pinLi = menu.querySelector('[data-action="pin"]');
      if (editLi) editLi.style.display = (msg && msg.text && !msg.deleted) ? "" : "none";
      if (copyLi) copyLi.style.display = (msg && msg.text && !msg.deleted) ? "" : "none";
      if (pinLi) pinLi.textContent = (msg && msg.pinned) ? "Unpin" : "Pin";
    }

    const ctxMenu = $("ctxMenu");
    if (ctxMenu) ctxMenu.addEventListener("click", async function (e) {
      const li = e.target.closest("li");
      const action = li ? li.dataset.action : null;
      if (!action || !ctxTarget) return;
      const msg = findMsg(ctxTarget);
      if (!msg) return;
      ctxMenu.hidden = true;
      if (action === "react") { showReactionPicker(e, ctxTarget); return; }
      if (action === "copy") { try { navigator.clipboard.writeText(msg.text || ""); } catch {} toast("Copied"); return; }
      if (action === "pin") { msg.pinned = !msg.pinned; render(false); await save(); toast(msg.pinned ? "Pinned" : "Unpinned"); return; }
      if (action === "edit") { openEdit(msg); return; }
      if (action === "delete") { msg.text = ""; msg.files = []; msg.deleted = true; render(false); await save(); toast("Deleted"); return; }
      if (action === "reply") { const inp = $("messageInput"); if (inp) { inp.value = "> " + (msg.text || "").split("\n")[0] + "\n"; inp.focus(); } return; }
    });

    /* Reactions */
    function showReactionPicker(e, msgId) {
      ctxTarget = msgId;
      const picker = $("reactionPicker");
      if (!picker) return;
      picker.hidden = false;
      const rect = (e.target.closest(".msg-row") || e.target).getBoundingClientRect();
      picker.style.left = Math.min(rect.left + 40, window.innerWidth - 280) + "px";
      picker.style.top = (rect.top - 50) + "px";
    }

    const reactionPicker = $("reactionPicker");
    if (reactionPicker) reactionPicker.addEventListener("click", async function (e) {
      const btn = e.target.closest(".reaction-btn");
      if (!btn || !ctxTarget) return;
      await toggleReaction(ctxTarget, btn.dataset.emoji);
      reactionPicker.hidden = true;
    });

    async function toggleReaction(msgId, emoji) {
      const msg = findMsg(msgId);
      if (!msg) return;
      if (!msg.reactions) msg.reactions = {};
      if (msg.reactions[emoji]) { delete msg.reactions[emoji]; }
      else { msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1; }
      render(false);
      await save();
    }

    /* Edit modal */
    function openEdit(msg) {
      editingId = msg.id;
      const inp = $("editInput");
      if (inp) inp.value = msg.text || "";
      const modal = $("editModal");
      if (modal) modal.hidden = false;
      if (inp) inp.focus();
    }

    const btnCancelEdit = $("btnCancelEdit");
    if (btnCancelEdit) btnCancelEdit.addEventListener("click", function () { $("editModal").hidden = true; editingId = null; });

    const btnSaveEdit = $("btnSaveEdit");
    if (btnSaveEdit) btnSaveEdit.addEventListener("click", async function () {
      if (!editingId) return;
      const msg = findMsg(editingId);
      if (msg) { msg.text = $("editInput").value.trim(); msg.edited = true; }
      $("editModal").hidden = true;
      editingId = null;
      render(false);
      await save();
      toast("Edited");
    });

    /* Pinned bar */
    function updatePinned() {
      const bar = $("pinnedBar");
      if (!bar) return;
      const pinned = state.messages.filter(m => m.pinned && !m.deleted);
      if (pinned.length) {
        bar.hidden = false;
        $("pinnedText").textContent = pinned[pinned.length - 1].text || "Pinned";
      } else {
        bar.hidden = true;
      }
    }

    const btnUnpin = $("btnUnpin");
    if (btnUnpin) btnUnpin.addEventListener("click", async function () {
      const pinned = state.messages.filter(m => m.pinned && !m.deleted);
      if (pinned.length) { pinned[pinned.length - 1].pinned = false; render(false); await save(); }
    });

    /* Search */
    const btnSearchMsgs = $("btnSearchMsgs");
    if (btnSearchMsgs) btnSearchMsgs.addEventListener("click", function () {
      const bar = $("searchBar");
      if (!bar) return;
      bar.hidden = !bar.hidden;
      if (!bar.hidden) $("msgSearchInput").focus();
    });

    const btnCloseSearch = $("btnCloseSearch");
    if (btnCloseSearch) btnCloseSearch.addEventListener("click", function () {
      $("searchBar").hidden = true;
      searchHits = []; searchIdx = -1;
      render(false);
    });

    const msgSearchInput = $("msgSearchInput");
    if (msgSearchInput) msgSearchInput.addEventListener("input", function () {
      const q = msgSearchInput.value.toLowerCase().trim();
      searchHits = []; searchIdx = -1;
      if (!q) { $("searchCount").textContent = ""; render(false); return; }
      state.messages.forEach(function (m, i) { if (m.text && m.text.toLowerCase().includes(q)) searchHits.push(i); });
      $("searchCount").textContent = searchHits.length ? "1/" + searchHits.length : "0 results";
      render(false);
      if (searchHits.length) { searchIdx = 0; highlightHit(); }
    });

    const btnNextSearch = $("btnNextSearch");
    if (btnNextSearch) btnNextSearch.addEventListener("click", function () {
      if (searchHits.length) { searchIdx = (searchIdx + 1) % searchHits.length; highlightHit(); }
    });
    const btnPrevSearch = $("btnPrevSearch");
    if (btnPrevSearch) btnPrevSearch.addEventListener("click", function () {
      if (searchHits.length) { searchIdx = (searchIdx - 1 + searchHits.length) % searchHits.length; highlightHit(); }
    });

    function highlightHit() {
      const q = $("msgSearchInput").value.toLowerCase().trim();
      if (!q) return;
      $("searchCount").textContent = (searchIdx + 1) + "/" + searchHits.length;
      const rows = $("messages").querySelectorAll(".msg-row");
      rows.forEach(function (row, i) {
        const msg = state.messages[i];
        if (!msg || !msg.text) return;
        const bubble = row.querySelector(".bubble");
        if (!bubble) return;
        if (searchHits.includes(i)) {
          const regex = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
          const txtDiv = bubble.querySelector("div");
          if (txtDiv) txtDiv.innerHTML = esc(msg.text).replace(regex, '<mark class="search-hit">$1</mark>');
          if (searchHits[searchIdx] === i) row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }

    /* Emoji picker */
    const EMOJIS = ["😀","😂","😍","🥰","😎","🤔","😢","😡","👍","👎","❤️","🔥","🎉","🙏","💯","✨","😊","🤣","😘","🥺","😭","😤","🤝","👏","🙌","💪","🤞","✌️","🤟","🖐️","👋","🤚","💕","💖","💗","💙","💚","💛","🧡","💜","🤎","🖤","🤍","♥️","💘","💝","💟","⭐","🌟","💫","🌈","☀️","🌙","⚡","🎵","🎶","🎮","🎯","🏆","🎁","🎂","🍕","🍔","☕","🍺","🥂","🌹","🌸","🌺","🐶","🐱","🦊","🐻","🐼","🦁","🐯","🐸","🐵","🦄","🐝","🦋","🐢","🐬","🐳","🌍","🚀","✈️","🏠","💡","📱","💻","📷","🔑","🔒","📌","✏️","📝","✅","❌","⭕","❗","❓","💬","💭","👁️","🧠"];
    function buildEmojiGrid(filter) {
      const grid = $("emojiGrid");
      if (!grid) return;
      grid.innerHTML = "";
      const list = filter ? EMOJIS.filter(e => e.includes(filter)) : EMOJIS;
      list.forEach(function (em) {
        const btn = document.createElement("button");
        btn.className = "emoji-cell";
        btn.textContent = em;
        btn.type = "button";
        btn.addEventListener("click", function () {
          const inp = $("messageInput");
          if (inp) { inp.value += em; inp.focus(); }
        });
        grid.append(btn);
      });
    }

    const btnEmoji = $("btnEmoji");
    if (btnEmoji) btnEmoji.addEventListener("click", function () {
      const ep = $("emojiPicker");
      if (ep) ep.hidden = !ep.hidden;
      const tp = $("themePicker");
      if (tp) tp.hidden = true;
    });

    const emojiSearch = $("emojiSearch");
    if (emojiSearch) emojiSearch.addEventListener("input", function () { buildEmojiGrid(emojiSearch.value); });

    /* Theme picker */
    const btnThemePicker = $("btnThemePicker");
    if (btnThemePicker) btnThemePicker.addEventListener("click", function () {
      const tp = $("themePicker");
      if (tp) tp.hidden = !tp.hidden;
      const ep = $("emojiPicker");
      if (ep) ep.hidden = true;
    });

    const themeColors = $("themeColors");
    if (themeColors) themeColors.addEventListener("click", function (e) {
      const dot = e.target.closest(".theme-dot");
      if (!dot) return;
      settings.theme = dot.dataset.theme;
      applyTheme();
      saveCfg();
      toast("Theme: " + dot.dataset.theme);
    });

    /* Dark mode */
    const btnDarkToggle = $("btnDarkToggle");
    if (btnDarkToggle) btnDarkToggle.addEventListener("click", function () {
      settings.darkMode = !settings.darkMode;
      applyTheme();
      saveCfg();
      toast(settings.darkMode ? "Dark mode on" : "Dark mode off");
    });

    const settingDarkMode = $("settingDarkMode");
    if (settingDarkMode) settingDarkMode.addEventListener("change", function () {
      settings.darkMode = settingDarkMode.checked;
      applyTheme();
      saveCfg();
    });

    /* Settings */
    const btnSettings = $("btnSettings");
    if (btnSettings) btnSettings.addEventListener("click", function () { $("settingsPanel").hidden = false; });
    const btnCloseSettings = $("btnCloseSettings");
    if (btnCloseSettings) btnCloseSettings.addEventListener("click", function () { $("settingsPanel").hidden = true; });
    const btnClearAll = $("btnClearAll");
    if (btnClearAll) btnClearAll.addEventListener("click", async function () {
      if (!confirm("Delete all messages?")) return;
      state.messages = [];
      render();
      await save();
      toast("Cleared");
    });

    /* Typing indicator */
    const messageInput = $("messageInput");
    if (messageInput) messageInput.addEventListener("input", function () {
      const ti = $("typingIndicator");
      if (ti) ti.hidden = false;
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(function () { if (ti) ti.hidden = true; }, 1500);
    });

    /* Drag & Drop */
    const chatPanel = $("chatPanel");
    if (chatPanel) {
      chatPanel.addEventListener("dragenter", function (e) { e.preventDefault(); dragCounter++; $("dropzone").hidden = false; });
      chatPanel.addEventListener("dragleave", function (e) { e.preventDefault(); dragCounter--; if (dragCounter <= 0) { dragCounter = 0; $("dropzone").hidden = true; } });
      chatPanel.addEventListener("dragover", function (e) { e.preventDefault(); });
      chatPanel.addEventListener("drop", async function (e) {
        e.preventDefault();
        dragCounter = 0;
        $("dropzone").hidden = true;
        const files = Array.from(e.dataTransfer.files);
        if (!files.length) return;
        const stored = [];
        for (const f of files) {
          const ext = f.name.includes(".") ? f.name.slice(f.name.lastIndexOf(".")) : "";
          const sn = uid() + ext;
          const c = f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : "file";
          stored.push({ name: f.name, storedName: sn, size: f.size, mime: f.type || "application/octet-stream", category: c });
        }
        if (stored.length) await addMessage("", stored);
      });
    }

    /* Voice notes */
    const btnVoice = $("btnVoice");
    if (btnVoice) btnVoice.addEventListener("click", async function () {
      if (isRecording) { stopRec(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        audioChunks = [];
        mediaRecorder.ondataavailable = function (e) { audioChunks.push(e.data); };
        mediaRecorder.onstop = async function () {
          stream.getTracks().forEach(function (t) { t.stop(); });
          const blob = new Blob(audioChunks, { type: "audio/webm" });
          if (blob.size < 1000) { toast("Recording too short"); return; }
          const reader = new FileReader();
          reader.onloadend = async function () {
            const file = await api.saveVoice(reader.result);
            if (file) await addMessage("", [file]);
          };
          reader.readAsDataURL(blob);
        };
        mediaRecorder.start();
        isRecording = true;
        recordingStart = Date.now();
        $("composer").classList.add("recording");
        updateRecTime();
      } catch (err) { toast("Microphone access denied"); }
    });

    function updateRecTime() {
      if (!isRecording) return;
      const elapsed = Math.floor((Date.now() - recordingStart) / 1000);
      const el = $("composer").querySelector(".recording-time");
      if (el) el.textContent = String(Math.floor(elapsed / 60)).padStart(2, "0") + ":" + String(elapsed % 60).padStart(2, "0");
      recordingTimer = requestAnimationFrame(updateRecTime);
    }

    function stopRec() {
      if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
      isRecording = false;
      cancelAnimationFrame(recordingTimer);
      $("composer").classList.remove("recording");
    }

    /* Build recording bar */
    (function () {
      const recBar = document.createElement("div");
      recBar.className = "recording-bar";
      recBar.innerHTML = '<div class="recording-dot"></div><span class="recording-time">00:00</span><span class="recording-cancel">Cancel</span>';
      $("composer").append(recBar);
      recBar.querySelector(".recording-cancel").addEventListener("click", function () { stopRec(); toast("Cancelled"); });
    })();

    /* Sidebar */
    const sidebarSearch = $("sidebarSearch");
    if (sidebarSearch) sidebarSearch.addEventListener("input", function () { renderConvList(); });

    function renderConvList() {
      const list = $("convList");
      if (!list) return;
      list.innerHTML = "";
      const conv = document.createElement("div");
      conv.className = "conv-item active";
      const lastMsg = state.messages[state.messages.length - 1];
      const preview = lastMsg ? (lastMsg.deleted ? "Message deleted" : lastMsg.text || "Attachment") : "No messages yet";
      const time = lastMsg ? fmtTime(lastMsg.createdAt) : "";
      conv.innerHTML = '<div class="avatar avatar-md av-0">Y</div><div class="conv-body"><div class="conv-top"><span class="conv-name">You</span><span class="conv-time">' + time + '</span></div><div class="conv-preview">' + esc(preview) + '</div></div>';
      list.append(conv);
    }

    /* Composer */
    const btnSend = $("btnSend");
    if (btnSend) btnSend.addEventListener("click", async function (e) {
      e.preventDefault();
      await addMessage($("messageInput").value, []);
    });

    if (messageInput) messageInput.addEventListener("keydown", async function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        await addMessage(messageInput.value, []);
      }
    });

    const btnAttach = $("btnAttach");
    if (btnAttach) btnAttach.addEventListener("click", async function () {
      const files = await api.pickFiles();
      if (files && files.length) await addMessage($("messageInput").value, files);
    });

    /* Canvas */
    const canvas = $("canvasBoard");
    const ctx = canvas.getContext("2d");

    function openCanvas() {
      $("canvasPanel").classList.add("open");
      requestAnimationFrame(function () { resizeCanvas(); clearCanvas(); });
    }
    function closeCanvas() { $("canvasPanel").classList.remove("open"); }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const old = document.createElement("canvas");
      old.width = canvas.width; old.height = canvas.height;
      old.getContext("2d").drawImage(canvas, 0, 0);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = settings.darkMode ? "#242526" : "#fff";
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (old.width) ctx.drawImage(old, 0, 0, old.width / dpr, old.height / dpr);
    }

    function clearCanvas() {
      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = settings.darkMode ? "#242526" : "#fff";
      ctx.fillRect(0, 0, rect.width, rect.height);
      strokes = 0;
      $("strokeCount").textContent = "0";
    }

    function getPt(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

    canvas.addEventListener("pointerdown", function (e) {
      drawing = true; lastPt = getPt(e);
      canvas.setPointerCapture(e.pointerId);
      strokes++; $("strokeCount").textContent = String(strokes);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      const next = getPt(e);
      if (currentTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = Number($("sizeSlider").value) * 3;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = $("colorPicker").value;
        ctx.lineWidth = Number($("sizeSlider").value);
      }
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(lastPt.x, lastPt.y); ctx.lineTo(next.x, next.y); ctx.stroke();
      lastPt = next;
    });

    function stopDraw(e) {
      drawing = false; lastPt = null;
      ctx.globalCompositeOperation = "source-over";
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    }
    canvas.addEventListener("pointerup", stopDraw);
    canvas.addEventListener("pointercancel", stopDraw);
    canvas.addEventListener("pointerleave", function (e) { if (drawing) stopDraw(e); });

    $("sizeSlider").addEventListener("input", function () { $("sizeLabel").textContent = $("sizeSlider").value; });

    document.querySelectorAll("[data-tool]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-tool]").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentTool = btn.dataset.tool;
        $("toolName").textContent = currentTool === "pen" ? "Pen" : "Eraser";
      });
    });

    $("btnWhiteboard").addEventListener("click", openCanvas);
    $("btnCancelCanvas").addEventListener("click", closeCanvas);
    $("btnClearCanvas").addEventListener("click", clearCanvas);
    $("btnSendCanvas").addEventListener("click", async function () {
      const file = await api.saveCanvas(canvas.toDataURL("image/png"));
      if (file) await addMessage("", [file]);
      closeCanvas();
    });
    window.addEventListener("resize", function () { if ($("canvasPanel").classList.contains("open")) resizeCanvas(); });

    /* Keyboard shortcuts */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeAll();
        const sb = $("searchBar"); if (sb) sb.hidden = true;
        const sp = $("settingsPanel"); if (sp) sp.hidden = true;
        if ($("canvasPanel").classList.contains("open")) closeCanvas();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        const sb = $("searchBar"); if (sb) sb.hidden = false;
        const inp = $("msgSearchInput"); if (inp) inp.focus();
      }
    });

    /* ===== INIT ===== */
    try {
      const loaded = await api.load();
      if (loaded && Array.isArray(loaded.messages)) state = loaded;
      const cfg = await api.loadSettings();
      if (cfg) settings = cfg;
    } catch (err) {
      console.error("Init load failed:", err);
    }

    applyTheme();
    buildEmojiGrid();
    renderConvList();
    render(true);

    console.log("Messenger initialized. Messages:", state.messages.length);
  });
})();
