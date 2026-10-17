// Каталог: фильтры, поиск, карточки, модальное окно блюда
(function () {
  "use strict";

  var CUISINE_MAP = {};
  CUISINES.forEach(function (c) { CUISINE_MAP[c.id] = c; });
  var CAT_MAP = {};
  CATEGORIES.forEach(function (c) { CAT_MAP[c.id] = c; });

  var state = { cuisine: "", category: "", q: "" };

  var params = new URLSearchParams(window.location.search);
  var pc = params.get("cuisine");
  if (pc && CUISINE_MAP[pc]) state.cuisine = pc;
  var pk = params.get("category");
  if (pk && CAT_MAP[pk]) state.category = pk;

  var grid = document.getElementById("grid");
  var countEl = document.getElementById("count");
  var emptyEl = document.getElementById("empty");
  var searchInput = document.getElementById("search");
  var cuisineChips = document.getElementById("cuisine-chips");
  var categoryChips = document.getElementById("category-chips");
  var resetBtn = document.getElementById("reset");
  var resetBtn2 = document.getElementById("reset2");
  var modal = document.getElementById("dish-modal");
  var lastTrigger = null;

  function plural(n, one, few, many) {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
    return many;
  }

  // ---- Чипы фильтров ----
  CUISINES.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip cuisine";
    b.dataset.id = c.id;
    b.style.setProperty("--c", c.color);
    b.setAttribute("aria-pressed", "false");
    var dot = document.createElement("span");
    dot.className = "dot";
    b.appendChild(dot);
    b.appendChild(document.createTextNode(c.name.replace(" кухня", "")));
    b.addEventListener("click", function () { toggle("cuisine", c.id); });
    cuisineChips.appendChild(b);
  });

  CATEGORIES.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip category";
    b.dataset.id = c.id;
    b.setAttribute("aria-pressed", "false");
    b.appendChild(document.createTextNode(c.name));
    b.addEventListener("click", function () { toggle("category", c.id); });
    categoryChips.appendChild(b);
  });

  function toggle(field, id) {
    state[field] = state[field] === id ? "" : id;
    syncChips();
    render();
    updateURL();
  }

  function syncChips() {
    var all = document.querySelectorAll(".chip");
    for (var i = 0; i < all.length; i++) {
      var chip = all[i];
      var field = chip.classList.contains("cuisine") ? "cuisine" : "category";
      var on = state[field] === chip.dataset.id;
      chip.classList.toggle("active", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    }
    var active = state.cuisine || state.category || state.q.trim();
    resetBtn.hidden = !active;
  }

  // ---- Отрисовка каталога ----
  function cardHTML(d) {
    var cu = CUISINE_MAP[d.cuisine];
    var cat = CAT_MAP[d.category];
    return '<button type="button" class="dish-card" style="--c:' + cu.color + '" data-id="' + d.id + '" aria-haspopup="dialog">' +
      '<img class="thumb" src="' + d.photo + '" alt="' + d.name + '" loading="lazy">' +
      '<span class="card-body">' +
      '<span class="card-cuisine">' + cu.name + "</span>" +
      '<span class="card-name">' + d.name + "</span>" +
      '<span class="card-meta">' + cat.name + ", " + d.time + "</span>" +
      "</span></button>";
  }

  function render() {
    var q = state.q.trim().toLowerCase();
    var list = DISHES.filter(function (d) {
      if (state.cuisine && d.cuisine !== state.cuisine) return false;
      if (state.category && d.category !== state.category) return false;
      if (q) {
        var hay = [d.name, d.orig, CUISINE_MAP[d.cuisine].name, CAT_MAP[d.category].name, d.ingredients.join(" ")].join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    grid.innerHTML = list.map(cardHTML).join("");
    var hasFilter = state.cuisine || state.category || q;
    countEl.textContent = (hasFilter ? "Найдено: " : "Всего: ") + list.length + " " + plural(list.length, "блюдо", "блюда", "блюд");
    grid.hidden = list.length === 0;
    emptyEl.hidden = list.length > 0;
  }

  function updateURL() {
    try {
      var qs = [];
      if (state.cuisine) qs.push("cuisine=" + encodeURIComponent(state.cuisine));
      if (state.category) qs.push("category=" + encodeURIComponent(state.category));
      var url = window.location.pathname.split("/").pop() + (qs.length ? "?" + qs.join("&") : "");
      history.replaceState(null, "", url);
    } catch (e) { /* file:// — просто пропускаем */ }
  }

  function resetAll() {
    state.cuisine = ""; state.category = ""; state.q = "";
    searchInput.value = "";
    syncChips();
    render();
    updateURL();
  }

  resetBtn.addEventListener("click", resetAll);
  if (resetBtn2) resetBtn2.addEventListener("click", resetAll);

  var debounce;
  searchInput.addEventListener("input", function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      state.q = searchInput.value;
      syncChips();
      render();
    }, 140);
  });

  // ---- Модальное окно ----
  function openDish(id, trigger) {
    var d = DISHES.find(function (x) { return x.id === id; });
    if (!d || !modal) return;
    var cu = CUISINE_MAP[d.cuisine];
    var cat = CAT_MAP[d.category];

    modal.querySelector(".modal-inner").style.setProperty("--c", cu.color);
    var img = document.getElementById("dm-img");
    img.src = d.photo;
    img.alt = d.name;

    document.getElementById("dm-title").textContent = d.name;
    var origEl = document.getElementById("dm-orig");
    if (d.orig && d.orig.toLowerCase() !== d.name.toLowerCase()) {
      origEl.textContent = "«" + d.orig + "»";
      origEl.hidden = false;
    } else {
      origEl.hidden = true;
    }

    document.getElementById("dm-meta").innerHTML =
      '<span class="meta-chip cuisine">' + cu.name + "</span>" +
      '<span class="meta-chip">' + cat.name + "</span>" +
      '<span class="meta-chip">Время: ' + d.time + "</span>" +
      '<span class="meta-chip">Выход: ' + d.servings + "</span>";

    document.getElementById("dm-history").textContent = d.history;
    document.getElementById("dm-ing").innerHTML = d.ingredients.map(function (x) {
      return "<li>" + x + "</li>";
    }).join("");
    document.getElementById("dm-steps").innerHTML = d.steps.map(function (x) {
      return "<li>" + x + "</li>";
    }).join("");
    document.getElementById("dm-facttext").textContent = d.fact;

    var creditEl = document.getElementById("dm-credit");
    var c = (typeof CREDITS !== "undefined" ? CREDITS : {})[d.id];
    if (c) {
      creditEl.hidden = false;
      creditEl.innerHTML = "Фото: " + (c.author || "автор не указан") +
        (c.license ? " (" + c.license + ")" : "") +
        (c.url ? ', <a href="' + c.url + '" target="_blank" rel="noopener">Wikimedia Commons</a>' : "") + ".";
    } else {
      creditEl.hidden = true;
    }

    lastTrigger = trigger || null;
    if (typeof modal.showModal === "function") {
      modal.showModal();
    }
  }

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest(".dish-card");
    if (btn) openDish(btn.dataset.id, btn);
  });

  if (modal) {
    document.getElementById("dm-close").addEventListener("click", function () { modal.close(); });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.close();
    });
    modal.addEventListener("close", function () {
      if (lastTrigger) lastTrigger.focus();
    });
  }

  // ---- Старт ----
  searchInput.value = state.q;
  syncChips();
  render();

  // Прямая ссылка на блюдо: catalog.html?open=shchi
  var openId = params.get("open");
  if (openId) openDish(openId, null);
})();
