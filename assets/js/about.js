// Страница «О проекте»: список источников фотографий
(function () {
  "use strict";

  var el = document.getElementById("sources");
  if (!el) return;

  var credits = (typeof CREDITS !== "undefined") ? CREDITS : {};
  var ids = Object.keys(credits);
  if (!ids.length) {
    el.innerHTML = "<li>Список источников формируется.</li>";
    return;
  }

  var byId = {};
  (typeof DISHES !== "undefined" ? DISHES : []).forEach(function (d) { byId[d.id] = d; });

  el.innerHTML = ids.map(function (id) {
    var c = credits[id];
    var d = byId[id];
    var name = d ? d.name : id;
    var lic = c.license ? " (" + c.license + ")" : "";
    var link = c.url
      ? ' <a href="' + c.url + '" target="_blank" rel="noopener">страница фото</a>'
      : "";
    return "<li><b>" + name + "</b> — фото: " + (c.author || "автор не указан") + lic + "." + link + "</li>";
  }).join("");
})();
