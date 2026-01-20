let allDominoes = [];
let themes = {};
let currentTileFolder = "";
let defaultBackground = "";

// fetch sets.json dynamically
fetch("sets.json")
  .then(res => res.json())
  .then(data => {
    allDominoes = data.dominoes;
    themes = data.themes;
    defaultBackground = data.defaultBackground;
    currentTileFolder = data.defaultDomino;

    // populate background dropdown
    const bgSelect = document.getElementById("bg-theme");
    Object.keys(themes).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.text = t === "woodbrown" ? "Brown" : t.charAt(0).toUpperCase() + t.slice(1);
      bgSelect.appendChild(opt);
    });
    bgSelect.value = defaultBackground;

    // populate domino dropdown
    const dominoSelect = document.getElementById("domino-theme");
    ["tiles-black","tiles-white","tiles-green","tiles-purple","tiles-red"].forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.text = t.split("-")[1].charAt(0).toUpperCase() + t.split("-")[1].slice(1);
      dominoSelect.appendChild(opt);
    });
    dominoSelect.value = currentTileFolder;

    // initial background & header colors
    document.body.style.background = themes[defaultBackground];
    document.body.style.color = defaultBackground === "white" ? "#000" : "#fff";
    document.querySelectorAll("h1,h2,h3").forEach(h => h.style.color = defaultBackground === "white" ? "#000" : "#fff");

    // populate pass numbers 0-6
    const pass1 = document.getElementById("pass-number1");
    const pass2 = document.getElementById("pass-number2");
    for(let i=0;i<=6;i++){
      const o1 = document.createElement("option");
      o1.value = i; o1.text = i;
      pass1.appendChild(o1.cloneNode(true));
      pass2.appendChild(o1.cloneNode(true));
    }
  });

// ... rest of your existing domino game JS logic ...
// hand selection, filtering, played log, passes, predictions
// keep all functionality exactly as your latest working version

// ===== Service Worker registration =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}