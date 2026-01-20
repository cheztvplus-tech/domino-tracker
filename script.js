// ======= Game State =======
let allDominoes = [];
let themes = {};
let currentTileFolder = "";
let defaultBackground = "";
let myHand = [];
let playedDominoes = [];
let passes = { RP: new Set(), MP: new Set(), LP: new Set() };
const playerRotation = ["RP","MP","LP"];
let currentRotationIndex = 0;
let handIsSet = false;

// ======= Elements =======
const handDropdownsDiv = document.getElementById('hand-dropdowns');
const setHandBtn = document.getElementById('set-hand-btn');
const clearHandBtn = document.getElementById('clear-hand-btn');
const newGameBtn = document.getElementById('new-game-btn');
const handSelectionDiv = document.getElementById('hand-selection');
const myHandButtonsDiv = document.getElementById('my-hand-buttons');
const playedDropdown = document.getElementById('played-domino');
const playerSelect = document.getElementById('player-select');
const addPlayBtn = document.getElementById('add-play-btn');
const passBtn = document.getElementById('pass-btn');
const passNumber1Select = document.getElementById('pass-number1');
const passNumber2Select = document.getElementById('pass-number2');
const rpTilesSpan = document.getElementById('rp-tiles');
const mpTilesSpan = document.getElementById('mp-tiles');
const lpTilesSpan = document.getElementById('lp-tiles');
const playedLogUl = document.getElementById('played-log');
const passesLogUl = document.getElementById('passes-log');
const bgSelect = document.getElementById("bg-theme");
const dominoSelect = document.getElementById("domino-theme");

// ======= Fetch sets.json =======
fetch("sets.json")
  .then(res => res.json())
  .then(data => {
    allDominoes = data.dominoes;
    themes = data.themes;
    defaultBackground = data.defaultBackground;
    currentTileFolder = data.defaultDomino;

    Object.keys(themes).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.text = t === "woodbrown" ? "Brown" : t.charAt(0).toUpperCase() + t.slice(1);
      bgSelect.appendChild(opt);
    });
    bgSelect.value = defaultBackground;
    applyBackground(defaultBackground);

    ["tiles-black","tiles-white","tiles-green","tiles-purple","tiles-red"].forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.text = t.split("-")[1].charAt(0).toUpperCase() + t.split("-")[1].slice(1);
      dominoSelect.appendChild(opt);
    });
    dominoSelect.value = currentTileFolder;

    for(let i=0;i<=6;i++){
      [passNumber1Select, passNumber2Select].forEach(sel=>{
        const o = document.createElement("option");
        o.value = i;
        o.text = i;
        sel.appendChild(o.cloneNode(true));
      });
    }

    initHandDropdowns();
  });

// ======= Background / Domino Color change =======
bgSelect.addEventListener("change", e => applyBackground(e.target.value));
dominoSelect.addEventListener("change", e => {
  currentTileFolder = e.target.value;
  renderMyHandButtons();
  updatePlayedLog();
  if(handIsSet) updatePredictions();
});

function applyBackground(bg){
  document.body.style.background = themes[bg];
  const color = bg === "white" ? "#000" : "#fff";
  document.body.style.color = color;
  document.querySelectorAll("h1,h2,h3").forEach(h => h.style.color = color);
}

// ======= Hand Dropdowns =======
function initHandDropdowns(){
  handDropdownsDiv.innerHTML="";
  for(let k=0;k<7;k++){
    const select = document.createElement('select');
    select.id = `hand-select-${k}`;
    select.addEventListener("change", updateHandDropdowns);
    select.addEventListener("input", updateHandDropdowns);

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.text = `Select Tile ${k+1}`;
    select.appendChild(defaultOption);

    allDominoes.forEach(tile=>{
      const opt = document.createElement('option');
      opt.value = tile;
      opt.text = tile;
      select.appendChild(opt);
    });

    handDropdownsDiv.appendChild(select);
    handDropdownsDiv.appendChild(document.createElement('br'));
  }
}

function updateHandDropdowns(){
  const selected = new Set();
  for(let i=0;i<7;i++){
    const val = document.getElementById(`hand-select-${i}`).value;
    if(val) selected.add(val);
  }
  for(let i=0;i<7;i++){
    const sel = document.getElementById(`hand-select-${i}`);
    Array.from(sel.options).forEach(opt=>{
      if(opt.value && opt.value !== sel.value && selected.has(opt.value)){
        opt.style.display = "none";
      } else {
        opt.style.display = "block";
      }
    });
  }
}

// ======= Set Hand =======
setHandBtn.addEventListener('click', ()=>{
  myHand = [];
  const s = new Set();
  for(let i=0;i<7;i++){
    const val = document.getElementById(`hand-select-${i}`).value;
    if(!val){ alert("Select all 7 tiles"); return; }
    if(s.has(val)){ alert("Duplicate tile"); return; }
    s.add(val);
    myHand.push(val);
  }
  handSelectionDiv.style.display="none";
  handIsSet = true;
  renderMyHandButtons();
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
  initRotationDropdown();
});

// ======= Clear My Hand =======
clearHandBtn.addEventListener('click', ()=>{
  myHand = [];
  handIsSet = false;
  handSelectionDiv.style.display="block";
  myHandButtonsDiv.innerHTML="";
  initHandDropdowns();
  refreshPlayedDropdown();
  rpTilesSpan.innerHTML="";
  mpTilesSpan.innerHTML="";
  lpTilesSpan.innerHTML="";
  playedLogUl.innerHTML="";
  passesLogUl.innerHTML="";
  passes = { RP:new Set(), MP:new Set(), LP:new Set() };
});

