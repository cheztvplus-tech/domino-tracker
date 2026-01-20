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
  if(myHand.length === 7){ // only update opponent predictions if hand is set
    updatePredictions();
  }
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

// ======= Hand Filtering Function =======
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
        opt.style.display = "none"; // hide selected tiles
      } else {
        opt.style.display = "block";
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
  renderMyHandButtons();
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
  initRotationDropdown();
});

// ======= Render My Hand =======
function renderMyHandButtons(){
  myHandButtonsDiv.innerHTML="";
  myHand.forEach(tile=>{
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="${currentTileFolder}/${tile.replace("|","-")}.png" width="50">`;
    btn.addEventListener('click',()=>playMyTile(tile));
    myHandButtonsDiv.appendChild(btn);
  });
}

// ======= Play My Tile =======
function playMyTile(tile){
  playedDominoes.push({domino: tile, player: "ME", timestamp: new Date()});
  myHand = myHand.filter(t => t !== tile);
  renderMyHandButtons();
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
}

// ======= Refresh Played Dropdown =======
function refreshPlayedDropdown(){
  const used = new Set([...myHand, ...playedDominoes.map(d=>d.domino)]);
  playedDropdown.innerHTML="";
  const defaultOpt = document.createElement('option');
  defaultOpt.value="";
  defaultOpt.text="Select Tile";
  playedDropdown.appendChild(defaultOpt);
  allDominoes.forEach(tile=>{
    if(!used.has(tile)){
      const opt = document.createElement('option');
      opt.value = tile;
      opt.text = tile;
      playedDropdown.appendChild(opt);
    }
  });
}

// ======= Add Opponent Play =======
addPlayBtn.addEventListener('click', ()=>{
  const domino = playedDropdown.value;
  const player = playerSelect.value;
  if(!domino){ alert("Select a tile!"); return; }
  playedDominoes.push({domino, player, timestamp: new Date()});
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
  nextTurn();
});

// ======= Pass Button =======
passBtn.addEventListener('click', ()=>{
  const player = playerSelect.value;
  const num1 = passNumber1Select.value;
  const num2 = passNumber2Select.value;
  if(!num1 && !num2){ alert("Select at least one number!"); return; }
  if(num1) passes[player].add(parseInt(num1));
  if(num2) passes[player].add(parseInt(num2));
  updatePredictions();

  const li = document.createElement('li');
  if(num1 && num2) li.innerHTML = `${player} passed on <img src="tiles-black/${num1}.png" width="30"><img src="tiles-black/${num2}.png" width="30">`;
  else if(num1) li.innerHTML = `${player} passed on <img src="tiles-black/${num1}.png" width="30">`;
  else if(num2) li.innerHTML = `${player} passed on <img src="tiles-black/${num2}.png" width="30">`;
  passesLogUl.appendChild(li);

  passNumber1Select.value="";
  passNumber2Select.value="";
  nextTurn();
});

// ======= Update Predictions =======
function updatePredictions(){
  if(myHand.length !== 7) return; // prevent generation before hand is set
  const used = new Set([...myHand, ...playedDominoes.map(d=>d.domino)]);
  const remaining = allDominoes.filter(t=>!used.has(t));
  const tilesLeft = { RP: 7, MP: 7, LP: 7 };
  playedDominoes.forEach(d=>{ if(d.player!=="ME") tilesLeft[d.player]--; });
  const playerImpossible = { RP: new Set(), MP: new Set(), LP: new Set() };
  ["RP","MP","LP"].forEach(player=>{
    remaining.forEach(tile=>{
      passes[player].forEach(num=>{
        const [a,b] = tile.split("|").map(Number);
        if(a===num || b===num) playerImpossible[player].add(tile);
      });
    });
  });
  const predictions = { RP: [], MP: [], LP: [] };
  let available = remaining.slice();
  available.sort(()=>Math.random()-0.5);
  ["RP","MP","LP"].forEach(player=>{
    const maxTiles = tilesLeft[player];
    let count = 0;
    for(let i=0; i<available.length && count<maxTiles; i++){
      const t = available[i];
      if(t && !playerImpossible[player].has(t)){
        predictions[player].push(t);
        count++;
        available[i] = null;
      }
    }
    available = available.filter(t=>t!==null);
  });
  rpTilesSpan.innerHTML = predictions.RP.map(t=>`<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="40">`).join(" ");
  mpTilesSpan.innerHTML = predictions.MP.map(t=>`<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="40">`).join(" ");
  lpTilesSpan.innerHTML = predictions.LP.map(t=>`<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="40">`).join(" ");
}

// ======= Played Dominoes Log =======
function updatePlayedLog(){
  playedLogUl.innerHTML="";
  playedDominoes.forEach((d,i)=>{
    const li = document.createElement('li');
    li.style.display="flex";
    li.style.alignItems="center";
    li.style.gap="6px";
    li.style.whiteSpace="nowrap";
    const textNode = document.createTextNode(`${i+1}. ${d.player} played`);
    const img = document.createElement('img');
    img.src = `${currentTileFolder}/${d.domino.replace("|","-")}.png`;
    img.style.height="50px";
    img.style.width="auto";
    img.style.marginLeft="20px";
    img.style.transform="rotate(-90deg)";
    img.style.transformOrigin="center center";
    li.appendChild(textNode);
    li.appendChild(img);
    playedLogUl.appendChild(li);
  });
}

// ======= Rotation =======
function initRotationDropdown(){
  currentRotationIndex=0;
  playerSelect.value=playerRotation[currentRotationIndex];
}
function nextTurn(){
  const selected = playerSelect.value;
  currentRotationIndex=playerRotation.indexOf(selected);
  currentRotationIndex=(currentRotationIndex+1)%playerRotation.length;
  playerSelect.value=playerRotation[currentRotationIndex];
}

// ======= Service Worker =======
if ("serviceWorker" in navigator){
  window.addEventListener("load", ()=>navigator.serviceWorker.register("service-worker.js"));
}
