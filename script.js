(function(){
"use strict";

const STORAGE="memory_companion_dusk_v1";
const CATS={
  Medication:"pill",Meals:"meal",Exercise:"walk",Social:"social",Appointment:"calendar",PersonalCare:"care"
};
const CAT_ICON={pill:"💊",meal:"🍽",walk:"🚶",social:"🧩",calendar:"📅",care:"🧴"};

const defaultData=()=>({
  profile:{name:"Sarah Miller",role:"Primary Caregiver",email:"sarah@example.com"},
  patient:{name:"Robert",dailyNote:"A gentle morning. Remember to take it one step at a time, Robert."},
  people:[
    {id:id(),name:"Priya",relation:"Daughter",category:"Family",age:"41",phone:"+1 555 0142",livesIn:"Seattle, Washington",birthday:"October 14",pets:"Golden Retriever named Charlie",notes:"She loves gardening and making tea with you.",photo:""},
    {id:id(),name:"Michael",relation:"Grandson",category:"Family",age:"22",phone:"",livesIn:"",birthday:"",pets:"",notes:"He is currently studying music composition at the conservatory.",photo:""},
    {id:id(),name:"David",relation:"Old Friend",category:"Friends",age:"79",phone:"",livesIn:"",birthday:"",pets:"",notes:"We served in the Navy together. He tells great stories.",photo:""},
    {id:id(),name:"Elena",relation:"Caregiver",category:"Caregivers",age:"",phone:"",livesIn:"",birthday:"",pets:"",notes:"Helps with medications and physical therapy in the mornings.",photo:""}
  ],
  memories:[
    {id:id(),title:"Walking Charlie at Discovery Park",person:"Priya",date:"2026-08-16",created:new Date().toISOString(),description:"We had a wonderful afternoon walking Charlie near the water. The weather was perfect, and we stopped for ice cream afterwards. You mentioned how much you loved the sea breeze.",image:""},
    {id:id(),title:"Thanksgiving Dinner 2023",person:"Priya",date:"2023-11-23",created:new Date().toISOString(),description:"Priya hosted Thanksgiving this year. She made your favorite sweet potato casserole. The whole family was there, and we stayed up late playing board games by the fire.",image:""},
    {id:id(),title:"Priya's College Graduation",person:"Priya",date:"2015-05-10",created:new Date().toISOString(),description:"A proud family memory.",image:""}
  ],
  routines:[
    {id:id(),title:"Breakfast: Oatmeal & Fruit",person:"",time:"08:00",category:"Meals",days:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],done:true,notes:""},
    {id:id(),title:"Morning Pills",person:"",time:"09:30",category:"Medication",days:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],done:false,notes:"Take after breakfast."},
    {id:id(),title:"Doctor's Appointment",person:"David",time:"10:30",category:"Appointment",days:["Tue"],done:false,notes:"Dr. Reynolds at the City Medical Center. David will pick you up."},
    {id:id(),title:"Lunch with Priya",person:"Priya",time:"13:00",category:"Meals",days:["Tue"],done:false,notes:"Sandwiches at the park cafe."},
    {id:id(),title:"Puzzle Time",person:"",time:"15:00",category:"Social",days:["Mon","Tue","Wed","Thu","Fri"],done:false,notes:"Landscape jigsaw."}
  ],
  notes:[{id:id(),person:"David",text:"Seemed a bit confused during lunch. Will monitor tomorrow.",created:new Date().toISOString()}],
  trash:[],
  activities:[
    {id:id(),type:"person",text:"Priya was successfully identified via facial scan.",detail:"Living Room Camera",when:new Date().toLocaleString()},
    {id:id(),type:"memory",text:"New memory added: Summer trip to Maine (1998).",detail:"Added by Sarah",when:new Date().toLocaleString()},
    {id:id(),type:"routine",text:"Afternoon Walk routine completed.",detail:"Marked by Robert",when:new Date().toLocaleString()}
  ],
  settings:{patientMode:false}
});

let db=load();
let page="dashboard", pPage="home", pPersonId=null, dPersonId=null;
let query="", filter="all", pFilter="all", modal=null;
let speechRecognition=null, isListening=false;
if(!Array.isArray(db.trash)){db.trash=[];save()}

function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(STORAGE));
    if(x&&x.people&&x.memories&&x.routines){
      if(!Array.isArray(x.notes))x.notes=[];
      if(!Array.isArray(x.trash))x.trash=[];
      if(!Array.isArray(x.activities))x.activities=[];
      if(!x.settings)x.settings={patientMode:false};
      if(!x.profile)x.profile={name:"Sarah Miller",role:"Primary Caregiver",email:""};
      if(!x.patient)x.patient={name:"Robert",dailyNote:"A gentle morning. Take it one step at a time."};
      return x;
    }
    return defaultData();
  }catch(e){return defaultData()}
}

