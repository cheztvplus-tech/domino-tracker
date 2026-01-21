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
const clearHandBtn = document.getElementById('clear-hand-btn');

// ======= Fetch sets.json =======
fetch("sets.json")
  .then(res => res.json())
  .then(data => {
    allDominoes = data.dominoes;
    themes = data.themes;
    defaultBackground = data.defaultBackground;
    currentTileFolder = data.defaultDomino;

    // Populate background selector
    Object.keys(themes).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.text = t === "woodbrown" ? "Brown" : t.charAt(0).toUpperCase() + t.slice(1);
      bgSelect.appendChild(opt);
    });
    bgSelect.value = defaultBackground;
    applyBackground(defaultBackground);

    // Populate domino color selector
    ["tiles-black","tiles-white","tiles-green","tiles-purple","tiles-red"].forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.text = t.split("-")[1].charAt(0).toUpperCase() + t.split("-")[1].slice(1);
      dominoSelect.appendChild(opt);
    });
    dominoSelect.value = currentTileFolder;

    // Populate pass numbers
    for(let i=0;i<=6;i++){
      [passNumber1Select, passNumber2Select].forEach(sel=>{
        const o = document.createElement("option");
        o.value = i;
        o.text = i;
        sel.appendChild(o.cloneNode(true));
      });
    }

    // Initialize hand dropdowns
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

// ======= Hand Filtering (mobile + desktop) =======
function updateHandDropdowns(){
  const selected = new Set();
  for(let i=0;i<7;i++){
    const val = document.getElementById(`hand-select-${i}`).value;
    if(val) selected.add(val);
  }

  for(let i=0;i<7;i++){
    const sel = document.getElementById(`hand-select-${i}`);
    const currentVal = sel.value;

    // Default option
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.text = `Select Tile ${i+1}`;
    sel.innerHTML = "";
    sel.appendChild(defaultOption);

    // Add only allowed tiles
    allDominoes.forEach(tile => {
      if(!selected.has(tile) || tile === currentVal){
        const o = document.createElement('option');
        o.value = tile;
        o.text = tile;
        if(tile === currentVal) o.selected = true;
        sel.appendChild(o);
      }
    });
  }
}

// ======= Set Hand =======
setHandBtn.addEventListener('click', ()=>{
  const selectedTiles = new Set();
  myHand = [];
  for(let k=0;k<7;k++){
    const val = document.getElementById(`hand-select-${k}`).value;
    if(!val){ alert("Select all 7 tiles!"); return; }
    if(selectedTiles.has(val)){ alert(`Tile ${val} selected twice!`); return; }
    selectedTiles.add(val);
    myHand.push(val);
  }
  handSelectionDiv.style.display = "none";
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
  playedDominoes = [];
  passes = { RP:new Set(), MP:new Set(), LP:new Set() };
  handIsSet = false;

  handSelectionDiv.style.display = "block";
  initHandDropdowns();
  myHandButtonsDiv.innerHTML = "";
  refreshPlayedDropdown();

  rpTilesSpan.innerHTML = "";
  mpTilesSpan.innerHTML = "";
  lpTilesSpan.innerHTML = "";

  playedLogUl.innerHTML = "";
  passesLogUl.innerHTML = "";

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
      const o = document.createElement("option");
      o.value=t; o.text=t;
      playedDropdown.appendChild(o);
    }
  });
}

// ======= Opponent Play =======
addPlayBtn.onclick = ()=>{
  if(!playedDropdown.value){ alert("Select a tile"); return; }
  playedDominoes.push({domino:playedDropdown.value, player:playerSelect.value});
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
  nextTurn();
};

// ======= Pass Button =======
passBtn.onclick = ()=>{
  const p = playerSelect.value;
  if(passNumber1Select.value) passes[p].add(+passNumber1Select.value);
  if(passNumber2Select.value) passes[p].add(+passNumber2Select.value);

  const li = document.createElement('li');
  if(passNumber1Select.value && passNumber2Select.value)
    li.innerHTML = `${p} passed on <img src="${currentTileFolder}/${passNumber1Select.value}.png" width="30"><img src="${currentTileFolder}/${passNumber2Select.value}.png" width="30">`;
  else if(passNumber1Select.value)
    li.innerHTML = `${p} passed on <img src="${currentTileFolder}/${passNumber1Select.value}.png" width="30">`;
  else if(passNumber2Select.value)
    li.innerHTML = `${p} passed on <img src="${currentTileFolder}/${passNumber2Select.value}.png" width="30">`;
  passesLogUl.appendChild(li);

  passNumber1Select.value="";
  passNumber2Select.value="";
  updatePredictions();
  nextTurn();
};

// ======= Predictions (fixed for passes and independent player pools) =======
function updatePredictions(){
  if(!handIsSet) return;
  const used = new Set([...myHand, ...playedDominoes.map(d=>d.domino)]);
  const remaining = allDominoes.filter(t=>!used.has(t));
  const tilesLeft = { RP:7, MP:7, LP:7 };
  playedDominoes.forEach(d=>{ if(d.player!=="ME") tilesLeft[d.player]--; });

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

  ["RP","MP","LP"].forEach(p=>{
    // independent pool per player
    let pool = remaining.filter(t=>!impossible[p].has(t)).sort(()=>Math.random()-0.5);
    while(pred[p].length < tilesLeft[p] && pool.length){
      pred[p].push(pool.shift());
    }
  });

  rpTilesSpan.innerHTML = pred.RP.map(t=>img(t)).join("");
  mpTilesSpan.innerHTML = pred.MP.map(t=>img(t)).join("");
  lpTilesSpan.innerHTML = pred.LP.map(t=>img(t)).join("");
}

const img = t=>`<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="40">`;

// ======= Played Log =======
function updatePlayedLog(){
  playedLogUl.innerHTML="";
  playedDominoes.forEach((d,i)=>{
    const li=document.createElement('li');
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
if("serviceWorker"in navigator){
  navigator.serviceWorker.register("service-worker.js");
}
