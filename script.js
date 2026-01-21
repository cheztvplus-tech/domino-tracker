// ======= Game State =======
let allDominoes = [];
let themes = {};
let currentTileFolder = "";
let defaultBackground = "";
let myHand = [];
let playedDominoes = [];
let passes = { RP:new Set(), MP:new Set(), LP:new Set() };
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

// ✅ FIX: keep rotation synced on desktop & mobile
playerSelect.addEventListener("change", syncRotationWithSelect);

// ======= Fetch sets.json =======
fetch("sets.json")
  .then(res => res.json())
  .then(data => {
    allDominoes = data.dominoes;
    themes = data.themes;
    defaultBackground = data.defaultBackground;
    currentTileFolder = data.defaultDomino;

    // Background options
    Object.keys(themes).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.text = t === "woodbrown" ? "Brown" : t.charAt(0).toUpperCase() + t.slice(1);
      bgSelect.appendChild(opt);
    });
    bgSelect.value = defaultBackground;
    applyBackground(defaultBackground);

    // ======= Domino Colors (updated) =======
    [
      "tiles-white b",      // ✅ White W/Border (default)
      "tiles-black",
      "tiles-white",
      "tiles-green",
      "tiles-purple",
      "tiles-red",
      "tiles-neon"          // ✅ Neon
    ].forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;

      if(t === "tiles-white b") opt.text = "White W/Border";
      else opt.text = t.split("-")[1].charAt(0).toUpperCase() + t.split("-")[1].slice(1);

      dominoSelect.appendChild(opt);
    });

    // Set default
    currentTileFolder = "tiles-white b";
    dominoSelect.value = currentTileFolder;

    // Pass numbers
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

// ======= Background / Domino Color =======
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

    const def = document.createElement('option');
    def.value="";
    def.text=`Select Tile ${k+1}`;
    select.appendChild(def);

    allDominoes.forEach(tile=>{
      const opt=document.createElement('option');
      opt.value=tile;
      opt.text=tile;
      select.appendChild(opt);
    });

    handDropdownsDiv.appendChild(select);
    handDropdownsDiv.appendChild(document.createElement('br'));
  }
}

// ======= MOBILE-SAFE Hand Filtering =======
function updateHandDropdowns(){
  const selected = new Set();
  for(let i=0;i<7;i++){
    const v=document.getElementById(`hand-select-${i}`).value;
    if(v) selected.add(v);
  }

  for(let i=0;i<7;i++){
    const sel=document.getElementById(`hand-select-${i}`);
    const current=sel.value;
    sel.innerHTML=`<option value="">Select Tile ${i+1}</option>`;

    allDominoes.forEach(t=>{
      if(!selected.has(t) || t===current){
        const o=document.createElement("option");
        o.value=t;
        o.text=t;
        if(t===current) o.selected=true;
        sel.appendChild(o);
      }
    });
  }
}

// ======= Set Hand =======
setHandBtn.onclick=()=>{
  myHand=[];
  const seen=new Set();
  for(let i=0;i<7;i++){
    const v=document.getElementById(`hand-select-${i}`).value;
    if(!v){ alert("Select all 7 tiles!"); return; }
    if(seen.has(v)){ alert(`Tile ${v} selected twice!`); return; }
    seen.add(v); myHand.push(v);
  }
  handSelectionDiv.style.display="none";
  handIsSet=true;
  renderMyHandButtons();
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();

  syncRotationWithSelect();
};

// ======= Clear Hand =======
clearHandBtn.onclick=()=>{
  myHand=[];
  playedDominoes=[];
  passes={ RP:new Set(), MP:new Set(), LP:new Set() };
  handIsSet=false;

  handSelectionDiv.style.display="block";
  initHandDropdowns();
  myHandButtonsDiv.innerHTML="";
  refreshPlayedDropdown();

  rpTilesSpan.innerHTML="";
  mpTilesSpan.innerHTML="";
  lpTilesSpan.innerHTML="";

  playedLogUl.innerHTML="";
  passesLogUl.innerHTML="";
};

// ======= My Hand =======
function renderMyHandButtons(){
  myHandButtonsDiv.innerHTML="";
  myHand.forEach(t=>{
    const b=document.createElement('button');
    b.innerHTML=`<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="50">`;
    b.onclick=()=>playMyTile(t);
    myHandButtonsDiv.appendChild(b);
  });
}

function playMyTile(t){
  playedDominoes.push({domino:t,player:"ME"});
  myHand=myHand.filter(x=>x!==t);
  renderMyHandButtons();
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
}

// ======= Played Dropdown =======
function refreshPlayedDropdown(){
  const used=new Set([...myHand,...playedDominoes.map(d=>d.domino)]);
  playedDropdown.innerHTML="<option value=''>Select Tile</option>";
  allDominoes.forEach(t=>{
    if(!used.has(t)){
      const o=document.createElement("option");
      o.value=t;o.text=t;
      playedDropdown.appendChild(o);
    }
  });
}

// ======= Opponent Play =======
addPlayBtn.onclick=()=>{
  if(!playedDropdown.value){ alert("Select a tile"); return; }
  syncRotationWithSelect();
  playedDominoes.push({domino:playedDropdown.value,player:playerSelect.value});
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
  nextTurn();
};

// ======= Pass =======
passBtn.onclick=()=>{
  syncRotationWithSelect();
  const p=playerSelect.value;
  if(passNumber1Select.value) passes[p].add(+passNumber1Select.value);
  if(passNumber2Select.value) passes[p].add(+passNumber2Select.value);

  const li=document.createElement("li");
  li.innerHTML=`${p} passed`;
  passesLogUl.appendChild(li);

  passNumber1Select.value="";
  passNumber2Select.value="";
  updatePredictions();
  nextTurn();
};

// ======= Predictions (FIXED: NO DUPLICATES) =======
function updatePredictions(){
  if(!handIsSet) return;

  const used=new Set([...myHand,...playedDominoes.map(d=>d.domino)]);
  let globalAvailable = allDominoes.filter(t=>!used.has(t));

  const tilesLeft={ RP:7, MP:7, LP:7 };
  playedDominoes.forEach(d=>{ if(d.player!=="ME") tilesLeft[d.player]--; });

  const impossible={ RP:new Set(), MP:new Set(), LP:new Set() };
  ["RP","MP","LP"].forEach(p=>{
    globalAvailable.forEach(t=>{
      passes[p].forEach(n=>{
        const[a,b]=t.split("|").map(Number);
        if(a===n||b===n) impossible[p].add(t);
      });
    });
  });

  const pred={ RP:[], MP:[], LP:[] };
  ["RP","MP","LP"].forEach(p=>{
    let avail = globalAvailable.filter(t=>!impossible[p].has(t))
      .sort(()=>Math.random()-0.5);
    while(pred[p].length<tilesLeft[p] && avail.length){
      const tile = avail.shift();
      pred[p].push(tile);
      globalAvailable = globalAvailable.filter(t=>t!==tile); // 🔒 reserve globally
    }
  });

  rpTilesSpan.innerHTML=pred.RP.map(img).join("");
  mpTilesSpan.innerHTML=pred.MP.map(img).join("");
  lpTilesSpan.innerHTML=pred.LP.map(img).join("");
}

const img=t=>`<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="40">`;

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
function syncRotationWithSelect(){
  currentRotationIndex = playerRotation.indexOf(playerSelect.value);
}

function nextTurn(){
  currentRotationIndex=(currentRotationIndex+1)%3;
  playerSelect.value=playerRotation[currentRotationIndex];
}

// ======= Service Worker =======
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("service-worker.js");
}