function save(){localStorage.setItem(STORAGE,JSON.stringify(db))}
function esc(v){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function setPage(p){page=p;query="";render()}
function notify(msg){const e=document.createElement("div");e.className="toast";e.textContent=msg;document.body.appendChild(e);setTimeout(()=>e.remove(),3400)}
function act(type,text,detail=""){db.activities.unshift({id:id(),type,text,detail,when:new Date().toLocaleString()});db.activities=db.activities.slice(0,100);save()}
function icon(n){const m={dashboard:"▦",group:"◉",auto_stories:"▤",event_repeat:"↻",sticky_note_2:"▱",timeline:"◷",settings:"⚙",accessibility_new:"♿",add:"＋",person_add:"＋",photo_library:"▧",event_available:"✓",edit_note:"✎",notifications:"●",search:"⌕",person:"●",delete:"×",edit:"✎",close:"×",check:"✓",radio_button_unchecked:"○",add_photo_alternate:"▧",add_task:"✓",download:"↓",upload:"↑",mic:"🎙",stop:"■",play_arrow:"▶",lock:"🔒",phone:"📞",back:"←",exit:"⏻"};return m[n]||"•"}
function matches(o,keys){if(!query)return true;const q=query.toLowerCase();return keys.some(k=>String(o[k]||"").toLowerCase().includes(q))}
function title(){return ({dashboard:"Caregiver Dashboard",people:"People",memories:"Memories",routines:"Routines",notes:"Notes",activity:"Activity",scanner:"Face Scanner",trash:"Trash",settings:"Settings",profile:"Profile"})[page]}
function nav(p,ic,label){return `<button class="${page===p?"active":""}" data-nav="${p}"><span class="nav-icon">${icon(ic)}</span>${label}</button>`}

function layout(){
return `<aside class="sidebar">
  <div class="brand"><div class="brand-icon">M</div>Companion</div>
  <div class="nav">
    ${nav("dashboard","dashboard","Dashboard")}
    ${nav("people","group","People")}
    ${nav("memories","auto_stories","Memories")}
    ${nav("routines","event_repeat","Routines")}
    ${nav("notes","sticky_note_2","Care Notes")}
    ${nav("activity","timeline","Activity")}${nav("scanner","face","Face Scanner")}${nav("trash","delete","Trash")}
    ${nav("settings","settings","Settings")}
  </div>
  <button id="patientToggle" class="patient-toggle"><span>${icon("accessibility_new")}</span>Patient Mode<span class="state">${db.settings.patientMode?"ON":"OFF"}</span></button>
</aside>
<div class="main">
<header class="topbar"><h1>${title()}</h1><div class="top-actions">
${dashboardAlertRoutine()?`<span class="muted" style="font-size:13px;color:var(--danger);margin-right:8px">${icon("notifications")} Missed: ${esc(dashboardAlertRoutine().title)}</span>`:""}
<button class="icon-btn" id="notifyBtn" title="Notifications">${icon("notifications")}</button>
<button class="icon-btn" id="searchBtn" title="Search">${icon("search")}</button>
<div class="user"><div><b>${esc(db.profile.name)}</b><div class="muted" style="font-size:12px">${esc(db.profile.role)}</div></div><div class="avatar">${esc((db.profile.name||"M")[0].toUpperCase())}</div></div>
</div></header>
<main class="content" id="content"></main>
</div>`;
}

function dashboardAlertRoutine(){
  return db.routines.find(r=>r.category==="Medication" && !r.done) || null;
}

function dashboard(){
const alertR=dashboardAlertRoutine();
const doneCount=db.routines.filter(x=>x.done).length;
const totalCount=db.routines.length||1;
const pct=Math.round(doneCount/totalCount*100);
const recentMemories=db.memories.filter(m=>{const c=new Date(m.created||m.date||Date.now()).getTime();return Date.now()-c<7*86400000}).length;
return `<div class="header-row"><div><h2>Overview</h2><p class="muted" style="font-size:16px">Good morning, ${esc((db.profile.name||"Caregiver").split(" ")[0])}. Here's a snapshot of ${esc(db.patient.name)}'s care today.</p></div><button class="primary" data-add="quick">${icon("add")} Quick Entry</button></div>
<div class="metrics">
${metric("group","Tracked",db.people.length,"People")}
${metric("auto_stories","Shared",db.memories.length,"Memories")}
${metric("event_repeat","Today's Tasks",totalCount,"Total")}
${metricRing("Progress",pct,`${doneCount} Done`)}
</div>
${alertR?`<div class="alert-bar"><div class="alert-icon">${icon("notifications")}</div><div class="alert-body"><b>Alert: ${esc(alertR.title)} missed</b><div class="muted" style="margin-top:2px">Not marked done for ${esc(db.patient.name)}${alertR.time?` (Scheduled for ${fmtTime(alertR.time)})`:""}</div></div><div class="alert-actions"><button class="secondary" data-toggle="${alertR.id}">${icon("check")} Mark Done</button><button class="rosepill" style="height:44px" data-call="${esc(alertR.person||db.patient.name)}">${icon("phone")} Call Patient</button></div></div>`
:`<div class="ok-bar">${icon("check")} All of today's medications are marked done.</div>`}
<div class="grid-main">
<section class="panel"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3>Recent Activity</h3><button class="secondary" data-nav="activity">View All</button></div>${activityHTML(db.activities.slice(0,6))}</section>
<section>
<div class="panel"><h3>Quick Actions</h3><div class="qa-list">
<button class="qa-row" data-add="person"><span class="qa-icon">${icon("person_add")}</span>Add Person</button>
<button class="qa-row" data-wizard="routine"><span class="qa-icon">${icon("event_available")}</span>Create Routine</button>
<button class="qa-row" data-add="memory" style="grid-column:1/-1"><span class="qa-icon">${icon("photo_library")}</span>Log Memory</button>
</div></div>
<div class="insight-card"><div class="insight-tag">Daily Insight</div><p style="margin-top:8px;margin-bottom:0">${esc(db.patient.name)}'s engagement with memories: <b>${recentMemories} added this week</b>. ${db.memories.length?"Keep sharing familiar moments together.":"Add a memory to get started."}</p></div>
</section>
</div>`;
}

function fmtTime(t){if(!t)return"";const[h,m]=t.split(":").map(Number);const ap=h>=12?"PM":"AM";const hh=((h+11)%12)+1;return `${hh}:${String(m).padStart(2,"0")} ${ap}`}
function metric(ic,label,n,unit){return `<div class="metric"><div class="metric-top"><div class="metric-icon">${icon(ic)}</div></div><div class="metric-number">${n}</div><div class="metric-sub">${label} · ${unit}</div></div>`}
function metricRing(label,pct,sub){return `<div class="metric"><div class="metric-top"><div class="ring" style="background:conic-gradient(var(--primary) ${pct*3.6}deg,var(--panel3) 0)"><div style="width:34px;height:34px;border-radius:50%;background:var(--panel2);display:grid;place-items:center;font-size:11px">${pct}%</div></div></div><div class="metric-number" style="font-size:20px;margin-top:14px">${label}</div><div class="metric-sub">${sub}</div></div>`}
function activityHTML(list){
if(!list.length)return `<div class="empty">No activity yet.</div>`;
return `<div class="activity">${list.map(a=>`<div class="activity-item"><div class="activity-dot">${icon(a.type==="memory"?"auto_stories":a.type==="routine"?"check":a.type==="person"?"group":"edit_note")}</div><div><b>${esc(a.text)}</b><div class="muted">${esc(a.detail||"")}</div><small class="muted">${esc(a.when)}</small></div></div>`).join("")}</div>`;
}

function people(){
const data=db.people.filter(p=>matches(p,["name","relation","phone","notes"]));
return `<div class="header-row"><div><h2>People</h2><p class="muted">${db.people.length} connected profiles</p></div><button class="primary" data-add="person">${icon("person_add")} Add Person</button></div>${toolbar("Search people...")}<div class="cards">${data.map(p=>`<article class="person-card"><div class="person-head"><div class="person-avatar">${p.photo?`<img src="${p.photo}">`:icon("person")}</div><div style="flex:1"><h3>${esc(p.name)}</h3><div class="muted">${esc(p.relation)}${p.age?" · "+esc(p.age):""}</div></div><button class="icon-btn" data-edit="person" data-id="${p.id}">${icon("edit")}</button></div><p class="muted" style="min-height:42px">${esc(p.notes||"No notes.")}</p><div class="card-actions"><button class="secondary" data-view="${p.id}">View</button><button class="secondary danger" data-delete="person" data-id="${p.id}" type="button">Delete</button></div></article>`).join("")||empty("No people match your search.")}</div>`;
}

function memories(){
const data=db.memories.filter(m=>matches(m,["title","person","description"]));
return `<div class="header-row"><div><h2>Memories</h2><p class="muted">${db.memories.length} stories</p></div><button class="primary" data-add="memory">${icon("add_photo_alternate")} Add Memory</button></div>${toolbar("Search memories...")}<div class="cards">${data.map(m=>`<article class="memory-card"><div class="memory-image">${m.image?`<img src="${m.image}">`:icon("auto_stories")}</div><div style="padding-top:14px"><div style="display:flex;gap:10px;justify-content:space-between"><div><h3>${esc(m.title)}</h3><div class="muted">${esc(m.person||"Unassigned")} · ${esc(m.date||"")}</div></div><button class="icon-btn" data-edit="memory" data-id="${m.id}">${icon("edit")}</button></div><p class="muted">${esc(m.description||"")}</p><button class="secondary danger" style="width:100%" data-delete="memory" data-id="${m.id}" type="button">Delete</button></div></article>`).join("")||empty("No memories match your search.")}</div>`;
}

function routines(){
const data=db.routines.filter(r=>matches(r,["title","person","time","notes"]));
return `<div class="header-row"><div><h2>Routines</h2><p class="muted">${db.routines.length} routines · ${db.routines.filter(x=>x.done).length} completed</p></div><button class="primary" data-wizard="routine">${icon("add_task")} Add Routine</button></div>${toolbar("Search routines...")}${data.map(r=>`<div class="routine-row"><button class="check ${r.done?"done":""}" data-toggle="${r.id}">${icon(r.done?"check":"radio_button_unchecked")}</button><div class="routine-info"><h3 class="${r.done?"muted":""}" style="${r.done?"text-decoration:line-through":""}">${esc(r.title)}</h3><div class="muted">${esc(r.person||"No person")} · ${esc(fmtTime(r.time)||"No time")}${r.category?" · "+esc(r.category):""}</div><div style="margin-top:6px">${(r.days||[]).map(d=>`<span class="badge">${esc(d)}</span>`).join("")}</div><div class="muted">${esc(r.notes||"")}</div></div><button class="secondary" data-wizard="routine" data-id="${r.id}">Edit</button><button class="secondary danger" data-delete="routine" data-id="${r.id}" type="button">Delete</button></div>`).join("")||empty("No routines match your search.")}`;
}

function notes(){
const data=db.notes.filter(n=>matches(n,["person","text"]));
return `<div class="header-row"><div><h2>Care Notes</h2><p class="muted">${db.notes.length} caregiver notes</p></div><button class="primary" data-add="note">${icon("edit_note")} Add Note</button></div>${toolbar("Search notes...")}${data.map(n=>`<article class="panel" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;gap:10px"><div><b>${esc(n.person||"General")}</b><div class="muted">${new Date(n.created).toLocaleString()}</div></div><div><button class="icon-btn" data-edit="note" data-id="${n.id}">${icon("edit")}</button><button class="icon-btn" data-delete="note" data-id="${n.id}" type="button">${icon("delete")}</button></div></div><p style="font-size:17px">${esc(n.text)}</p></article>`).join("")||empty("No notes match your search.")}`;
}

function activity(){
let list=db.activities;
if(filter!=="all")list=list.filter(a=>a.type===filter);
if(query){const q=query.toLowerCase();list=list.filter(a=>(a.text+" "+a.detail).toLowerCase().includes(q))}
return `<div class="header-row"><div><h2>Activity</h2><p class="muted">A record of actions in this workspace.</p></div><button class="secondary danger" id="clearActivity">Clear Activity</button></div>${toolbar("Search activity...")}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">${["all","person","memory","routine","note"].map(f=>`<button class="${filter===f?"primary":"secondary"}" style="height:40px" data-filter="${f}">${f[0].toUpperCase()+f.slice(1)}</button>`).join("")}</div><div class="panel">${activityHTML(list)}</div>`;
}

function scanner(){
const localWarning=location.protocol==="file:"?`<div class="face-status" style="margin-bottom:14px"><b>Camera note:</b> Chrome may block camera access from a <code>file://</code> page. Open this app through <b>http://localhost</b> instead.</div>`:"";
return `<div class="header-row"><div><h2>Face Scanner</h2><p class="muted">Live face recognition against people enrolled in this Memory Companion workspace.</p></div></div>${localWarning}
<div class="grid-main">
<section class="face-scan-panel">
  <div class="face-video-wrap">
    <video id="faceVideo" autoplay muted playsinline></video>
    <canvas id="faceCanvas" class="face-overlay"></canvas>
  </div>
  <div class="form-actions" style="justify-content:flex-start">
    <button class="primary" id="startCamera">Start Scanner</button>
    <button class="secondary" id="stopCamera" disabled>Stop</button>
    <button class="secondary" id="toggleAutoScan" disabled>Auto Scan: Off</button><button class="secondary" id="cameraHelp">Camera Help</button>
  </div>
  <div id="faceStatus" class="face-status">Scanner is off.</div>
  <div id="faceResult" class="face-result"></div>
</section>
<section class="panel">
  <h3>Enrolled People</h3>
  <p class="muted">Add a person in two steps: first enter their details, then capture or upload their face photo.</p>
  <div style="margin-top:14px"><div class="muted" style="margin-bottom:12px">The recognition model uses each enrolled profile photo.</div>${db.people.map(p=>`<div class="face-person" style="padding:10px 0;border-bottom:1px solid var(--border)">${p.photo?`<img src="${p.photo}">`:`<div class="avatar">?</div>`}<div style="flex:1"><b>${esc(p.name)}</b><div class="muted">${p.photo?"Face enrolled":"No face photo"}</div></div><button class="secondary" style="height:38px;padding:0 12px" data-edit="person" data-id="${p.id}">Edit</button></div>`).join("")||`<div class="muted">No people enrolled.</div>`}</div>
  <button class="secondary" style="margin-top:18px" data-nav="people">Manage People</button>
</section>
</div>`;
}

function trash(){
  const groups={person:[],memory:[],routine:[],note:[]};
  db.trash.forEach(x=>{if(groups[x.type])groups[x.type].push(x)});
  const total=db.trash.length;
  return `<div class="header-row">
    <div><h2>Trash</h2><p class="muted">${total} deleted item${total===1?"":"s"} · Items stay here until permanently deleted or restored.</p></div>
    <div style="display:flex;gap:8px">
      <button class="secondary" id="restoreAll" ${total?"":"disabled"}>Restore All</button>
      <button class="secondary danger" id="emptyTrash" ${total?"":"disabled"}>Empty Trash</button>
    </div>
  </div>
  ${total?["person","memory","routine","note"].map(t=>groups[t].length?`
  <div class="panel" style="margin-bottom:18px">
    <h3 style="margin-bottom:14px">${t[0].toUpperCase()+t.slice(1)}s</h3>
    ${groups[t].map(x=>`
      <div class="routine-row" style="margin-bottom:8px">
        <div class="activity-dot">${icon(t==="person"?"group":t==="memory"?"auto_stories":t==="routine"?"event_repeat":"sticky_note_2")}</div>
        <div class="routine-info">
          <h3>${esc(trashLabel(x))}</h3>
          <div class="muted">Deleted ${esc(x.deletedAt || "")}</div>
        </div>
        <button class="secondary" data-restore="${x.trashId}">Restore</button>
        <button class="secondary danger" data-permanent="${x.trashId}">Delete Permanently</button>
      </div>`).join("")}
  </div>`:"").join(""):`<div class="panel empty">${icon("delete")}<div style="margin-top:10px">Trash is empty.</div></div>`}`;
}

function trashLabel(x){const o=x.item||{};return o.name||o.title||o.text||"Deleted item"}

function settings(){
return `<div class="header-row"><div><h2>Settings</h2><p class="muted">Local prototype configuration and data tools.</p></div></div>
<div class="panel" style="margin-bottom:18px"><h3>Caregiver Profile</h3><div class="form-grid" style="margin-top:16px"><input id="profileName" placeholder="Name" value="${esc(db.profile.name)}"><input id="profileRole" placeholder="Role" value="${esc(db.profile.role)}"><input class="full" id="profileEmail" placeholder="Email" value="${esc(db.profile.email)}"></div><div class="form-actions"><button class="primary" id="saveProfile">Save Profile</button></div></div>
<div class="panel" style="margin-bottom:18px"><h3>Patient</h3><div class="form-grid" style="margin-top:16px"><input id="patientName" placeholder="Patient name" value="${esc(db.patient.name)}"><input class="full" id="patientNote" placeholder="Daily note" value="${esc(db.patient.dailyNote)}"></div><div class="form-actions"><button class="primary" id="savePatient">Save Patient</button></div></div>
<div class="panel" style="margin-bottom:18px"><h3>Browser Notifications</h3><p class="muted">Permission: ${"Notification" in window?Notification.permission:"Unsupported"}</p><button class="secondary" id="requestNotify">Request Permission</button></div>
<div class="panel" style="margin-bottom:18px"><h3>Data</h3><p class="muted">Export a backup, import a backup, or reset the local demo.</p><div class="form-actions"><button class="secondary" id="exportBtn">${icon("download")} Export JSON</button><button class="secondary" id="importBtn">${icon("upload")} Import JSON</button><input id="importFile" type="file" accept=".json" hidden><button class="secondary danger" id="resetBtn">Reset</button></div></div>
<div class="panel"><h3>Patient Mode</h3><p class="muted">A larger-touch simplified presentation for the person receiving care.</p><button class="secondary" id="patientBtn">${db.settings.patientMode?"Disable":"Enable"} Patient Mode</button></div>`;
}

function profile(){
  const p=db.people.find(x=>x.id===dPersonId);
  if(!p)return empty("Person not found.");
  return `<div class="header-row"><div><button class="secondary" data-nav="people" style="margin-bottom:12px">${icon("back")} Back to People</button><h2>${esc(p.name)}</h2><p class="muted">${esc(p.relation)}</p></div></div>${personProfileInner(p,false)}`;
}

function toolbar(ph){return `<div class="toolbar"><input id="searchInput" value="${esc(query)}" placeholder="${ph}">${query?`<button class="secondary" id="clearSearch">Clear</button>`:""}</div>`}
function empty(x){return `<div class="empty">${esc(x)}</div>`}

function personProfileInner(p,big){
  const mems=db.memories.filter(m=>m.person===p.name);
  return `<div class="panel" style="margin-bottom:20px">
    <div style="display:flex;gap:20px;flex-wrap:wrap">
      <div class="pprofile-photo">${p.photo?`<img src="${p.photo}">`:icon("person")}</div>
      <div style="flex:1;min-width:220px">
        <div class="info-row"><span class="muted">Lives in</span><b>${esc(p.livesIn||"Not recorded")}</b></div>
        <div class="info-row"><span class="muted">Birthday</span><b>${esc(p.birthday||"Not recorded")}</b></div>
        <div class="info-row"><span class="muted">Pets</span><b>${esc(p.pets||"Not recorded")}</b></div>
        <div class="info-row" style="border-bottom:0"><span class="muted">Phone</span><b>${esc(p.phone||"Not recorded")}</b></div>
      </div>
    </div>
    <p class="muted" style="margin-top:14px">${esc(p.notes||"")}</p>
    <div class="form-actions" style="justify-content:flex-start;margin-top:6px">
      <button class="rosepill" style="height:46px" data-call="${esc(p.name)}">${icon("phone")} Call ${esc(p.name)}</button>
      <button class="secondary" data-add="memory" data-forperson="${esc(p.name)}">${icon("add_photo_alternate")} Add Memory</button>
    </div>
  </div>
  <h3 style="margin-bottom:14px">Shared Memories</h3>
  ${mems.length?mems.map(m=>`<div class="mem-entry"><div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(m.title)}</b><span class="muted">${esc(m.date||"")}</span></div><p class="muted" style="margin-top:6px;margin-bottom:${m.image?"12px":"0"}">${esc(m.description||"")}</p>${m.image?`<div class="memory-image" style="height:180px"><img src="${m.image}"></div>`:""}</div>`).join(""):empty("No shared memories yet.")}`;
}
function pLayout(){
return `<div class="pshell">
  <nav class="pnav">
    <div class="brand2"><div class="brand-icon">M</div>Memory Companion</div>
    <div class="plinks">
      ${pnav("home","Home")}
      ${pnav("memories","Memories")}
      ${pnav("routine","My Day")}
      ${pnav("profile","My Profile")}
      ${pnav("scanner","Who Is This?")}
    </div>
    <div class="spacer"></div>
    <button class="rosepill sos" id="sosBtn">Need Help</button>
    <button class="pexit" id="exitPatient" title="Exit Patient Mode">${icon("exit")}</button>
  </nav>
  <main id="pcontent"></main>
</div>`;
}

