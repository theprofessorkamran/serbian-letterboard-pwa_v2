// SR Govorni Taster — v2 with categorized phrases & script toggle rendering
(function(){
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // Elements
  const textOut = $("#textOut");
  const capsToggle = $("#capsToggle");
  const latinToggle = $("#latinToggle");
  const leftHandToggle = $("#leftHandToggle");
  const keysWrap = $("#keys");

  const speakBtn = $("#speakBtn");
  const shareBtn = $("#shareBtn");
  const copyBtn = $("#copyBtn");
  const clearBtn = $("#clearBtn");
  const backspaceBtn = $("#backspaceBtn");
  const spaceBtn = $("#spaceBtn");
  const enterBtn = $("#enterBtn");
  const installBtn = $("#installBtn");
  const helpBtn = $("#helpBtn");

  // Phrase board
  const catTabs = $("#catTabs");
  const catContent = $("#catContent");

  // Share / Receive
  const sysShareBtn = $("#sysShareBtn");
  const shareStatus = $("#shareStatus");
  const receiveBox = $("#receiveBox");
  const receiveSpeakBtn = $("#receiveSpeakBtn");
  const receiveCopyBtn = $("#receiveCopyBtn");
  const startScanBtn = $("#startScanBtn");
  const stopScanBtn = $("#stopScanBtn");
  const preview = $("#preview");
  const scanCanvas = $("#scanCanvas");
  const scanStatus = $("#scanStatus");

  // Tabs for share panel
  $$(".tab").forEach(t => {
    t.addEventListener("click", () => {
      $$(".tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      $$(".tabcontent").forEach(x => x.classList.add("hidden"));
      const id = t.dataset.tab;
      document.getElementById(id).classList.remove("hidden");
    });
  });

  // ---- Letters (Latin/Cyrillic) ----
  const lettersLatin = [
    "A","B","C","Č","Ć",
    "D","Dž","Đ","E","F",
    "G","H","I","J","K",
    "L","Lj","M","N","Nj",
    "O","P","R","S","Š",
    "T","U","V","Z","Ž"
  ];
  const lettersCyr = [
    "А","Б","В","Г","Д",
    "Ђ","Е","Ж","З","И",
    "Ј","К","Л","Љ","М",
    "Н","Њ","О","П","Р",
    "С","Т","Ћ","У","Ф",
    "Х","Ц","Ч","Џ","Ш"
  ];

  function buildKeys(){
    keysWrap.innerHTML = "";
    const latin = latinToggle.checked;
    const set = latin ? lettersLatin : lettersCyr;
    for(const ch of set){
      const b = document.createElement("button");
      b.className = "key";
      b.type="button";
      b.textContent = capsToggle.checked ? toUpperCaseSpecial(ch, latin) : toLowerCaseSpecial(ch, latin);
      b.addEventListener("click", () => {
        insertText(b.textContent);
        smallVibrate();
      });
      keysWrap.appendChild(b);
    }
  }
  function toUpperCaseSpecial(s, latin){
    if(latin){
      const low = s.toLowerCase();
      if(low === "lj") return "Lj";
      if(low === "nj") return "Nj";
      if(low === "dž") return "Dž";
      return s.toUpperCase();
    } else return s.toUpperCase();
  }
  function toLowerCaseSpecial(s){ return s.toLowerCase(); }

  // ---- Phrase categories (provided by user) ----
  // Stored in Latin; we render as Cyrillic if toggle is off
  const CATEGORIES = [
    ["Pozdravi", [
      "Dobro jutro","Dobar dan","Dobro veče","Laku noć","Doviđenja","Zdravo",
      "Srećan rođendan","Vidimo se kasnije","Čujemo se kasnije","Čestitam"
    ]],
    ["Osnovno", [
      "Da","Ne","Hoću","Neću","Imam","Nemam","Važno je","Moram nešto da ti kažem",
      "Sviđa mi se","Kako si?","Koliko je sati?"
    ]],
    ["Potrebe", [
      "Gladna sam","Nisam gladna","Žedna sam","Nisam žedna",
      "Hoću napolje","Hoću da spavam","Hoću da budem sama","Pozovi","Hoću da glasam"
    ]],
    ["Zdravlje", [
      "Boli me glava","Boli me stomak","Boli me noga","Boli me ruka","Boli me šaka","Imam temperaturu","Umorna sam"
    ]],
    ["Emocije", [
      "Srećna sam","Tužna sam","Ljuta sam","Baš me briga","Ne zezaj se","Volim te"
    ]],
    ["Toalet i higijena", [
      "Hoću da piškim","Hoću da kakim","Hoću da se okupam","Presvuci me"
    ]],
    ["Vreme i dan", [
      "Sada","Kasnije","Danas","Sutra","Juče"
    ]],
    ["Porodica i ljudi", [
      "Sin","Ćerka","Snaja","Deca","Unuci","Doktor"
    ]],
    ["Kuća i komande", [
      "Otvori vrata","Zatvori vrata","Otvori prozor","Zatvori prozor",
      "Upali svetlo","Ugasi svetlo","Sto","Stolica","Televizor","Promeni TV kanal"
    ]],
    ["Odeća i toplota", [
      "Haljina","Džemper","Prsluk","Kaput","Šešir","Cipele","Čarape","Rukavice","Ćebe","Obuci se, hladno je"
    ]],
    ["Boje", [
      "Crvena","Plava","Bela","Crna","Žuta","Narandžasta"
    ]],
    ["Životinje", [
      "Pas","Mačka"
    ]],
    ["Hrana i piće", [
      "Kafa","Šećer","So","Voda","Kisela voda","Rakija","Čaj",
      "Jaje","Slanina","Kajmak","Sir","Pasulj",
      "Jabuka","Banana","Krompir","Krastavac","Luk","Cvekla","Šargarepa"
    ]],
    ["Vreme (meteorologija)", [
      "Hladno mi je","Vruće mi je","Pada kiša","Pada sneg","Baš je lepo vreme"
    ]],
    ["Razgovor", [
      "Kako je na poslu?","Jesi li umoran?","Jesi li gladan?","Odmori se","Film","Vesti","Sport","Ubiće te promaja"
    ]]
  ];

  // Transliteration Latin -> Cyrillic for Serbian
  function latinToCyrillic(input){
    let s = input;
    // Handle digraphs first (order matters)
    // Dž / dž
    s = s.replace(/DŽ|Dž|dž/g, m => (m === "DŽ" || m === "Dž") ? "Џ" : "џ");
    // Lj / Nj
    s = s.replace(/LJ|Lj|lj/g, m => (m === "LJ" || m === "Lj") ? "Љ" : "љ");
    s = s.replace(/NJ|Nj|nj/g, m => (m === "NJ" || m === "Nj") ? "Њ" : "њ");
    // Single letters with diacritics
    const map = {
      "A":"А","B":"Б","C":"Ц","Č":"Ч","Ć":"Ћ","D":"Д","Đ":"Ђ","E":"Е","F":"Ф","G":"Г","H":"Х","I":"И","J":"Ј","K":"К",
      "L":"Л","M":"М","N":"Н","O":"О","P":"П","R":"Р","S":"С","Š":"Ш","T":"Т","U":"У","V":"В","Z":"З","Ž":"Ж",
      "a":"а","b":"б","c":"ц","č":"ч","ć":"ћ","d":"д","đ":"ђ","e":"е","f":"ф","g":"г","h":"х","i":"и","j":"ј","k":"к",
      "l":"л","m":"м","n":"н","o":"о","p":"п","r":"р","s":"с","š":"ш","t":"т","u":"у","v":"в","z":"з","ž":"ж",
      "Q":"К","W":"В","X":"Кс","Y":"Ј","q":"к","w":"в","x":"кс","y":"ј"
    };
    let out = "";
    for(const ch of s){
      out += (map[ch] ?? ch);
    }
    return out;
  }

  function renderCategories(){
    catTabs.innerHTML = "";
    CATEGORIES.forEach(([name], idx)=>{
      const t = document.createElement("div");
      t.className = "tab" + (idx===0 ? " active": "");
      t.setAttribute("role","tab");
      t.dataset.index = idx;
      t.textContent = latinToggle.checked ? name : latinToCyrillic(name);
      t.addEventListener("click", ()=>{
        $$("#catTabs .tab").forEach(x=>x.classList.remove("active"));
        t.classList.add("active");
        renderCategory(idx);
      });
      catTabs.appendChild(t);
    });
    renderCategory(0);
  }

  function renderCategory(i){
    const [name, arr] = CATEGORIES[i];
    catContent.innerHTML = "";
    const latin = latinToggle.checked;
    for(const p of arr){
      const b = document.createElement("button");
      b.className = "phrase";
      b.type = "button";
      const label = latin ? p : latinToCyrillic(p);
      b.textContent = label;
      b.addEventListener("click", ()=>{
        if(textOut.value && !textOut.value.endsWith(" ")) textOut.value += " ";
        textOut.value += label;
        saveState();
      });
      catContent.appendChild(b);
    }
  }

  // Insert text at caret
  function insertText(s){
    const start = textOut.selectionStart;
    const end = textOut.selectionEnd;
    const before = textOut.value.slice(0, start);
    const after = textOut.value.slice(end);
    textOut.value = before + s + after;
    const pos = start + s.length;
    textOut.setSelectionRange(pos, pos);
    textOut.focus();
    saveState();
  }

  function saveState(){
    const state = {
      text: textOut.value,
      latin: latinToggle.checked,
      caps: capsToggle.checked,
      left: leftHandToggle.checked
    };
    localStorage.setItem("sr_board_state_v2", JSON.stringify(state));
  }
  function loadState(){
    const raw = localStorage.getItem("sr_board_state_v2");
    if(!raw) return;
    try{
      const s = JSON.parse(raw);
      textOut.value = s.text || "";
      latinToggle.checked = !!s.latin;
      capsToggle.checked = !!s.caps;
      leftHandToggle.checked = s.left !== false; // default true
      if(s.left === false) document.body.classList.add("righty"); else document.body.classList.remove("righty");
    }catch(e){}
  }

  // Button handlers
  backspaceBtn.addEventListener("click", ()=>{
    const start = textOut.selectionStart, end = textOut.selectionEnd;
    if(start !== end){
      const before = textOut.value.slice(0, start);
      const after = textOut.value.slice(end);
      textOut.value = before + after;
      textOut.setSelectionRange(start, start);
    } else if(start > 0){
      const before = textOut.value.slice(0, start-1);
      const after = textOut.value.slice(start);
      textOut.value = before + after;
      textOut.setSelectionRange(start-1, start-1);
    }
    textOut.focus();
    saveState();
  });
  spaceBtn.addEventListener("click", ()=>{ insertText(" "); });
  enterBtn.addEventListener("click", ()=>{ insertText("\n"); });
  clearBtn.addEventListener("click", ()=>{
    if(confirm("Očistiti tekst?")) { textOut.value=""; saveState(); }
  });
  copyBtn.addEventListener("click", async ()=>{
    try{
      await navigator.clipboard.writeText(textOut.value);
      toast("Kopirano u klipbord.");
    }catch(e){ toast("Nije moguće kopirati."); }
  });
  shareBtn.addEventListener("click", ()=> doSystemShare(textOut.value));
  sysShareBtn.addEventListener("click", ()=> doSystemShare(textOut.value));

  function doSystemShare(text){
    if(!text || !text.trim()){
      shareStatus.textContent = "Unesite nešto teksta za deljenje.";
      return;
    }
    if(navigator.share){
      navigator.share({text}).then(()=>{
        shareStatus.textContent = "Podeljeno.";
      }).catch(err=>{
        if(err && err.name === "AbortError"){ shareStatus.textContent = "Deljenje otkazano."; }
        else { shareStatus.textContent = "Deljenje nije uspelo."; }
      });
    } else {
      navigator.clipboard.writeText(text).then(()=>{
        shareStatus.textContent = "Sistemsko deljenje nije dostupno. Tekst je kopiran — zalepite ga na drugom uređaju.";
      }).catch(()=>{
        shareStatus.textContent = "Deljenje nije dostupno.";
      });
    }
  }

  function smallVibrate(){ if(navigator.vibrate) navigator.vibrate(7); }

  // Layout hand
  leftHandToggle.addEventListener("change", ()=>{
    if(leftHandToggle.checked){ document.body.classList.remove("righty"); }
    else { document.body.classList.add("righty"); }
    saveState();
  });

  // Rebuild on toggles
  [capsToggle, latinToggle].forEach(el => el.addEventListener("change", ()=>{
    buildKeys();
    renderCategories();
    saveState();
  }));

  // Persist main textarea
  textOut.addEventListener("input", saveState);

  // TTS
  let voices = [];
  let selectedVoice = null;
  function refreshVoices(){
    voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    selectedVoice = null;
    for(const v of voices){
      if(!selectedVoice && v.lang && v.lang.toLowerCase().startsWith("sr")) selectedVoice = v;
    }
    if(!selectedVoice){
      for(const v of voices){
        const ll = (v.lang||"").toLowerCase();
        if(ll.startsWith("hr") || ll.startsWith("bs")) { selectedVoice = v; break; }
      }
    }
  }
  if('speechSynthesis' in window){
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
  function speak(text){
    if(!('speechSynthesis' in window)){ alert("TTS nije dostupan u ovom pregledaču."); return; }
    if(!text || !text.trim()){ toast("Nema teksta za izgovor."); return; }
    const u = new SpeechSynthesisUtterance(text);
    if(selectedVoice) u.voice = selectedVoice;
    u.lang = selectedVoice ? selectedVoice.lang : "sr-RS";
    u.rate = 0.95; u.pitch = 1.0;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  speakBtn.addEventListener("click", ()=> speak(textOut.value));
  receiveSpeakBtn.addEventListener("click", ()=> speak(receiveBox.value));
  receiveCopyBtn.addEventListener("click", ()=>{
    textOut.value = (textOut.value && !textOut.value.endsWith("\n") ? textOut.value + "\n" : textOut.value) + receiveBox.value;
    saveState();
    toast("Prebačeno u glavno polje.");
  });

  // Install prompt
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    installBtn.disabled = false;
  });
  installBtn.addEventListener("click", async ()=>{
    if(deferredPrompt){
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    } else {
      alert("Ako dugme ne radi, koristite meni pregledača → „Dodaj na početni ekran”.");
    }
  });

  // Help
  helpBtn.addEventListener("click", ()=>{
    alert("Saveti:\n\n• U gornjem polju unesite poruku ili dodirnite gotove fraze ispod.\n• Latinica/Ćirilica prebacujete u desnom uglu. Levoruko pomera raspored.\n• Deljenje: koristite sistemsko deljenje (Nearby Share/BT/Wi‑Fi Direct). Za QR: u Chrome meniju izaberite „Deli” → „QR kod”, zatim na drugom uređaju iz „Primi” taba skenirajte.\n• Aplikacija radi offline nakon prvog učitavanja.");
  });

  // Camera scanning via BarcodeDetector (QR). Works offline.
  let scanning = false; let stream = null;
  async function startScan(){
    scanStatus.textContent = "";
    if(!('BarcodeDetector' in window)){ scanStatus.textContent = "Skeniranje nije podržano na ovom uređaju."; return; }
    const formats = await BarcodeDetector.getSupportedFormats();
    if(!formats.includes("qr_code")){ scanStatus.textContent = "QR format nije podržan."; return; }
    try{
      const det = new BarcodeDetector({formats:["qr_code"]});
      stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      preview.srcObject = stream; preview.classList.remove("hidden"); await preview.play();
      scanCanvas.width = preview.videoWidth; scanCanvas.height = preview.videoHeight; scanCanvas.classList.add("hidden");
      scanning = true; stopScanBtn.disabled = false; startScanBtn.disabled = true;
      const ctx = scanCanvas.getContext("2d");
      const loop = async () => {
        if(!scanning) return;
        ctx.drawImage(preview, 0, 0, scanCanvas.width, scanCanvas.height);
        try{
          const codes = await det.detect(scanCanvas);
          if(codes && codes.length){
            const v = codes[0].rawValue;
            receiveBox.value = v; speak(v);
            scanStatus.textContent = "QR prepoznat.";
            stopScan(); return;
          }
        }catch(e){}
        requestAnimationFrame(loop);
      };
      loop();
    }catch(err){ console.warn(err); scanStatus.textContent = "Kamera nije dostupna."; }
  }
  function stopScan(){
    scanning = false; stopScanBtn.disabled = true; startScanBtn.disabled = false;
    if(stream){ stream.getTracks().forEach(t=>t.stop()); stream = null; }
    preview.pause(); preview.srcObject = null; preview.classList.add("hidden");
  }
  startScanBtn.addEventListener("click", startScan);
  stopScanBtn.addEventListener("click", stopScan);

  // System share shortcut
  $("#shareBtn").addEventListener("click", ()=> doSystemShare(textOut.value));

  // Toast helper
  let toastTimer;
  function toast(msg){
    shareStatus.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{ shareStatus.textContent = ""; }, 3000);
  }

  // Init
  loadState();
  buildKeys();
  renderCategories();

  textOut.addEventListener("focus", ()=>{ textOut.setSelectionRange(textOut.value.length, textOut.value.length); });
})();
