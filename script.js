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
      opt.text = t;
      bgSelect.appendChild(opt);
    });

    bgSelect.value = defaultBackground;
    applyBackground(defaultBackground);

    ["tiles-black","tiles-white","tiles-green","tiles-purple","tiles-red"].forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.text = t.split("-")[1];
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

// ======= Background / Domino Theme =======
bgSelect.addEventListener("change", e => applyBackground(e.target.value));

dominoSelect.addEventListener("change", e => {
  currentTileFolder = e.target.value;
  renderMyHandButtons();
  updatePlayedLog();
  if (handIsSet) updatePredictions();   // ✅ FIX
});

function applyBackground(bg){
  document.body.style.background = themes[bg];
}

// ======= Hand Dropdowns =======
function initHandDropdowns(){
  handDropdownsDiv.innerHTML = "";

  for(let k=0;k<7;k++){
    const select = document.createElement('select');
    select.id = `hand-select-${k}`;

    // ✅ MOBILE + DESKTOP FIX
    select.addEventListener("change", updateHandDropdowns);
    select.addEventListener("input", updateHandDropdowns);

    const def = document.createElement('option');
    def.value = "";
    def.text = `Select Tile ${k+1}`;
    select.appendChild(def);

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

// ======= Hand Filtering =======
function updateHandDropdowns(){
  const selected = new Set();
  for(let i=0;i<7;i++){
    const v = document.getElementById(`hand-select-${i}`).value;
    if(v) selected.add(v);
  }

  for(let i=0;i<7;i++){
    const sel = document.getElementById(`hand-select-${i}`);
    Array.from(sel.options).forEach(opt=>{
      if(opt.value && opt.value !== sel.value && selected.has(opt.value)){
        opt.style.display="none";
      } else {
        opt.style.display="block";
      }
    });
  }
}

// ======= Set Hand =======
setHandBtn.onclick = ()=>{
  myHand = [];
  const s = new Set();

  for(let i=0;i<7;i++){
    const v = document.getElementById(`hand-select-${i}`).value;
    if(!v) return alert("Select all 7 tiles");
    if(s.has(v)) return alert("Duplicate tile");
    s.add(v);
    myHand.push(v);
  }

  handSelectionDiv.style.display="none";
  handIsSet = true;

  renderMyHandButtons();
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
  initRotationDropdown();
};

// ======= Clear Hand =======
clearHandBtn.onclick = ()=>{
  myHand = [];
  handIsSet = false;

  handSelectionDiv.style.display="block";
  myHandButtonsDiv.innerHTML = "";

  initHandDropdowns();
  refreshPlayedDropdown();

  rpTilesSpan.innerHTML="";
  mpTilesSpan.innerHTML="";
  lpTilesSpan.innerHTML="";
};

// ======= New Game =======
newGameBtn.onclick = ()=>{
  myHand = [];
  playedDominoes = [];
  passes = { RP:new Set(), MP:new Set(), LP:new Set() };
  handIsSet = false;
  currentRotationIndex = 0;

  handSelectionDiv.style.display="block";
  myHandButtonsDiv.innerHTML="";
  playedLogUl.innerHTML="";
  passesLogUl.innerHTML="";
  rpTilesSpan.innerHTML="";
  mpTilesSpan.innerHTML="";
  lpTilesSpan.innerHTML="";

  initHandDropdowns();
  refreshPlayedDropdown();
  initRotationDropdown();
};

// ======= My Hand =======
function renderMyHandButtons(){
  myHandButtonsDiv.innerHTML="";
  myHand.forEach(tile=>{
    const b = document.createElement('button');
    b.innerHTML = `<img src="${currentTileFolder}/${tile.replace("|","-")}.png" width="50">`;
    b.onclick = ()=>playMyTile(tile);
    myHandButtonsDiv.appendChild(b);
  });
}

function playMyTile(tile){
  playedDominoes.push({domino:tile, player:"ME"});
  myHand = myHand.filter(t=>t!==tile);
  renderMyHandButtons();
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
}

// ======= Played Dropdown =======
function refreshPlayedDropdown(){
  const used = new Set([...myHand, ...playedDominoes.map(d=>d.domino)]);
  playedDropdown.innerHTML="<option value=''>Select Tile</option>";
  allDominoes.forEach(t=>{
    if(!used.has(t)){
      const o=document.createElement("option");
      o.value=t; o.text=t;
      playedDropdown.appendChild(o);
    }
  });
}

// ======= Opponent Play =======
addPlayBtn.onclick = ()=>{
  if(!playedDropdown.value) return alert("Select tile");
  playedDominoes.push({domino:playedDropdown.value, player:playerSelect.value});
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
  nextTurn();
};

// ======= Pass =======
passBtn.onclick = ()=>{
  const p = playerSelect.value;
  if(passNumber1Select.value) passes[p].add(+passNumber1Select.value);
  if(passNumber2Select.value) passes[p].add(+passNumber2Select.value);
  updatePredictions();
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

  const pred={ RP:[], MP:[], LP:[] };
  let pool=remaining.slice().sort(()=>Math.random()-0.5);

  ["RP","MP","LP"].forEach(p=>{
    while(pred[p].length<tilesLeft[p] && pool.length){
      const t=pool.shift();
      if(!impossible[p].has(t)) pred[p].push(t);
    }
  });

  rpTilesSpan.innerHTML=pred.RP.map(t=>img(t)).join("");
  mpTilesSpan.innerHTML=pred.MP.map(t=>img(t)).join("");
  lpTilesSpan.innerHTML=pred.LP.map(t=>img(t)).join("");
}

const img = t => `<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="40">`;

// ======= Played Log =======
function updatePlayedLog(){
  playedLogUl.innerHTML="";
  playedDominoes.forEach((d,i)=>{
    const li=document.createElement("li");
    li.innerHTML=`${i+1}. ${d.player} <img src="${currentTileFolder}/${d.domino.replace("|","-")}.png" height="40">`;
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
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("service-worker.js");
}