function pnav(p,label){
return `<button class="${pPage===p?"active":""}" data-pnav="${p}">${label}</button>`;
}

function pHome(){
const today=new Date();
const day=WEEKDAY_ABBR[today.getDay()];
const todays=db.routines.filter(r=>(r.days||[]).includes(day)).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
const completed=todays.filter(r=>r.done).length;
const next=todays.find(r=>!r.done);

return `<div class="pcard">
  <div style="text-align:center">
    <div class="muted" style="text-transform:uppercase;letter-spacing:.08em;font-size:12px">Today</div>
    <h2 style="margin-top:6px">Hello, ${esc(db.patient.name)}</h2>
    <p class="muted" style="max-width:650px;margin:10px auto">${esc(db.patient.dailyNote)}</p>
  </div>

  <div class="voice-mic" id="voiceMic">${icon("mic")}</div>

  <div id="voiceStatus" class="muted" style="text-align:center">Tap to speak</div>

  <div class="toolbar" style="margin-top:18px">
    <input id="voiceTypeInput" placeholder='Try: "What is my schedule today?"'>
    <button class="primary" id="voiceTypeSend">Ask</button>
  </div>

  <div id="voiceConfirm"></div>

  <div class="chips">
    <button class="chip" data-say="What is my schedule today?">
      <span class="ic">${icon("event_repeat")}</span>
      <div><b>What's my day?</b><div class="muted">Hear today's routine</div></div>
    </button>

    <button class="chip" data-say="Show me my memories">
      <span class="ic">${icon("auto_stories")}</span>
      <div><b>Show my memories</b><div class="muted">Look through familiar moments</div></div>
    </button>

    <button class="chip" data-say="Who is Priya?">
      <span class="ic">${icon("person")}</span>
      <div><b>Who is someone?</b><div class="muted">Ask about a person</div></div>
    </button>

    <button class="chip" data-say="I'm home">
      <span class="ic">${icon("check")}</span>
      <div><b>I'm home</b><div class="muted">Let your caregiver know</div></div>
    </button>
  </div>

  <div style="margin-top:28px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Today's Progress</h3>
      <span class="muted">${completed}/${todays.length} complete</span>
    </div>

    <div class="progress-track">
      <div class="progress-fill" style="width:${todays.length?completed/todays.length*100:0}%"></div>
    </div>

    ${next?`
    <div class="daily-note">
      <div class="tag">Next Up</div>
      <h3 style="margin-top:5px">${esc(next.title)}</h3>
      <div class="muted">${fmtTime(next.time)}${next.person?" · "+esc(next.person):""}</div>
    </div>`:`<div class="confirm-banner" style="margin-top:18px">Everything scheduled for today is complete.</div>`}
  </div>
</div>`;
}

function pMemories(){
let data=db.memories.filter(m=>matches(m,["title","person","description"]));

return `<div class="pcard">
  <div style="display:flex;justify-content:space-between;gap:15px;align-items:end">
    <div>
      <h2>My Memories</h2>
      <p class="muted">Familiar people, places, and moments.</p>
    </div>
  </div>

  ${toolbar("Search memories...")}

  <div class="filters">
    ${["all","Priya","Michael","David","Elena"].map(f=>`
      <button class="${pFilter===f?"active":""}" data-pfilter="${f}">
        ${f==="all"?"All":esc(f)}
      </button>`).join("")}
  </div>

  <div class="cards">
    ${data.filter(m=>pFilter==="all"||m.person===pFilter).map(m=>`
      <article class="memory-card">
        <div class="memory-image">
          ${m.image?`<img src="${m.image}" alt="">`:icon("auto_stories")}
        </div>

        <div style="padding-top:14px">
          <h3>${esc(m.title)}</h3>
          <div class="muted">${esc(m.person||"Shared memory")} · ${esc(m.date||"")}</div>
          <p class="muted">${esc(m.description||"")}</p>
        </div>
      </article>
    `).join("")||empty("No memories found.")}
  </div>
</div>`;
}

function pRoutine(){
const today=WEEKDAY_ABBR[new Date().getDay()];
const list=db.routines
  .filter(r=>(r.days||[]).includes(today))
  .sort((a,b)=>(a.time||"").localeCompare(b.time||""));

const done=list.filter(r=>r.done).length;

return `<div class="pcard">
  <div style="display:flex;justify-content:space-between;align-items:end;gap:15px">
    <div>
      <h2>My Day</h2>
      <p class="muted">${WEEKDAY_FULL[today]}</p>
    </div>
    <div class="muted">${done}/${list.length} complete</div>
  </div>

  <div class="progress-track" style="margin-bottom:25px">
    <div class="progress-fill" style="width:${list.length?done/list.length*100:0}%"></div>
  </div>

  <div class="ptimeline">
    ${list.length?list.map(r=>`
      <div class="ptl-row">
        <div class="ptl-time">${fmtTime(r.time)}</div>
        <div class="ptl-dot ${r.done?"done":""}"></div>

        <div class="ptl-card ${r.done?"":"now"}">
          <div style="display:flex;align-items:center;gap:12px">
            <button class="check ${r.done?"done":""}" data-toggle="${r.id}">
              ${icon(r.done?"check":"radio_button_unchecked")}
            </button>

            <div style="flex:1">
              <h3 style="${r.done?"text-decoration:line-through;color:var(--muted)":""}">
                ${esc(r.title)}
              </h3>

              <div class="muted">
                ${esc(r.category||"Routine")}
                ${r.person?" · "+esc(r.person):""}
              </div>

              ${r.notes?`<div class="muted" style="margin-top:5px">${esc(r.notes)}</div>`:""}
            </div>
          </div>
        </div>
      </div>
    `).join(""):empty("Nothing is scheduled for today.")}
  </div>
</div>`;
}