// ======= New Game =======
newGameBtn.addEventListener('click', ()=>{
  myHand = [];
  playedDominoes = [];
  passes = { RP:new Set(), MP:new Set(), LP:new Set() };
  handIsSet = false;
  handSelectionDiv.style.display="block";
  myHandButtonsDiv.innerHTML="";
  playedLogUl.innerHTML="";
  passesLogUl.innerHTML="";
  rpTilesSpan.innerHTML="";
  mpTilesSpan.innerHTML="";
  lpTilesSpan.innerHTML="";
  initHandDropdowns();
  refreshPlayedDropdown();
  currentRotationIndex=0;
  playerSelect.value = playerRotation[0];
});

// ======= Render My Hand =======
function renderMyHandButtons(){
  myHandButtonsDiv.innerHTML="";
  myHand.forEach(tile=>{
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="${currentTileFolder}/${tile.replace("|","-")}.png" width="50">`;
    btn.onclick = ()=>playMyTile(tile);
    myHandButtonsDiv.appendChild(btn);
  });
}

// ======= Play My Tile =======
function playMyTile(tile){
  playedDominoes.push({domino: tile, player:"ME"});
  myHand = myHand.filter(t=>t!==tile);
  renderMyHandButtons();
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
}

// ======= Refresh Played Dropdown =======
function refreshPlayedDropdown(){
  const used = new Set([...myHand, ...playedDominoes.map(d=>d.domino)]);
  playedDropdown.innerHTML = "<option value=''>Select Tile</option>";
  allDominoes.forEach(t=>{
    if(!used.has(t)){
      const o = document.createElement("option");
      o.value=t; o.text=t;
      playedDropdown.appendChild(o);
    }
  });
}

// ======= Opponent Play =======
addPlayBtn.onclick = ()=>{
  if(!playedDropdown.value){ alert("Select tile"); return; }
  playedDominoes.push({domino: playedDropdown.value, player: playerSelect.value});
  refreshPlayedDropdown();
  if(handIsSet) updatePredictions();
  updatePlayedLog();
  nextTurn();
};

// ======= Pass =======
passBtn.onclick = ()=>{
  const p = playerSelect.value;
  if(passNumber1Select.value) passes[p].add(+passNumber1Select.value);
  if(passNumber2Select.value) passes[p].add(+passNumber2Select.value);

  if(handIsSet) updatePredictions();

  // Update passes log
  const li = document.createElement('li');
  const n1 = passNumber1Select.value;
  const n2 = passNumber2Select.value;
  if(n1 && n2) li.innerHTML = `${p} passed on <img src="${currentTileFolder}/${n1}.png" width="30"><img src="${currentTileFolder}/${n2}.png" width="30">`;
  else if(n1) li.innerHTML = `${p} passed on <img src="${currentTileFolder}/${n1}.png" width="30">`;
  else if(n2) li.innerHTML = `${p} passed on <img src="${currentTileFolder}/${n2}.png" width="30">`;
  passesLogUl.appendChild(li);

  passNumber1Select.value="";
  passNumber2Select.value="";
  nextTurn();
};

// ======= Predictions =======
function updatePredictions(){
  if(!handIsSet) return;
  const used = new Set([...myHand, ...playedDominoes.map(d=>d.domino)]);
  const remaining = allDominoes.filter(t=>!used.has(t));
  const tilesLeft = { RP:7, MP:7, LP:7 };
  playedDominoes.forEach(d=>{
    if(d.player!=="ME") tilesLeft[d.player]--;
  });

  const impossible = { RP:new Set(), MP:new Set(), LP:new Set() };
  ["RP","MP","LP"].forEach(p=>{
    remaining.forEach(t=>{
      passes[p].forEach(n=>{
        const [a,b]=t.split("|").map(Number);
        if(a===n||b===n) impossible[p].add(t);
      });
    });
  });

  const pred = { RP:[], MP:[], LP:[] };
  let pool = remaining.slice().sort(()=>Math.random()-0.5);
  ["RP","MP","LP"].forEach(p=>{
    while(pred[p].length < tilesLeft[p] && pool.length){
      const t = pool.shift();
      if(!impossible[p].has(t)) pred[p].push(t);
    }
  });

  rpTilesSpan.innerHTML = pred.RP.map(t=>`<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="40">`).join("");
  mpTilesSpan.innerHTML = pred.MP.map(t=>`<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="40">`).join("");
  lpTilesSpan.innerHTML = pred.LP.map(t=>`<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="40">`).join("");
}

// ======= Played Dominoes Log =======
function updatePlayedLog(){
  playedLogUl.innerHTML="";
  playedDominoes.forEach((d,i)=>{
    const li = document.createElement('li');
    li.innerHTML = `${i+1}. ${d.player} <img src="${currentTileFolder}/${d.domino.replace("|","-")}.png" height="40">`;
    playedLogUl.appendChild(li);
  });
}

// ======= Rotation =======
function initRotationDropdown(){
  currentRotationIndex=0;
  playerSelect.value=playerRotation[0];
}
function nextTurn(){
  currentRotationIndex=(currentRotationIndex+1)%3;
  playerSelect.value=playerRotation[currentRotationIndex];
}

// ======= Service Worker =======
if("serviceWorker"in navigator){
  navigator.serviceWorker.register("service-worker.js");
}
