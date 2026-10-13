const categories = {
  "Wet": {icon:"🥬", description:"Organic / food waste. Use the wet-waste compartment.", bin:"Wet waste"},
  "Dry": {icon:"🧴", description:"Dry recyclable waste such as clean paper or plastic.", bin:"Dry waste"},
  "E-Waste": {icon:"🔌", description:"Electronic items and accessories. Keep separate for approved collection.", bin:"E-waste"},
  "Hazardous": {icon:"⚠️", description:"Potentially hazardous material. Follow local safe-disposal guidance.", bin:"Hazardous waste"}
};
const initialBins = [
  {name:"Wet waste", category:"Wet", icon:"🥬", level:0, color:"green"},
  {name:"Dry waste", category:"Dry", icon:"🧴", level:0, color:"blue"},
  {name:"E-waste", category:"E-Waste", icon:"🔌", level:0, color:"purple"},
  {name:"Hazardous waste", category:"Hazardous", icon:"⚠️", level:0, color:"orange"}
];
// v2 storage intentionally starts every bin at 0%, instead of reusing old demo progress.
const STORAGE_VERSION = "v3";
function loadStored(key, fallback){
  try { const raw=localStorage.getItem(key); return raw===null?fallback:JSON.parse(raw); }
  catch(error){ return fallback; }
}
let bins = loadStored("ecosort_bins_" + STORAGE_VERSION, initialBins.map(x=>({...x})));
let records = loadStored("ecosort_records_" + STORAGE_VERSION, []);
let adminAlerts = loadStored("ecosort_admin_alerts_" + STORAGE_VERSION, []);
// Guard against stale or malformed browser data.
if(!Array.isArray(bins) || bins.length!==initialBins.length) bins=initialBins.map(x=>({...x}));
if(!Array.isArray(records)) records=[];
if(!Array.isArray(adminAlerts)) adminAlerts=[];
let selectedCategory = "";
let selectedFile = null;
const $ = id => document.getElementById(id);
const timeNow = () => new Date().toLocaleString([], {month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"});
function save(){try{localStorage.setItem("ecosort_bins_" + STORAGE_VERSION,JSON.stringify(bins));localStorage.setItem("ecosort_records_" + STORAGE_VERSION,JSON.stringify(records));localStorage.setItem("ecosort_admin_alerts_" + STORAGE_VERSION,JSON.stringify(adminAlerts));}catch(error){console.warn("EcoSort could not save browser data",error);}}
function binState(level){return level>=90?["Critical","danger"]:level>=80?["Nearly full","warn"]:["Normal","ok"];}
function binCard(bin){let [state,cls]=binState(bin.level);return `<article class="bin-card"><div class="bin-head"><span class="bin-emoji">${bin.icon}</span><span class="mini-status ${cls==="warn"?"warn-text":cls==="danger"?"danger-text":""}">${state}</span></div><h4>${bin.name}</h4><div class="capacity">${bin.level}%</div><div class="progress"><span class="${cls}" style="width:${bin.level}%"></span></div><small>${100-bin.level}% capacity remaining</small></article>`;}
function renderBins(){ $("dashboard-bins").innerHTML=bins.map(binCard).join(""); $("attention-count").textContent=bins.filter(b=>b.level>=80).length; $("alert-count").textContent=adminAlerts.length; $("manage-bins").innerHTML=bins.map((b,i)=>{let [state,cls]=binState(b.level);return `<article class="manage-card"><div class="manage-head"><span class="bin-emoji">${b.icon}</span><div><h3>${b.name}</h3><p>Capacity monitoring · Demo sensor</p></div><span class="manage-percent">${b.level}%</span></div><div class="progress"><span class="${cls}" style="width:${b.level}%"></span></div><input aria-label="${b.name} fill level" type="range" min="0" max="100" value="${b.level}" data-bin="${i}"><div class="range-labels"><span>Empty · 0%</span><span>Full · 100%</span></div><div class="manage-foot"><span class="mini-status ${cls==="warn"?"warn-text":cls==="danger"?"danger-text":""}">${state}</span><button class="text-btn reset-bin" data-bin="${i}">Reset level</button></div></article>`}).join("");}
function categoryTag(cat){return `<span class="tag ${cat}">${cat}</span>`}
function rowRecord(r,includeQty=false){return `<tr><td>${escapeHTML(r.name||"Waste item")}</td><td>${categoryTag(r.category)}</td>${includeQty?`<td>${r.quantity}</td>`:""}<td>${r.time}</td><td><span class="mini-status">${r.status||"Recorded"}</span></td></tr>`}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderRecords(){
 $("total-items").textContent=records.reduce((n,r)=>n+Number(r.quantity||1),0);
 $("report-summary").textContent=`${records.length} record${records.length===1?"":"s"}`;
 $("recent-table").innerHTML=records.slice(0,5).map(r=>rowRecord(r)).join("")||'<tr><td colspan="4" class="empty-row">No activity yet. Classify a waste item to get started.</td></tr>';
 $("report-table").innerHTML=records.map(r=>rowRecord(r,true)).join("")||'<tr><td colspan="5" class="empty-row">No records yet. Your recorded items will appear here.</td></tr>';
}
function renderAdminAlerts(){
  const list=$("admin-alert-list");
  if(!adminAlerts.length){list.innerHTML='<article class="panel empty-alert"><span>✓</span><div><b>No bin-full alerts yet</b><p>When a bin reaches 100%, the alert will be recorded here.</p></div></article>';}
  else {list.innerHTML=adminAlerts.map(a=>`<article class="panel alert-entry"><span class="alert-symbol">⚠</span><div class="alert-copy"><b>${escapeHTML(a.bin)} is FULL (100%)</b><p>${escapeHTML(a.message||"Please arrange waste collection.")}</p><small>${escapeHTML(a.time)}</small></div><span class="alert-chip">BIN FULL</span></article>`).join("");}
  const permission=$("notification-permission");
  if(!("Notification" in window)) permission.textContent="This browser does not support desktop notifications. In-app alert history still works.";
  else permission.textContent="Browser permission: "+Notification.permission+". Desktop alerts appear only if permission is granted and this page is open.";
}
function notifyAdminIfFull(bin,previousLevel){
  if(previousLevel < 100 && bin.level >= 100){
    const alert={id:Date.now()+"-"+bin.category,bin:bin.name,time:timeNow(),message:"The bin has reached 100% capacity. Please arrange collection."};
    adminAlerts.unshift(alert);
    if(adminAlerts.length>50) adminAlerts=adminAlerts.slice(0,50);
    save();
    if("Notification" in window && Notification.permission === "granted"){
      try { new Notification("EcoSort: Bin Full",{body:bin.name+" has reached 100% capacity. Please arrange collection."}); } catch(e) { /* In-app alert remains available. */ }
    }
    renderAdminAlerts();
    toast("ADMIN ALERT: "+bin.name+" is full. Check Admin Notifications.");
  }
}
function renderAll(){renderBins();renderRecords();renderAdminAlerts();save();}
function toast(message){const t=$("toast");t.textContent=message;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2600);}
function go(target){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===target));document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.target===target));const titles={dashboard:"Dashboard overview",classify:"Classify waste",bins:"Bin monitoring",reports:"Reports & activity",admin:"Admin notifications"};$("page-title").textContent=titles[target]||"EcoSort";window.scrollTo({top:0,behavior:"smooth"});}
document.querySelectorAll("[data-target]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.target)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
function chooseCategory(cat){selectedCategory=cat;document.querySelectorAll(".category-option").forEach(b=>b.classList.toggle("selected",b.dataset.category===cat));$("result-icon").textContent=categories[cat].icon;$("result-category").textContent=cat;$("result-description").textContent=categories[cat].description;$("record-btn").disabled=false;}
document.querySelectorAll(".category-option").forEach(b=>b.addEventListener("click",()=>chooseCategory(b.dataset.category)));
let mobileNetModel = null;
let modelLoadPromise = null;
function loadWasteModel(){
  if(mobileNetModel) return Promise.resolve(mobileNetModel);
  if(modelLoadPromise) return modelLoadPromise;
  modelLoadPromise = (async()=>{
    if(!window.mobilenet) throw new Error("AI library did not load. Check your internet connection.");
    mobileNetModel = await window.mobilenet.load({version:2, alpha:1.0});
    return mobileNetModel;
  })().catch(error=>{ modelLoadPromise=null; throw error; });
  return modelLoadPromise;
}
function mapPredictionToCategory(label){
  const x=String(label||"").toLowerCase();
  // Translate MobileNet/ImageNet object labels into the project's four waste bins.
  // This is a best-effort mapping; a general object model is not a waste-trained model.
  const hazardous=[
    "battery","batteries","pill bottle","syringe","pesticide","paint can","lighter",
    "razor","chemical","matchstick","safety pin","medical instrument","syringe"
  ];
  const ewaste=[
    "laptop","notebook computer","desktop computer","computer keyboard","keyboard",
    "computer mouse","monitor","screen","cellular telephone","mobile phone","telephone",
    "remote control","ipod","modem","printer","joystick","hard disc","hard drive",
    "digital clock","cassette player","radio","tape player","microphone","charger",
    "web site","digital watch","hand-held computer","cellular phone","pay-phone"
  ];
  const wet=[
    "banana","apple","orange","lemon","fig","pineapple","strawberry","broccoli",
    "cauliflower","cucumber","zucchini","acorn squash","bell pepper","mushroom",
    "granny smith","corn","artichoke","pomegranate","cabbage","head cabbage","pizza",
    "burrito","carbonara","hotdog","ice cream","cheeseburger","meat loaf","squash",
    "leaf","leaves","plant","tree","vegetable","produce","daisy","rapeseed","flower",
    "corn cob","greenhouse","pot","houseplant","grocery store","hay","straw","mushroom"
  ];
  const dry=[
    "paper towel","envelope","book jacket","comic book","newspaper","toilet tissue",
    "cardboard","carton","paper","notebook","binder","menu","book","jersey","jean",
    "denim","sweatshirt","suit","sock","coat","shirt","t-shirt","clothing","fabric",
    "shoe","running shoe","dress","wool","uniform","maillot","plastic bag","bag",
    "backpack","purse","wallet","sack","bottle","water bottle","pop bottle","tin can",
    "cup","mug","box","bucket","can opener","ashcan","mop","rag","towel","cloth",
    "curtain","laundry basket","shopping basket","umbrella","plastic","packet","wrapper",
    "bin","trash can","wastebasket","garbage can","dustbin","container","carton"
  ];
  if(hazardous.some(k=>x.includes(k))) return "Hazardous";
  if(ewaste.some(k=>x.includes(k))) return "E-Waste";
  if(wet.some(k=>x.includes(k))) return "Wet";
  if(dry.some(k=>x.includes(k))) return "Dry";
  return "";
}
function mapItemTextToCategory(text){
  const x=String(text||"").toLowerCase().replace(/[_-]+/g," ");
  if(/\b(battery|batteries|chemical|pesticide|paint|syringe|medicine|expired tablets|razor|sharp waste)\b/.test(x)) return "Hazardous";
  if(/\b(phone|mobile|laptop|computer|keyboard|mouse|charger|cable|earphone|headphone|electronic|electronics|remote|printer|monitor|tablet)\b/.test(x)) return "E-Waste";
  if(/\b(leaf|leaves|leaf litter|banana peel|peel|food|vegetable|fruit|flower|grass|garden waste|organic|leftover|tea leaves)\b/.test(x)) return "Wet";
  if(/\b(paper|newspaper|cardboard|carton|book|envelope|plastic|bottle|wrapper|can|metal|clothes|cloth|clothing|shirt|jeans|fabric|textile|shoe|dress)\b/.test(x)) return "Dry";
  return "";
}
async function classifyUploadedImage(file, imageElement){
  $("detected-object").textContent="AI is analysing the image…";
  $("result-category").textContent="Analysing…";
  $("result-description").textContent="Please wait while the image model loads.";
  $("record-btn").disabled=true;
  document.querySelectorAll(".category-option").forEach(b=>b.classList.remove("selected"));
  selectedCategory="";
  try{
    const model=await loadWasteModel();
    const predictions=await model.classify(imageElement,3);
    if(!predictions || !predictions.length) throw new Error("No object was recognised.");
    const best=predictions[0];
    // Check the top predictions, not only the first label. This improves category
    // suggestions when MobileNet's first label is a close visual match.
    const mappedPrediction=predictions
      .map(p=>({prediction:p, category:mapPredictionToCategory(p.className)}))
      .find(item=>item.category && item.prediction.probability>=0.025);
    const textHint=mapItemTextToCategory($("waste-name").value || file?.name || "");
    // Use the visual model first. The typed/filename hint is only a fallback,
    // so it cannot silently override what the image model sees.
    const category=mappedPrediction ? mappedPrediction.category : textHint;
    const categoryPrediction=mappedPrediction?.prediction || best;
    const confidence=Math.round(best.probability*100);
    $("detected-object").textContent=`AI object: ${best.className} (${confidence}% model confidence)`+
      (mappedPrediction?` · Category match: ${categoryPrediction.className}`:"")+
      (!mappedPrediction && textHint?` · Fallback item-name hint: ${textHint}`:"");
    if(category){
      chooseCategory(category);
      const source=mappedPrediction?"AI image prediction":"item-name hint (AI category unclear)";
      const itemLabel=mappedPrediction?categoryPrediction.className:($("waste-name").value || file?.name || "uploaded image");
      $("result-description").textContent=`Automatically suggested ${category} from ${source} (“${itemLabel}”). ${categories[category].description} Please verify the suggestion before recording.`;
      toast(`Detected category: ${category}. Please verify before recording.`);
    } else {
      $("result-icon").textContent="🔎";
      $("result-category").textContent="Needs manual review";
      $("result-description").textContent=`AI recognised “${best.className}”, but could not confidently map it to a waste type. Select the correct category manually.`;
      toast("AI object detected; choose a waste category manually.");
    }
  }catch(err){
    $("detected-object").textContent="AI recognition unavailable.";
    $("result-category").textContent="Manual category required";
    $("result-description").textContent="Could not load the image model. Check your internet connection, then choose the category manually.";
    toast("AI model unavailable. You can still select a category manually.");
  }
}
$("waste-image").addEventListener("change",e=>{
  const file=e.target.files[0];if(!file)return;
  if(!file.type.startsWith("image/")){toast("Please choose an image file.");return;}
  selectedFile=file;
  const reader=new FileReader();
  reader.onload=ev=>{
    $("image-preview").onload=()=>classifyUploadedImage(file,$("image-preview"));
    $("image-preview").src=ev.target.result;
    $("image-preview").hidden=false;
    $("preview-placeholder").hidden=true;
  };
  reader.readAsDataURL(file);
  if(!$("waste-name").value)$("waste-name").value=file.name.replace(/\.[^.]+$/ ,"").replace(/[_-]/g," ");
});
$("drop-zone").addEventListener("dragover",e=>{e.preventDefault();$("drop-zone").style.borderColor="#278456";});
$("drop-zone").addEventListener("dragleave",()=>$("drop-zone").style.borderColor="");
$("drop-zone").addEventListener("drop",e=>{e.preventDefault();$("drop-zone").style.borderColor="";const f=e.dataTransfer.files[0];if(f&&f.type.startsWith("image/")){$("waste-image").files=e.dataTransfer.files;$("waste-image").dispatchEvent(new Event("change"));}});
$("record-btn").addEventListener("click",()=>{if(!selectedCategory)return;let quantity=Math.max(1,Math.min(100,parseInt($("quantity").value,10)||1));records.unshift({name:$("waste-name").value.trim()||"Waste item",category:selectedCategory,quantity,time:timeNow(),status:"Recorded"});const bin=bins.find(b=>b.category===selectedCategory);if(bin){const previousLevel=bin.level;bin.level=Math.min(100,bin.level+Math.max(1,Math.round(quantity*1.5)));notifyAdminIfFull(bin,previousLevel);}$("waste-name").value="";$("quantity").value="1";$("waste-image").value="";$("image-preview").hidden=true;$("image-preview").src="";$("preview-placeholder").hidden=false;selectedFile=null;selectedCategory="";$("record-btn").disabled=true;$("detected-object").textContent="";document.querySelectorAll(".category-option").forEach(b=>b.classList.remove("selected"));$("result-icon").textContent="?";$("result-category").textContent="Not classified yet";$("result-description").textContent="Select a category to continue.";renderAll();toast("Disposal recorded and bin level updated.");});
$("manage-bins").addEventListener("change",e=>{if(e.target.matches('input[type="range"][data-bin]')){const i=Number(e.target.dataset.bin);const previousLevel=bins[i].level;bins[i].level=Number(e.target.value);notifyAdminIfFull(bins[i],previousLevel);renderAll();}});
$("manage-bins").addEventListener("click",e=>{const b=e.target.closest(".reset-bin");if(b){bins[Number(b.dataset.bin)].level=0;renderAll();toast("Bin level reset to 0% for demo.");}});
$("enable-notifications").addEventListener("click",async()=>{if(!("Notification" in window)){toast("This browser does not support desktop notifications.");renderAdminAlerts();return;}try{const permission=await Notification.requestPermission();renderAdminAlerts();toast(permission==="granted"?"Browser notifications enabled on this device.":"Permission not granted. In-app alerts will still be saved.");}catch(e){toast("Could not request notification permission.");}});
$("clear-alerts").addEventListener("click",()=>{if(!adminAlerts.length){toast("No alert history to clear.");return;}if(confirm("Clear all admin alert history from this browser?")){adminAlerts=[];renderAll();toast("Admin alert history cleared.");}});
$("reset-demo").addEventListener("click",()=>{
  if(!confirm("Reset all EcoSort demo data? Bin levels, waste records and alerts will return to zero.")) return;
  bins=initialBins.map(x=>({...x})); records=[]; adminAlerts=[];
  try{
    ["ecosort_bins_v1","ecosort_records_v1","ecosort_bins_v2","ecosort_records_v2","ecosort_admin_alerts_v1","ecosort_bins_v3","ecosort_records_v3","ecosort_admin_alerts_v3"].forEach(k=>localStorage.removeItem(k));
  }catch(error){ /* The in-memory reset still works if browser storage is blocked. */ }
  renderAll(); toast("Demo reset complete. All bin levels and counts are now zero.");
});
$("export-btn").addEventListener("click",()=>{if(!records.length){toast("No records to export yet.");return;}const rows=[["Item","Category","Quantity","Time","Status"],...records.map(r=>[r.name,r.category,r.quantity,r.time,r.status||"Recorded"])];const csv=rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download="ecosort-waste-report.csv";a.click();URL.revokeObjectURL(url);toast("CSV report exported.");});
$("clear-btn").addEventListener("click",()=>{if(!records.length){toast("There is no activity to clear.");return;}if(confirm("Clear all classification activity from this browser?")){records=[];renderAll();toast("Activity cleared.");}});
renderAll();