function pProfile(){
return `<div class="pcard">
  <h2>My Profile</h2>
  <p class="muted">Information your caregiver has saved for you.</p>

  <div style="margin-top:24px">
    <div class="info-row">
      <span class="muted">Name</span>
      <b>${esc(db.patient.name)}</b>
    </div>

    <div class="info-row">
      <span class="muted">Caregiver</span>
      <b>${esc(db.profile.name)}</b>
    </div>

    <div class="info-row">
      <span class="muted">Caregiver role</span>
      <b>${esc(db.profile.role)}</b>
    </div>

    <div class="info-row">
      <span class="muted">Contact</span>
      <b>${esc(db.profile.email||"Not provided")}</b>
    </div>
  </div>

  <div style="margin-top:25px">
    <h3>People I Know</h3>

    <div class="people-grid" style="margin-top:14px">
      ${db.people.map(p=>`
        <button class="pperson" data-pview="${p.id}">
          <div class="pperson-photo">
            ${p.photo?`<img src="${p.photo}" alt="">`:icon("person")}
          </div>
          <div class="pperson-body">
            <div class="tag">${esc(p.relation||"Person")}</div>
            <h3>${esc(p.name)}</h3>
          </div>
        </button>
      `).join("")}
    </div>
  </div>
</div>`;
}

function pScanner(){
return `<div class="pcard">
  <div style="text-align:center">
    <h2>Who Is This?</h2>
    <p class="muted">
      Look at the camera and Memory Companion will try to identify someone you know.
    </p>
  </div>

  <div class="face-scan-panel" style="margin-top:22px">
    <div class="face-video-wrap">
      <video id="faceVideo" autoplay muted playsinline></video>
      <canvas id="faceCanvas" class="face-overlay"></canvas>
    </div>

    <div class="form-actions" style="justify-content:center">
      <button class="primary" id="startCamera">Start Camera</button>
      <button class="secondary" id="stopCamera" disabled>Stop</button>
      <button class="secondary" id="toggleAutoScan" disabled>Auto Scan: Off</button>
    </div>

    <div id="faceStatus" class="face-status">
      Camera is off.
    </div>

    <div id="faceResult" class="face-result"></div>
  </div>
</div>`;
}

function fileAsData(file){
return new Promise(resolve=>{
  if(!file)return resolve("");
  const r=new FileReader();
  r.onload=()=>resolve(r.result);
  r.onerror=()=>resolve("");
  r.readAsDataURL(file);
});
}

function openForm(type,item,opts){
if(type==="person"){openPersonStepOne(item);return}

const isEdit=!!item;
let form="";

if(type==="memory")
form=`
<div class="form-grid">
<input id="fTitle" class="full" placeholder="Memory title" value="${esc(item?.title||"")}">

<select id="fPerson" class="full">
<option value="">Unassigned</option>
${db.people.map(p=>`
<option ${((item?.person)||opts?.forperson)===p.name?"selected":""}>
${esc(p.name)}
</option>`).join("")}
</select>

<input id="fDate" type="date" value="${esc(item?.date||"")}">
<input id="fImage" type="file" accept="image/*">

<textarea id="fDescription" class="full" placeholder="Description">
${esc(item?.description||"")}
</textarea>
</div>`;

if(type==="note")
form=`
<div class="form-grid">
<select id="fPerson" class="full">
<option value="">General</option>
${db.people.map(p=>`
<option ${item?.person===p.name?"selected":""}>
${esc(p.name)}
</option>`).join("")}
</select>

<textarea id="fText" class="full" style="min-height:200px" placeholder="Observation">
${esc(item?.text||"")}
</textarea>
</div>`;

const el=document.createElement("div");
el.className="modal-wrap";
el.id="modal";

el.innerHTML=`
<div class="modal">
<div class="modal-head">
<h3>${isEdit?"Edit ":"Add "}${type[0].toUpperCase()+type.slice(1)}</h3>
<button class="icon-btn" id="closeModal">${icon("close")}</button>
</div>

${form}

<div class="form-actions">
<button class="secondary" id="cancel">Cancel</button>
<button class="primary" id="save">Save</button>
</div>
</div>`;

document.body.appendChild(el);

document.getElementById("closeModal").onclick=closeModal;
document.getElementById("cancel").onclick=closeModal;
document.getElementById("save").onclick=()=>saveForm(type,item);
}

function openPersonStepOne(item){
const isEdit=!!item;
const el=document.createElement("div");

el.className="modal-wrap";
el.id="modal";

el.innerHTML=`
<div class="modal">
<div class="modal-head">
<h3>${isEdit?"Edit Person":"Add Person — Details"}</h3>
<button class="icon-btn" id="closeModal">${icon("close")}</button>
</div>

<p class="muted" style="margin-top:-8px;margin-bottom:18px">
Enter the person's information first. The next screen lets you capture or upload their face photo.
</p>

<div class="form-grid">

<input id="pfName" class="full" placeholder="Full name *" value="${esc(item?.name||"")}">

<input id="pfRelation" placeholder="Relationship" value="${esc(item?.relation||"")}">

<select id="pfCategory">
<option ${item?.category==="Family"||!item?"selected":""} value="Family">Family</option>
<option ${item?.category==="Friends"?"selected":""} value="Friends">Friends</option>
<option ${item?.category==="Caregivers"?"selected":""} value="Caregivers">Caregivers</option>
<option ${item?.category==="Other"?"selected":""} value="Other">Other</option>
</select>

<input id="pfAge" type="number" placeholder="Age" value="${esc(item?.age||"")}">

<input id="pfPhone" placeholder="Phone number" value="${esc(item?.phone||"")}">

<input id="pfLivesIn" placeholder="Lives in" value="${esc(item?.livesIn||"")}">

<input id="pfBirthday" placeholder="Birthday (e.g. October 14)" value="${esc(item?.birthday||"")}">

<input id="pfPets" class="full" placeholder="Pets" value="${esc(item?.pets||"")}">

<textarea id="pfNotes" class="full" placeholder="Important information, interests, preferences, reminders...">${esc(item?.notes||"")}</textarea>

</div>

<div class="form-actions">
<button class="secondary" id="cancel">Cancel</button>
<button class="primary" id="nextPerson">Next: Face Photo →</button>
</div>

</div>`;

document.body.appendChild(el);

document.getElementById("closeModal").onclick=closeModal;
document.getElementById("cancel").onclick=closeModal;

document.getElementById("nextPerson").onclick=()=>{
const name=document.getElementById("pfName").value.trim();

if(!name){
notify("Full name is required");
return;
}

openPersonStepTwo({
id:item?.id||id(),
name,
relation:document.getElementById("pfRelation").value.trim(),
category:document.getElementById("pfCategory").value,
age:document.getElementById("pfAge").value.trim(),
phone:document.getElementById("pfPhone").value.trim(),
livesIn:document.getElementById("pfLivesIn").value.trim(),
birthday:document.getElementById("pfBirthday").value.trim(),
pets:document.getElementById("pfPets").value.trim(),
notes:document.getElementById("pfNotes").value.trim(),
photo:item?.photo||""
},isEdit);
};
}

function openPersonStepTwo(person,isEdit){
const el=document.getElementById("modal");
if(!el)return;

el.innerHTML=`
<div class="modal">

<div class="modal-head">
<h3>${isEdit?"Update":"Add"} Face Photo</h3>
<button class="icon-btn" id="closeModal">${icon("close")}</button>
</div>

<p class="muted">
This photo will be used by the face scanner to recognize <b>${esc(person.name)}</b>.
</p>

<div style="background:var(--panel2);border-radius:20px;padding:18px;margin-top:16px">

<div id="photoPreview" style="width:100%;max-width:400px;aspect-ratio:4/3;margin:auto;background:#000;border-radius:16px;overflow:hidden;display:grid;place-items:center;color:var(--muted)">

<span id="photoPlaceholder">No photo captured</span>

<video id="personPhotoVideo" autoplay muted playsinline style="width:100%;height:100%;object-fit:cover;display:none"></video>

<img id="personPhotoImg" style="width:100%;height:100%;object-fit:cover;display:${person.photo?'block':'none'}" src="${person.photo||""}">

<canvas id="personPhotoCanvas" style="display:none"></canvas>

</div>

<div class="form-actions" style="justify-content:center;margin-top:14px">

<button class="secondary" id="openPersonCamera">
Open Camera
</button>

<button class="primary" id="takePersonPhoto" disabled>
Take Photo
</button>

<button class="secondary" id="personPhotoUploadBtn">
Upload Photo
</button>

<input id="personPhotoUpload" type="file" accept="image/*" capture="user" hidden>

</div>

<div id="photoStatus" class="face-status" style="margin-top:14px">
Use a clear, front-facing photo with one person visible.
</div>

</div>

<div class="form-actions">

<button class="secondary" id="backPerson">← Back</button>

<button class="secondary" id="skipPhoto">
${isEdit?"Keep Existing Photo":"Skip for Now"}
</button>

<button class="primary" id="savePerson">
Save Person
</button>

</div>

</div>`;

let stream=null;
let captured=person.photo||"";

const video=document.getElementById("personPhotoVideo");
const img=document.getElementById("personPhotoImg");
const placeholder=document.getElementById("photoPlaceholder");
const status=document.getElementById("photoStatus");
const cameraBtn=document.getElementById("openPersonCamera");
const takeBtn=document.getElementById("takePersonPhoto");
const uploadBtn=document.getElementById("personPhotoUploadBtn");
const upload=document.getElementById("personPhotoUpload");

const stop=()=>{
if(stream){
stream.getTracks().forEach(t=>t.stop());
stream=null;
}
takeBtn.disabled=true;
cameraBtn.disabled=false;
};

document.getElementById("closeModal").onclick=()=>{
stop();
closeModal();
};

document.getElementById("backPerson").onclick=()=>{
stop();
openPersonStepOne(person);
};

document.getElementById("skipPhoto").onclick=()=>{
stop();
savePersonRecord({...person,photo:captured});
};

document.getElementById("savePerson").onclick=()=>{
stop();
savePersonRecord({...person,photo:captured});
};

cameraBtn.onclick=async()=>{
try{
if(!navigator.mediaDevices?.getUserMedia)throw Error();

stream=await navigator.mediaDevices.getUserMedia({
video:{
facingMode:{ideal:"user"},
width:{ideal:640},
height:{ideal:480}
},
audio:false
});

video.srcObject=stream;
video.style.display="block";
img.style.display="none";
placeholder.style.display="none";

await video.play().catch(()=>{});

takeBtn.disabled=false;
cameraBtn.disabled=true;

status.textContent="Camera is live. Look at the camera, then press Take Photo.";

}catch(e){
status.textContent="Camera access failed. Allow camera permission or use Upload Photo.";
notify("Camera permission denied");
}
};

takeBtn.onclick=()=>{
const canvas=document.getElementById("personPhotoCanvas");

canvas.width=video.videoWidth||640;
canvas.height=video.videoHeight||480;

canvas.getContext("2d").drawImage(
video,
0,
0,
canvas.width,
canvas.height
);

captured=canvas.toDataURL("image/jpeg",.9);

img.src=captured;
img.style.display="block";
video.style.display="none";
placeholder.style.display="none";

status.textContent="Photo captured. Retake it or save the person.";
};

uploadBtn.onclick=()=>upload.click();

upload.onchange=()=>{
const f=upload.files[0];
if(!f)return;

const r=new FileReader();

r.onload=()=>{
captured=r.result;
img.src=captured;
img.style.display="block";
video.style.display="none";
placeholder.style.display="none";

status.textContent="Photo uploaded. Save the person to enroll this face.";
};

r.readAsDataURL(f);
};
}

