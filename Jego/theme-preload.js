(function() {
  function getSystemTheme() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch (e) {
      return "light";
    }
  }
  try {
    var t = localStorage.getItem("jego.theme.mirror");
    if (t !== "light" && t !== "dark") t = getSystemTheme();
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", getSystemTheme());
  }
})();
