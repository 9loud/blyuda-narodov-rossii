// Главная страница: вставка карты и карточек кухонь
(function () {
  "use strict";

  // Карта (SVG-строка из map-data.js — работает без интернета и без сервера)
  var holder = document.getElementById("map");
  if (holder && typeof MAP_SVG === "string") {
    holder.innerHTML = MAP_SVG;
  }

  // Карточки кухонь
  var grid = document.getElementById("cuisines");
  if (grid && typeof CUISINES !== "undefined") {
    grid.innerHTML = CUISINES.map(function (c) {
      return '<a class="cuisine-card" href="catalog.html?cuisine=' + c.id + '" style="--c:' + c.color + '">' +
        "<h3>" + c.name + "</h3>" +
        '<p class="cuisine-people"><b>' + c.people + "</b>, " + c.population + "</p>" +
        '<p class="cuisine-intro">' + c.intro + "</p>" +
        '<span class="cuisine-more">Смотреть блюда</span>' +
        "</a>";
    }).join("");
  }
})();