function savePersonRecord(person){
const index=db.people.findIndex(p=>p.id===person.id);

if(index>=0)
db.people[index]=person;
else
db.people.unshift(person);

act(
"person",
`${index>=0?"Person updated":"Person added"}: ${person.name}`,
person.photo?"Face photo enrolled":"No face photo yet"
);

save();
closeModal();
render();
notify(index>=0?"Person updated":"Person added");
}

function closeModal(){
document.getElementById("modal")?.remove();
}

async function saveForm(type,item){
const o=item?{...item,id:item.id}:{id:id()};

if(type==="memory"){
o.title=document.getElementById("fTitle").value.trim();
o.person=document.getElementById("fPerson").value;
o.date=document.getElementById("fDate").value;
o.description=document.getElementById("fDescription").value.trim();
o.image=await fileAsData(document.getElementById("fImage").files[0])||o.image||"";
o.created=o.created||new Date().toISOString();

if(!o.title)
return notify("Title is required");
}

if(type==="note"){
o.person=document.getElementById("fPerson").value;
o.text=document.getElementById("fText").value.trim();
o.created=item?.created||new Date().toISOString();

if(!o.text)
return notify("Note is empty");
}

const arr=db[type+"s"];
const index=arr.findIndex(x=>x.id===o.id);

if(index>=0)
arr[index]=o;
else
arr.unshift(o);

act(
type,
`${type==="note"?"Note":type[0].toUpperCase()+type.slice(1)} ${index>=0?"updated":"added"}`,
o.name||o.title||o.text?.slice(0,80)||""
);

save();
closeModal();
render();
notify("Saved");
}

function quickAdd(){
const el=document.createElement("div");

el.className="modal-wrap";
el.id="modal";

el.innerHTML=`
<div class="modal">

<div class="modal-head">
<h3>Quick Entry</h3>
<button class="icon-btn" id="closeModal">${icon("close")}</button>
</div>

<div style="display:grid;gap:10px">

<button class="qa-row" data-quick="person">
<span class="qa-icon">${icon("person_add")}</span>
Add Person
</button>

<button class="qa-row" data-quick="memory">
<span class="qa-icon">${icon("photo_library")}</span>
Add Memory
</button>

<button class="qa-row" data-quick="routine">
<span class="qa-icon">${icon("event_available")}</span>
Add Routine
</button>

<button class="qa-row" data-quick="note">
<span class="qa-icon">${icon("edit_note")}</span>
Add Note
</button>

</div>
</div>`;

document.body.appendChild(el);

document.getElementById("closeModal").onclick=closeModal;

el.querySelectorAll("[data-quick]").forEach(b=>
b.onclick=()=>{
closeModal();

b.dataset.quick==="routine"
?openRoutineWizard()
:openForm(b.dataset.quick);
});
}

let wStep=1,wData=null;

const CATEGORIES=[
["Medication","💊"],
["Meals","🍽"],
["Exercise","🚶"],
["Social","🧩"],
["Appointment","📅"],
["PersonalCare","🧴"]
];

function openRoutineWizard(item){
wStep=1;

wData=item?
{
id:item.id,
title:item.title,
person:item.person||"",
time:item.time||"08:00",
days:[...(item.days||[])],
category:item.category||"Medication",
notes:item.notes||"",
done:item.done||false
}
:
{
id:id(),
title:"",
person:"",
time:"08:00",
days:[],
category:"Medication",
notes:"",
done:false
};

const el=document.createElement("div");

el.className="modal-wrap";
el.id="modal";

el.innerHTML=`<div class="modal wide" id="wizModal"></div>`;

document.body.appendChild(el);

document.addEventListener("click",wizOutsideClose);

renderWizard();
}

function wizOutsideClose(e){}

function wizStepLabel(n){
return {
1:"Time",
2:"Category",
3:"Details",
4:"Assign"
}[n];
}

function renderWizard(){
const m=document.getElementById("wizModal");
if(!m)return;

const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

let body="";

if(wStep===1){

body=`
<h3 style="margin-bottom:10px">Time &amp; Frequency</h3>

<input id="wTime" type="time" value="${esc(wData.time)}" style="max-width:220px">

<div class="day-chips">
${days.map(d=>`
<button class="day-chip ${wData.days.includes(d)?"on":""}" data-day="${d}">
${d[0]}
</button>`).join("")}
</div>

<p class="muted" style="margin-top:10px">
Choose the days this routine repeats.
</p>`;
}
else if(wStep===2){

body=`
<h3 style="margin-bottom:10px">Category</h3>

<div class="cat-grid">
${CATEGORIES.map(([c,ic])=>`
<button class="cat-tile ${wData.category===c?"on":""}" data-cat="${c}">
<span style="font-size:20px">${ic}</span>
${c.replace(/([A-Z])/g," $1").trim()}
</button>`).join("")}
</div>`;
}
else if(wStep===3){

body=`
<h3 style="margin-bottom:10px">Details</h3>

<input id="wTitle"
placeholder="Routine title (e.g. Evening Medication)"
value="${esc(wData.title)}"
class="full"
style="margin-bottom:10px">

<textarea id="wNotes"
placeholder="Notes for this routine..."
>${esc(wData.notes)}</textarea>`;
}
else{

body=`
<h3 style="margin-bottom:10px">Assign</h3>

<select id="wPerson" class="full">

<option value="">
${esc(db.patient.name)} (Self)
</option>

${db.people.map(p=>`
<option ${wData.person===p.name?"selected":""}>
${esc(p.name)}
</option>`).join("")}

</select>

<p class="muted" style="margin-top:10px">
Choose who this routine involves, if anyone besides ${esc(db.patient.name)}.
</p>`;
}

m.innerHTML=`
<div class="modal-head">

<h3>Add New Routine</h3>

<button class="icon-btn" id="closeModal">
${icon("close")}
</button>

</div>

<div class="wiz-tabs">

${[1,2,3,4].map(n=>`
<button class="wiz-tab ${wStep===n?"on":""} ${wStep>n?"done":""}" data-step="${n}">
${n}. ${wizStepLabel(n)}
</button>`).join("")}

</div>

<div class="wiz-body">

<div>${body}</div>

${wizPreview()}

</div>

<div class="form-actions">

<button class="secondary" id="cancel">
Cancel
</button>

${wStep>1?`
<button class="secondary" id="wizBack">
Back
</button>`:""}

${wStep<4?
`<button class="primary" id="wizNext">Next →</button>`
:
`<button class="primary" id="wizSave">Save Routine</button>`}

</div>`;

document.getElementById("closeModal").onclick=closeModal;
document.getElementById("cancel").onclick=closeModal;

m.querySelectorAll("[data-step]").forEach(b=>
b.onclick=()=>{
const n=+b.dataset.step;

if(n<=wStep||wizValidate(wStep)){
wStep=n;
wizPull();
renderWizard();
}
});

m.querySelectorAll("[data-day]").forEach(b=>
b.onclick=()=>{
const d=b.dataset.day;

wData.days=wData.days.includes(d)
?wData.days.filter(x=>x!==d)
:[...wData.days,d];

renderWizard();
});

m.querySelectorAll("[data-cat]").forEach(b=>
b.onclick=()=>{
wData.category=b.dataset.cat;
renderWizard();
});

document.getElementById("wizBack")?.addEventListener(
"click",
()=>{
wizPull();
wStep--;
renderWizard();
}
);

document.getElementById("wizNext")?.addEventListener(
"click",
()=>{
if(!wizValidate(wStep))return;
wizPull();
wStep++;
renderWizard();
}
);

document.getElementById("wizSave")?.addEventListener(
"click",
()=>{
wizPull();
saveRoutineWizard();
}
);
}

function wizPull(){
if(wStep===1){
const t=document.getElementById("wTime");
if(t)wData.time=t.value||wData.time;
}

if(wStep===3){
const t=document.getElementById("wTitle");
const n=document.getElementById("wNotes");

if(t)wData.title=t.value.trim();
if(n)wData.notes=n.value.trim();
}

if(wStep===4){
const p=document.getElementById("wPerson");
if(p)wData.person=p.value;
}
}

function wizValidate(step){
if(step===3){
const t=document.getElementById("wTitle");

if(t&&!t.value.trim()){
notify("Give this routine a title");
return false;
}
}

return true;
}

function wizPreview(){
const upcoming=[...db.routines]
.sort((a,b)=>(a.time||"").localeCompare(b.time||""))
.slice(0,4);

return `
<div class="preview-panel">

<div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
${icon("timeline")} Live Preview
</div>

<div class="preview-item preview-new">

<div class="preview-time">
${fmtTime(wData.time)}
</div>

<div>
<b>${esc(wData.title||"New routine")}</b>

<div class="muted" style="font-size:12px">
${wData.category.replace(/([A-Z])/g," $1").trim()}
${wData.person?" · "+esc(wData.person):""}
</div>

</div>

</div>

${upcoming.map(r=>`
<div class="preview-item">

<div class="preview-time">
${fmtTime(r.time)}
</div>

<div>
<b>${esc(r.title)}</b>

<div class="muted" style="font-size:12px">
${esc(r.person||db.patient.name)}
</div>

</div>

</div>
`).join("")}

</div>`;
}

function saveRoutineWizard(){
if(!wData.title){
notify("Give this routine a title");
wStep=3;
renderWizard();
return;
}

const arr=db.routines;
const idx=arr.findIndex(x=>x.id===wData.id);

const record={
id:wData.id,
title:wData.title,
person:wData.person,
time:wData.time,
days:wData.days,
category:wData.category,
notes:wData.notes,
done:wData.done
};

if(idx>=0)
arr[idx]=record;
else
arr.unshift(record);

act(
"routine",
`Routine ${idx>=0?"updated":"added"}: ${record.title}`,
record.person||db.patient.name
);

save();
closeModal();
render();
notify("Routine saved");
}

function render(){
document.body.classList.toggle(
"patient-mode",
!!db.settings.patientMode
);

if(db.settings.patientMode){

document.getElementById("root").innerHTML=pLayout();

const c=document.getElementById("pcontent");

c.innerHTML={
home:pHome,
memories:pMemories,
routine:pRoutine,
profile:pProfile,
scanner:pScanner
}[pPage]();

}else{

document.getElementById("root").innerHTML=layout();

const c=document.getElementById("content");

c.innerHTML={
dashboard,
people,
memories,
routines,
notes,
activity,
scanner,
trash,
settings,
profile
}[page]();
}

bind();
}

function callPerson(name){
notify(`Calling ${name}...`);
act("person",`Call placed to ${name}`,"");
}

const WEEKDAY_ABBR=[
"Sun",
"Mon",
"Tue",
"Wed",
"Thu",
"Fri",
"Sat"
];

const WEEKDAY_NAMES=[
"sunday",
"monday",
"tuesday",
"wednesday",
"thursday",
"friday",
"saturday"
];

const WEEKDAY_FULL={
Sun:"Sunday",
Mon:"Monday",
Tue:"Tuesday",
Wed:"Wednesday",
Thu:"Thursday",
Fri:"Friday",
Sat:"Saturday"
};

function parseTimeFromText(text){

let m=text.match(
/\bat\s+(\d{1,2})(:(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i
);

if(!m)
m=text.match(
/\b(\d{1,2})(:(\d{2}))?\s*(am|pm)\b/i
);

if(!m)return null;

let h=parseInt(m[1],10);
let min=m[3]?parseInt(m[3],10):0;

let ap=(m[4]||"")
.toLowerCase()
.replace(/\./g,"");

if(ap==="pm"&&h<12)h+=12;
if(ap==="am"&&h===12)h=0;

if(isNaN(h)||h>23||h<0||min>59)return null;

return String(h).padStart(2,"0")+":"+String(min).padStart(2,"0");
}

function computeDaysFromText(text){

const t=text.toLowerCase();

if(/\btomorrow\b/.test(t)){
const d=new Date();
d.setDate(d.getDate()+1);
return [WEEKDAY_ABBR[d.getDay()]];
}

if(/\btoday\b|\btonight\b/.test(t)){
const d=new Date();
return [WEEKDAY_ABBR[d.getDay()]];
}

for(let i=0;i<WEEKDAY_NAMES.length;i++){
if(t.includes(WEEKDAY_NAMES[i]))
return [WEEKDAY_ABBR[i]];
}

if(/\bevery ?day\b|\bdaily\b/.test(t))
return [...WEEKDAY_ABBR];

return null;
}

function detectCategory(text){

const t=text.toLowerCase();

const map=[
["Medication",["pill","pills","medication","medicine","tablet","tablets"]],
["Meals",["breakfast","lunch","dinner","meal","snack"]],
["Exercise",["walk","exercise","stretch","jog","gym"]],
["Appointment",["appointment","doctor","dentist","checkup","clinic"]],
["PersonalCare",["bath","shower","shave","dress"]],
["Social",["visit","friend","game","puzzle","chat","tea","coffee"]]
];

for(const [cat,words] of map){
if(words.some(w=>t.includes(w)))
return cat;
}

return "Social";
}

function detectPerson(text){

const t=text.toLowerCase();

const found=db.people.find(
p=>p.name&&t.includes(p.name.toLowerCase())
);

return found?found.name:"";
}

function extractReminderTitle(text){

let t=text.trim();

t=t.replace(
/^(please\s+)?(remind me to\s+|add (a |an )?|schedule (a |an )?|set (a |an )?|create (a |an )?)/i,
""
);

t=t.replace(
/^(reminder|routine|task)\s+(to|for)\s+/i,
""
);

t=t.replace(
/\s*\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b.*$/i,
""
);

t=t.replace(
/\s*\b(tomorrow|today|tonight|every ?day|daily)\b.*$/i,
""
);

t=t.trim().replace(/[.?!]+$/,"");

if(!t)t="Reminder";

return t.charAt(0).toUpperCase()+t.slice(1);
}

function classifyIntent(text){

const t=text.toLowerCase().trim();

if(
(/\b(what|show me|list|tell me)\b.*(remind|schedule|routine|task|plan|agenda)/.test(t))||
(/\bmy (reminders?|schedule|routines?|tasks?|plan|agenda)\b/.test(t))||
/what do i have (today|tomorrow)/.test(t)||
/what('?s| is) (on|for) (my|the) (schedule|agenda|calendar)/.test(t)
)
return "query_schedule";

if(
/^(please\s+)?(remind me to|add (a |an )?(reminder|routine|task)?|schedule (a |an )?|set (a |an )?reminder|create (a |an )?(reminder|routine))/.test(t)
)
return "add_reminder";

if(/\b(photo|photos|picture|pictures|memor(y|ies))\b/.test(t))
return "show_photos";

if(/^call\b|\bcall\s+\w+/.test(t))
return "call";

if(/^who('?s| is)\b/.test(t))
return "who_is";

if(/\bi'?m home\b/.test(t))
return "home_confirm";

if(/open (my )?routine/.test(t))
return "open_routine";

return "unknown";
}

function speak(text){

try{

if(!("speechSynthesis" in window)||!text)
return;

window.speechSynthesis.cancel();

const u=new SpeechSynthesisUtterance(text);

u.rate=.95;

window.speechSynthesis.speak(u);

}catch(e){}
}

function showVoiceResponse(response){

notify(
response.length>140
?response.slice(0,140)+"…"
:response
);

const box=document.getElementById("voiceConfirm");

if(box&&pPage==="home"){
box.innerHTML=
`<div class="confirm-banner">${esc(response)}</div>`;
}
}

function executeVoiceCommand(rawText){

const text=(rawText||"").trim();

if(!text)return;

const intent=classifyIntent(text);

let response="";

if(intent==="query_schedule"){

const wantTomorrow=/tomorrow/i.test(text);

const targetAbbr=wantTomorrow
?WEEKDAY_ABBR[(new Date().getDay()+1)%7]
:WEEKDAY_ABBR[new Date().getDay()];

const list=db.routines
.filter(r=>(r.days||[]).includes(targetAbbr))
.sort((a,b)=>(a.time||"").localeCompare(b.time||""));

if(list.length){

response=
`Here's what you have ${wantTomorrow?"tomorrow":"today"}: `+
list
.map(r=>`${fmtTime(r.time)} — ${r.title}`)
.join("; ")+
".";

}else{

response=
`You have nothing scheduled ${wantTomorrow?"tomorrow":"today"}.`;

}

pPage="routine";
render();

}else if(intent==="add_reminder"){

const title=extractReminderTitle(text);

const time=parseTimeFromText(text)||"09:00";

const days=
computeDaysFromText(text)||
["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const category=detectCategory(text);

const person=detectPerson(text);

const record={
id:id(),
title,
person,
time,
days,
category,
notes:"",
done:false
};

db.routines.unshift(record);

act(
"routine",
`${title} added`,
"Via voice/typed request"
);

save();

response=
`Added: ${title} at ${fmtTime(time)}${
days.length===1
?" on "+WEEKDAY_FULL[days[0]]
:" every day"
}.`;

}else if(intent==="show_photos"){

const person=detectPerson(text);

query=person||"";

pPage="memories";

response=
person
?`Showing photos of ${person}.`
:"Showing all memories.";

render();

}else if(intent==="call"){

const person=
detectPerson(text)||
db.patient?.name||
"contact";

callPerson(person);

response=`Calling ${person}...`;

}else if(intent==="who_is"){

const person=detectPerson(text);

if(person){

const p=db.people.find(
x=>x.name===person
);

response=
`${person} is your ${p?.relation||"contact"}.`+
(p?.notes?" "+p.notes:"");

if(p){
pPersonId=p.id;
pPage="profile";
render();
}

}else{

response=
"I couldn't find that person in your people list.";

}

}else if(intent==="home_confirm"){

response=
`Welcome home, ${db.patient.name}.`;

act(
"person",
`${db.patient.name} confirmed arriving home`,
"Via voice"
);

save();

}else if(intent==="open_routine"){

pPage="routine";
render();

response="Here's your routine.";

}else{

response=
`I didn't quite catch that. Try things like "What's my schedule today?" or "Remind me to take my pills at 6pm."`;

}

showVoiceResponse(response);
speak(response);
}

function stopVoiceMicUI(){

isListening=false;

document.getElementById("voiceMic")
?.classList.remove("listening");

const status=
document.getElementById("voiceStatus");

if(
status&&
status.textContent.startsWith("Listening")
)
status.textContent="Tap to speak";
}

function stopVoiceMic(){

try{
speechRecognition?.stop();
}catch(e){}

stopVoiceMicUI();
}

function startVoiceMic(){

const SR=
window.SpeechRecognition||
window.webkitSpeechRecognition;

const status=
document.getElementById("voiceStatus");

const micBtn=
document.getElementById("voiceMic");

if(!SR){

if(status)
status.textContent=
"Voice input isn't supported in this browser — please type your request instead.";

return;
}

try{

speechRecognition=new SR();

speechRecognition.lang="en-US";
speechRecognition.interimResults=true;
speechRecognition.maxAlternatives=1;
speechRecognition.continuous=false;

isListening=true;

micBtn?.classList.add("listening");

if(status)
status.textContent="Listening…";

speechRecognition.onresult=(e)=>{

let interim="",final="";

for(
let i=e.resultIndex;
i<e.results.length;
i++
){

const t=
e.results[i][0].transcript;

if(e.results[i].isFinal)
final+=t;
else
interim+=t;
}

const s=
document.getElementById("voiceStatus");

if(s)
s.textContent=
final
?`Heard: "${final.trim()}"`
:`Listening… "${interim}"`;

if(final.trim())
executeVoiceCommand(final.trim());

};

speechRecognition.onerror=(e)=>{

const s=
document.getElementById("voiceStatus");

if(s)
s.textContent=
e.error==="not-allowed"
?"Microphone permission was denied. Please allow mic access, or type below."
:"I didn't catch that — try again or type below.";

stopVoiceMicUI();

};

speechRecognition.onend=()=>{
stopVoiceMicUI();
};

speechRecognition.start();

}catch(e){

if(status)
status.textContent=
"Could not start the microphone. Please type your request instead.";

stopVoiceMicUI();
}
}

function toggleVoiceMic(){

if(isListening){
stopVoiceMic();
return;
}

startVoiceMic();
}

function bind(){

if(!window.__memoryCompanionClickBound){

window.__memoryCompanionClickBound=true;

document.addEventListener("click",function(e){

const b=e.target.closest("button");

if(!b)return;

const nav=b.dataset.nav;

if(nav){
setPage(nav);
return;
}

const pnav=b.dataset.pnav;

if(pnav){
pPage=pnav;
query="";
render();
return;
}

const pfilter=b.dataset.pfilter;

if(pfilter){
pFilter=pfilter;
render();
return;
}

const pview=b.dataset.pview;

if(pview){
pPersonId=pview;
pPage="profile";
render();
return;
}

const view=b.dataset.view;

if(view){
dPersonId=view;
page="profile";
render();
return;
}

const call=b.dataset.call;

if(call){
callPerson(call);
return;
}

const say=b.dataset.say;

if(say){
executeVoiceCommand(say);
return;
}

const add=b.dataset.add;

if(add){

add==="quick"
?quickAdd()
:openForm(add,null,{forperson:b.dataset.forperson});

return;
}

const wiz=b.dataset.wizard;

if(wiz==="routine"){

const item=
b.dataset.id
?db.routines.find(x=>x.id===b.dataset.id)
:null;

openRoutineWizard(item);

return;
}

const editType=b.dataset.edit;

if(editType){

const collection={
person:"people",
memory:"memories",
routine:"routines",
note:"notes"
}[editType];

const item=
collection
?db[collection].find(x=>x.id===b.dataset.id)
:null;

if(item)
openForm(editType,item);

return;
}

const deleteType=b.dataset.delete;

if(deleteType){
remove(deleteType,b.dataset.id);
return;
}

const toggleId=b.dataset.toggle;

if(toggleId){

const r=
db.routines.find(
x=>x.id===toggleId
);

if(r){

r.done=!r.done;

act(
"routine",
`${r.title} ${r.done?"completed":"reopened"}`,
r.person||""
);

save();
render();

}

return;
}

const restoreId=b.dataset.restore;

if(restoreId){
restoreTrash(restoreId);
return;
}

const permanentId=b.dataset.permanent;

if(permanentId){
permanentDelete(permanentId);
return;
}

const filterType=b.dataset.filter;

if(filterType){
filter=filterType;
render();
return;
}

});

}

const s=document.getElementById("searchInput");

if(s&&!s.dataset.bound){

s.dataset.bound="1";

s.oninput=()=>{
query=s.value;

clearTimeout(window.searchTimer);

window.searchTimer=
setTimeout(render,180);
};

}

document.getElementById("clearSearch")
?.addEventListener(
"click",
()=>{
query="";
render();
}
);

document.getElementById("pClearSearch")
?.addEventListener(
"click",
()=>{
query="";
render();
}
);

document.getElementById("patientToggle")
?.addEventListener(
"click",
()=>{
db.settings.patientMode=true;
pPage="home";
save();
render();
}
);

document.getElementById("patientBtn")
?.addEventListener(
"click",
()=>{
db.settings.patientMode=
!db.settings.patientMode;
pPage="home";
save();
render();
}
);

document.getElementById("exitPatient")
?.addEventListener(
"click",
()=>{
db.settings.patientMode=false;
page="dashboard";
save();
render();
}
);

document.getElementById("sosBtn")
?.addEventListener(
"click",
()=>{
notify("Calling emergency contact...");
act("person","SOS Help triggered","");
}
);

document.getElementById("voiceMic")
?.addEventListener(
"click",
toggleVoiceMic
);

const voiceTypeInput=
document.getElementById("voiceTypeInput");

const voiceTypeSend=
document.getElementById("voiceTypeSend");

const sendTyped=()=>{

if(!voiceTypeInput)
return;

const v=
voiceTypeInput.value.trim();

if(!v)
return;

voiceTypeInput.value="";

executeVoiceCommand(v);
};

voiceTypeSend
?.addEventListener("click",sendTyped);

voiceTypeInput
?.addEventListener(
"keydown",
e=>{
if(e.key==="Enter"){
e.preventDefault();
sendTyped();
}
}
);

const startCameraBtn=
document.getElementById("startCamera");

const toggleAutoScanBtn=
document.getElementById("toggleAutoScan");

const stopCameraBtn=
document.getElementById("stopCamera");

if(startCameraBtn)
startCameraBtn.addEventListener(
"click",
startFaceCamera
);

if(toggleAutoScanBtn)
toggleAutoScanBtn.addEventListener(
"click",
toggleAutoScan
);

document.getElementById("cameraHelp")
?.addEventListener(
"click",
()=>{
notify(
location.protocol==="file:"
?"Run this through localhost, not file://"
:"Allow camera access in the browser"
);
}
);

if(stopCameraBtn)
stopCameraBtn.addEventListener(
"click",
stopFaceCamera
);

document.getElementById("notifyBtn")
?.addEventListener(
"click",
async()=>{
notify(`${db.activities.length} activity records`);

if(
"Notification"in window&&
Notification.permission==="granted"
)
new Notification(
"Memory Companion",
{
body:`${db.activities.length} activity records`
}
);
}
);

document.getElementById("searchBtn")
?.addEventListener(
"click",
()=>{
const p=
prompt("Search this section",query);

if(p!==null){
query=p;
render();
}
}
);

document.getElementById("clearActivity")
?.addEventListener(
"click",
()=>{
if(confirm("Clear activity history?")){
db.activities=[];
save();
render();
}
}
);

document.getElementById("saveProfile")
?.addEventListener(
"click",
()=>{
db.profile.name=
document.getElementById("profileName").value.trim()
||db.profile.name;

db.profile.role=
document.getElementById("profileRole").value.trim()
||db.profile.role;

db.profile.email=
document.getElementById("profileEmail").value.trim();

save();
render();
notify("Profile saved");
}
);

document.getElementById("savePatient")
?.addEventListener(
"click",
()=>{
db.patient.name=
document.getElementById("patientName").value.trim()
||db.patient.name;

db.patient.dailyNote=
document.getElementById("patientNote").value.trim();

save();
render();
notify("Patient details saved");
}
);

document.getElementById("requestNotify")
?.addEventListener(
"click",
async()=>{
if(!("Notification"in window))
return notify("Notifications are not supported here");

const p=
await Notification.requestPermission();

notify(
p==="granted"
?"Notifications enabled"
:"Notifications not enabled"
);

render();
}
);

document.getElementById("restoreAll")
?.addEventListener(
"click",
restoreAllTrash
);

document.getElementById("emptyTrash")
?.addEventListener(
"click",
emptyTrash
);

document.getElementById("exportBtn")
?.addEventListener(
"click",
exportData
);

document.getElementById("importBtn")
?.addEventListener(
"click",
()=>{
document.getElementById("importFile").click();
}
);

document.getElementById("importFile")
?.addEventListener(
"change",
importData
);

document.getElementById("resetBtn")
?.addEventListener(
"click",
()=>{
if(confirm("Reset all local data?")){
db=defaultData();
save();
render();
notify("Reset complete");
}
}
);
}

function remove(type,idv){

const arr=db[type+"s"];

const item=
arr.find(x=>x.id===idv);

if(!item)return;

if(!confirm(
`Move this ${type} to Trash? You can restore it later.`
))
return;

db[type+"s"]=
arr.filter(x=>x.id!==idv);

db.trash.unshift({
trashId:id(),
type,
item:JSON.parse(JSON.stringify(item)),
deletedAt:new Date().toLocaleString()
});

act(
type,
`${type[0].toUpperCase()+type.slice(1)} moved to Trash`,
trashLabel({item})
);

save();
render();
notify("Moved to Trash");
}

function restoreTrash(trashId){

const i=
db.trash.findIndex(
x=>x.trashId===trashId
);

if(i<0)return;

const x=db.trash[i];

const key=x.type+"s";

if(!db[key])return;

const restored={...x.item};

if(
db[key].some(
y=>y.id===restored.id
)
)
restored.id=id();

db[key].unshift(restored);

db.trash.splice(i,1);

act(
x.type,
`${x.type[0].toUpperCase()+x.type.slice(1)} restored`,
trashLabel(x)
);

save();
render();
notify("Restored");
}

function permanentDelete(trashId){

const i=
db.trash.findIndex(
x=>x.trashId===trashId
);

if(i<0)return;

const x=db.trash[i];

if(!confirm(
`Permanently delete ${trashLabel(x)}? This cannot be undone.`
))
return;

db.trash.splice(i,1);

act(
x.type,
`${x.type[0].toUpperCase()+x.type.slice(1)} permanently deleted`,
trashLabel(x)
);

save();
render();
notify("Permanently deleted");
}

function restoreAllTrash(){

if(!db.trash.length)return;

if(!confirm(
"Restore every item from Trash?"
))
return;

const items=[...db.trash];

db.trash=[];

for(const x of items){

const key=x.type+"s";

const restored={...x.item};

if(!db[key])continue;

if(
db[key].some(
y=>y.id===restored.id
)
)
restored.id=id();

db[key].unshift(restored);
}

act(
"trash",
"All deleted items restored"
);

save();
render();
notify("All items restored");
}

function emptyTrash(){

if(!db.trash.length)return;

if(!confirm(
"Permanently delete everything in Trash? This cannot be undone."
))
return;

const n=db.trash.length;

db.trash=[];

act(
"trash",
"Trash emptied",
`${n} items permanently deleted`
);

save();
render();
notify("Trash emptied");
}

function exportData(){

const blob=
new Blob(
[JSON.stringify(db,null,2)],
{type:"application/json"}
);

const a=
document.createElement("a");

a.href=
URL.createObjectURL(blob);

a.download=
"memory-companion-backup.json";

document.body.appendChild(a);

a.click();

setTimeout(()=>{
URL.revokeObjectURL(a.href);
a.remove();
},500);
}

async function importData(e){

try{

const file=e.target.files[0];

if(!file)return;

const x=
JSON.parse(
await file.text()
);

if(
!x.people||
!x.memories||
!x.routines||
!x.notes
)
throw Error("bad");

db=x;

save();
render();

notify("Backup imported");

}catch(err){

notify("Invalid backup file");

}

e.target.value="";
}

/* ================= Face scanner engine ================= */

let faceStream=null,
faceModelsReady=false,
faceMatcher=null,
faceAutoTimer=null,
faceScanning=false,
faceLastUnknownSignature="",
faceLastMatch="",
faceLastResultAt=0;

async function loadFaceModels(){

if(faceModelsReady)return;

const base=
"https://justadudewhohacks.github.io/face-api.js/models";

const status=
document.getElementById("faceStatus");

if(status)
status.textContent=
"Loading recognition model…";

await faceapi.nets.tinyFaceDetector.loadFromUri(base);

await faceapi.nets.faceLandmark68Net.loadFromUri(base);

await faceapi.nets.faceRecognitionNet.loadFromUri(base);

faceModelsReady=true;
}

async function buildFaceMatcher(){

await loadFaceModels();

const labeled=[];

for(const p of db.people){

if(!p.photo)
continue;

try{

const img=
await faceapi.fetchImage(p.photo);

const d=
await faceapi
.detectSingleFace(
img,
new faceapi.TinyFaceDetectorOptions({
inputSize:320,
scoreThreshold:.45
})
)
.withFaceLandmarks()
.withFaceDescriptor();

if(d)
labeled.push(
new faceapi.LabeledFaceDescriptors(
p.id,
[d.descriptor]
)
);

}catch(e){}
}

faceMatcher=
labeled.length
?new faceapi.FaceMatcher(labeled,.48)
:null;

return labeled.length;
}

function drawFaceBox(detection){

const video=
document.getElementById("faceVideo");

const canvas=
document.getElementById("faceCanvas");

if(!video||!canvas)return;

const displaySize={
width:video.clientWidth,
height:video.clientHeight
};

canvas.width=displaySize.width;
canvas.height=displaySize.height;

const ctx=canvas.getContext("2d");

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

const box=detection?.box;

if(!box)return;

const sx=
displaySize.width/video.videoWidth;

const sy=
displaySize.height/video.videoHeight;

const x=
displaySize.width-(box.x+box.width)*sx;

const y=box.y*sy;

const w=box.width*sx;

const h=box.height*sy;

ctx.strokeStyle="#e9dcc4";
ctx.lineWidth=3;

ctx.strokeRect(
x,
y,
w,
h
);
}

async function startFaceCamera(){

const status=
document.getElementById("faceStatus");

try{

if(!navigator.mediaDevices?.getUserMedia)
throw Error("Camera API unavailable");

status.textContent=
"Requesting camera permission…";

faceStream=
await navigator.mediaDevices.getUserMedia({
video:{
facingMode:{ideal:"user"},
width:{ideal:640},
height:{ideal:480}
},
audio:false
});

const video=
document.getElementById("faceVideo");

video.srcObject=faceStream;

await new Promise(resolve=>{
if(video.readyState>=2)
return resolve();

video.onloadedmetadata=()=>resolve();

setTimeout(resolve,3000);
});

await video.play().catch(()=>{});

document.getElementById("startCamera").disabled=true;

document.getElementById("stopCamera").disabled=false;

document.getElementById("toggleAutoScan").disabled=false;

status.textContent=
"Camera is live. Loading recognition model in the background…";

try{

if(typeof faceapi==="undefined")
throw Error("Face recognition library did not load");

const count=
await buildFaceMatcher();

if(count){

status.textContent=
`Camera ready. ${count} enrolled face${count===1?"":"s"}.`;

await scanCurrentFace();

}else{

status.innerHTML=
"Camera is working. <b>No enrolled face photos</b> found yet. Add photos under People.";
}

}catch(modelErr){

console.error(
"Face model error:",
modelErr
);

status.innerHTML=
"Camera is working, but the face-recognition model could not load. Check your internet connection, then refresh.";
}

}catch(e){

console.error(e);

if(e.name==="NotAllowedError"){

status.textContent=
"Camera permission was denied. Allow camera access for this site, then refresh.";

notify("Camera permission denied");

}else if(e.name==="NotFoundError"){

status.textContent=
"No camera was found on this device.";

notify("No camera found");

}else{

status.textContent=
"Camera could not start. Use localhost/HTTPS and allow camera access.";

notify("Camera could not start");
}
}
}

function stopFaceCamera(){

if(faceAutoTimer){
clearInterval(faceAutoTimer);
faceAutoTimer=null;
}

if(faceStream)
faceStream.getTracks().forEach(
t=>t.stop()
);

faceStream=null;
faceScanning=false;

const v=
document.getElementById("faceVideo");

if(v)
v.srcObject=null;

const canvas=
document.getElementById("faceCanvas");

if(canvas)
canvas.getContext("2d")
?.clearRect(
0,
0,
canvas.width,
canvas.height
);

const s=
document.getElementById("faceStatus");

if(s)
s.textContent="Scanner is off.";

const start=
document.getElementById("startCamera");

const stop=
document.getElementById("stopCamera");

const auto=
document.getElementById("toggleAutoScan");

if(start)
start.disabled=false;

if(stop)
stop.disabled=true;

if(auto){

auto.disabled=true;

auto.textContent=
"Auto Scan: Off";
}

faceLastMatch="";
faceLastUnknownSignature="";
}

async function captureCurrentFrame(){

const v=
document.getElementById("faceVideo");

const canvas=
document.createElement("canvas");

canvas.width=
v.videoWidth||640;

canvas.height=
v.videoHeight||480;

canvas.getContext("2d")
.drawImage(
v,
0,
0,
canvas.width,
canvas.height
);

return canvas.toDataURL(
"image/jpeg",
.88
);
}

function getPersonById(id){

return db.people.find(
p=>p.id===id
);
}

function showRecognizedPerson(
person,
confidence
){

const result=
document.getElementById("faceResult");

if(!result)return;

result.innerHTML=`
<div class="face-result-inner match">

<span class="match-found">
${icon("check")} Match Found
</span>

<div class="face-person">

${
person.photo
?`<img src="${person.photo}">`
:`<div class="avatar">${esc((person.name||"?")[0])}</div>`
}

<div>

<h3>${esc(person.name)}</h3>

<div class="muted">
Your ${esc(person.relation||"Person")}
${confidence?` · ${confidence.toFixed(0)}% match`:""}
</div>

</div>

</div>

<p class="muted" style="margin-top:14px">
${esc(person.notes||"No notes recorded.")}
</p>

<div class="form-actions" style="justify-content:flex-start;margin-top:14px">

<button
class="rosepill"
style="height:44px"
data-call="${esc(person.name)}"
>
${icon("phone")} Call ${esc(person.name)}
</button>

<button
class="secondary"
data-pview="${person.id}"
>
View Profile
</button>

</div>

<p class="muted" style="margin-top:14px;margin-bottom:0;font-size:12px">
Assistive identification only. Do not use a face match as the sole basis for a high-stakes decision.
</p>

</div>`;
}

function showUnknownFace(photo){

const n=
db.people.length+1;

const tempId=id();

const result=
document.getElementById("faceResult");

result.innerHTML=`
<div class="face-result-inner nomatch">

<div class="face-person">

<img src="${photo}" alt="Unknown face">

<div>
<h3>New person detected</h3>

<div class="muted">
This face does not match enrolled people with sufficient confidence.
</div>

</div>

</div>

<p class="muted">
Saved as a draft profile. Add a name and details now so future scans can recognize them.
</p>

<div class="form-actions" style="justify-content:flex-start">

<button class="primary" id="saveUnknown">
Create New Person
</button>

<button class="secondary" id="dismissUnknown">
Dismiss
</button>

</div>

</div>`;

document.getElementById("saveUnknown").onclick=()=>{

const person={
id:tempId,
name:`New Person ${n}`,
relation:"",
category:"Other",
age:"",
phone:"",
notes:"Added by face scanner",
photo
};

db.people.unshift(person);

act(
"person",
"New person created from face scan",
person.name
);

save();

closeFaceResultForEdit(person);
};

document.getElementById("dismissUnknown")
.onclick=()=>{
result.innerHTML="";
};
}

function closeFaceResultForEdit(person){

const result=
document.getElementById("faceResult");

result.innerHTML=`
<div class="face-result-inner match">

<h3>New profile created</h3>

<p class="muted">
${esc(person.name)} is now enrolled. Complete the profile information below.
</p>

<button class="primary" id="editNewPerson">
Complete Profile
</button>

</div>`;

document.getElementById("editNewPerson")
.onclick=()=>{
openForm("person",person);
};
}

async function scanCurrentFace(){

if(faceScanning||!faceStream)
return;

faceScanning=true;

const status=
document.getElementById("faceStatus");

try{

const video=
document.getElementById("faceVideo");

const d=
await faceapi
.detectSingleFace(
video,
new faceapi.TinyFaceDetectorOptions({
inputSize:320,
scoreThreshold:.45
})
)
.withFaceLandmarks()
.withFaceDescriptor();

drawFaceBox(d);

if(!d){

status.textContent=
"No face detected. Face the camera in good lighting.";

faceScanning=false;

return;
}

if(!faceMatcher){

status.textContent=
"No enrolled profiles with face photos.";

faceScanning=false;

return;
}

const best=
faceMatcher.findBestMatch(
d.descriptor
);

const confidence=
Math.max(
0,
Math.min(
100,
(1-best.distance)*100
)
);

const person=
getPersonById(best.label);

const now=Date.now();

if(
best.label!=="unknown"&&
person&&
best.distance<=.48
){

status.textContent=
`Recognized: ${person.name}`;

if(
faceLastMatch!==person.id||
now-faceLastResultAt>5000
){

showRecognizedPerson(
person,
confidence
);

act(
"person",
`Face recognized: ${person.name}`,
`Match ${confidence.toFixed(0)}%`
);

save();

faceLastMatch=person.id;

faceLastUnknownSignature="";

faceLastResultAt=now;
}

}else{

status.textContent=
"Face detected, but no enrolled person is a sufficiently close match.";

const sig=
Math.round(best.distance*1000);

if(
faceLastUnknownSignature!==String(sig)||
now-faceLastResultAt>7000
){

const photo=
await captureCurrentFrame();

showUnknownFace(photo);

faceLastUnknownSignature=
String(sig);

faceLastMatch="";

faceLastResultAt=now;
}
}

}catch(e){

console.error(e);

status.textContent=
"Scan failed. Try again.";

}finally{

faceScanning=false;
}
}

function toggleAutoScan(){

const btn=
document.getElementById("toggleAutoScan");

if(faceAutoTimer){

clearInterval(faceAutoTimer);

faceAutoTimer=null;

btn.textContent=
"Auto Scan: Off";

notify("Auto scan stopped");

}else{

faceAutoTimer=
setInterval(
scanCurrentFace,
1800
);

btn.textContent=
"Auto Scan: On";

notify("Auto scan started");
}
}

render();

})();
