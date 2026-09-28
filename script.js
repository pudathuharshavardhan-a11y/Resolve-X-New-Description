const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORE="resolvex_incidents_v2";
let incidents=[];
try{incidents=JSON.parse(localStorage.getItem(STORE)||"[]");if(!Array.isArray(incidents))incidents=[]}catch{incidents=[]}
const questions=[
 {key:"application",label:"What is the name of the software or application experiencing the issue?",hint:"Application name"},
 {key:"summary",label:"Describe the problem. What happens when you try to use it?",hint:"Issue description"},
 {key:"started",label:"When did the issue start? For example, today, yesterday, or after an update.",hint:"When it started"},
 {key:"affected",label:"How many users are affected: one user, a few users, or everyone?",hint:"Affected users"},
 {key:"impact",label:"What is the business impact? Is work slowed down, blocked, or is there a risk to data or security?",hint:"Business impact"},
 {key:"urgency",label:"How urgent is this issue for your team: low, medium, or high?",hint:"Urgency"},
 {key:"tried",label:"What have you already tried to fix it? Type 'nothing' if you haven't tried anything.",hint:"Troubleshooting tried"},
 {key:"environment",label:"Where does it happen? For example, website, Windows, Android, or iPhone.",hint:"Environment"}
];
let answers={},step=0;
const sevOrder=["Low","Medium","High","Critical"];
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function save(){localStorage.setItem(STORE,JSON.stringify(incidents))}
function severity(a){
 const txt=[a.summary,a.affected,a.impact,a.urgency].join(" ").toLowerCase();
 if(/security breach|data loss|payment system down|complete outage|everyone|all users|critical/.test(txt))return "Critical";
 if(/high|blocked|unavailable|crash|crashes|cannot log|can't log|not working|down/.test(txt))return "High";
 if(/few users|medium|slow|intermittent|sometimes/.test(txt))return "Medium";
 return "Low";
}
function statusClass(s){return s==="In progress"?"In-progress":s}
function badge(s,type){return `<span class="${type}-badge ${escapeHTML(s)}">${escapeHTML(s)}</span>`}
function dateLabel(d){return new Date(d).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}
function showToast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200)}
function navigate(view){
 $$(".page").forEach(p=>p.classList.toggle("active",p.id===`view-${view}`));
 $$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 const labels={overview:"Overview",assistant:"AI Assistant",incidents:"Incidents",analytics:"Analytics",reports:"Reports",playbook:"Resolution playbook"};
 $("#crumb").textContent=labels[view]||"Overview";$("#sidebar").classList.remove("open");
 if(view==="overview"||view==="incidents"||view==="analytics")renderAll();
 if(view==="assistant"&&!$("#chatMessages").children.length)startChat();
}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#themeBtn").addEventListener("click",()=>{document.body.classList.toggle("light");localStorage.setItem("resolvex_theme",document.body.classList.contains("light")?"light":"dark")});
if(localStorage.getItem("resolvex_theme")==="light")document.body.classList.add("light");
function renderActivity(){
 const chart=$("#activityChart");chart.innerHTML="";
 const months=[];const now=new Date();
 for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:`${d.getFullYear()}-${d.getMonth()}`,label:d.toLocaleDateString(undefined,{month:"short"})})}
 const vals=months.map(m=>incidents.filter(x=>{const d=new Date(x.created);return `${d.getFullYear()}-${d.getMonth()}`===m.key}).length);
 const max=Math.max(4,...vals);
 months.forEach((m,i)=>{const g=document.createElement("div");g.className="bar-group";g.innerHTML=`<div class="bar" style="height:${Math.max(2,vals[i]/max*100)}%" title="${vals[i]} incidents"></div><span class="bar-label">${m.label}</span>`;chart.appendChild(g)});
}
function renderDonut(){
 const counts=Object.fromEntries(sevOrder.map(s=>[s,incidents.filter(x=>x.severity===s).length]));
 const total=incidents.length;$("#donutTotal").textContent=total;
 $("#criticalCount").textContent=counts.Critical;$("#highCount").textContent=counts.High;$("#mediumCount").textContent=counts.Medium;$("#lowCount").textContent=counts.Low;
 const colors={Critical:"#ff7185",High:"#f5a75b",Medium:"#8d7bfa",Low:"#49cfa0"};
 let angle=0;const parts=sevOrder.filter(s=>counts[s]).map(s=>{const start=angle;angle+=counts[s]/Math.max(total,1)*360;return `${colors[s]} ${start}deg ${angle}deg`});
 $("#severityDonut").style.background=parts.length?`conic-gradient(${parts.join(",")})`:"conic-gradient(#343b50 0 100%)";
}
function renderRecent(){
 const rows=incidents.slice().sort((a,b)=>b.created-a.created).slice(0,5);
 $("#recentRows").innerHTML=rows.length?rows.map(x=>`<tr><td><span class="incident-id">${escapeHTML(x.id)}</span><br><span style="color:var(--muted)">${escapeHTML(x.summary.slice(0,42))}${x.summary.length>42?"…":""}</span></td><td>${escapeHTML(x.application)}</td><td>${badge(x.severity,"severity")}</td><td>${badge(x.status,"status")}</td><td>${dateLabel(x.created)}</td><td><button class="text-btn" data-status="${escapeHTML(x.id)}">Update</button></td></tr>`).join(""):`<tr><td colspan="5" class="empty-cell">No incidents yet. Start by creating your first incident.</td></tr>`;
}
function renderList(){
 const q=($("#incidentSearch")?.value||"").toLowerCase(),sev=$("#severityFilter")?.value||"all",st=$("#statusFilter")?.value||"all";
 const items=incidents.filter(x=>(sev==="all"||x.severity===sev)&&(st==="all"||x.status===st)&&[x.id,x.application,x.summary].join(" ").toLowerCase().includes(q)).sort((a,b)=>b.created-a.created);
 $("#incidentRows").innerHTML=items.length?items.map(x=>`<tr><td><span class="incident-id">${escapeHTML(x.id)}</span><br><span style="color:var(--muted)">${escapeHTML(x.summary.slice(0,38))}${x.summary.length>38?"…":""}</span></td><td>${escapeHTML(x.application)}</td><td>${badge(x.severity,"severity")}</td><td>${badge(x.status,"status")}</td><td>${dateLabel(x.created)}</td><td><select class="action-select" data-update="${escapeHTML(x.id)}" aria-label="Update ${escapeHTML(x.id)} status"><option ${x.status==="Open"?"selected":""}>Open</option><option ${x.status==="In progress"?"selected":""}>In progress</option><option ${x.status==="Resolved"?"selected":""}>Resolved</option></select></td></tr>`).join(""):`<tr><td colspan="6" class="empty-cell">No incidents found. Try changing your search or filters.</td></tr>`;
}
function renderAnalytics(){
 const total=incidents.length,done=incidents.filter(x=>x.status==="Resolved").length;
 $("#meanSeverity").textContent=total?(incidents.reduce((s,x)=>s+sevOrder.indexOf(x.severity)+1,0)/total).toFixed(1):"—";
 $("#resolutionRate").textContent=total?Math.round(done/total*100)+"%":"0%";
 const sevCounts=Object.fromEntries(sevOrder.map(s=>[s,incidents.filter(x=>x.severity===s).length]));
 const colors={Critical:"#ff7185",High:"#f5a75b",Medium:"#8d7bfa",Low:"#49cfa0"};
 $("#analyticsBars").innerHTML=total?sevOrder.slice().reverse().map(s=>`<div class="hbar-row"><span>${s}</span><div class="hbar-track"><div class="hbar-fill" style="width:${sevCounts[s]/total*100}%;--bar:${colors[s]}"></div></div><b>${sevCounts[s]}</b></div>`).join(""):`<div class="empty-chart">No data to display yet.</div>`;
 const states=["Open","In progress","Resolved"],sc={"Open":"#f5a75b","In progress":"#64b5ff","Resolved":"#49cfa0"};
 $("#statusBars").innerHTML=total?states.map(s=>{const n=incidents.filter(x=>x.status===s).length;return `<div class="hbar-row"><span>${s}</span><div class="hbar-track"><div class="hbar-fill" style="width:${n/total*100}%;--bar:${sc[s]}"></div></div><b>${n}</b></div>`}).join(""):`<div class="empty-chart">No data to display yet.</div>`;
}
function renderAll(){
 $("#totalStat").textContent=incidents.length;$("#openStat").textContent=incidents.filter(x=>x.status!=="Resolved").length;$("#highStat").textContent=incidents.filter(x=>["Critical","High"].includes(x.severity)).length;$("#resolvedStat").textContent=incidents.filter(x=>x.status==="Resolved").length;$("#navCount").textContent=incidents.length;
 renderActivity();renderDonut();renderRecent();renderList();renderAnalytics();
}
function addChat(text,who="bot"){
 const row=document.createElement("div");row.className=`chat-msg ${who}`;
 const av=document.createElement("div");av.className="chat-mini-avatar";av.textContent=who==="bot"?"✦":"H";
 const bubble=document.createElement("div");bubble.className="chat-bubble";bubble.textContent=text;
 row.append(av,bubble);$("#chatMessages").append(row);$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight;
}
function renderContext(){
 const answered=questions.slice(0,step);
 $("#contextFields").innerHTML=answered.length?answered.map(q=>`<div class="context-field"><small>${escapeHTML(q.hint)}</small><b>${escapeHTML(answers[q.key]||"")}</b></div>`).join(""):`<div class="context-empty">Your answers will appear here as you work through the conversation.</div>`;
 const pct=Math.round(step/questions.length*100);$("#progressText").textContent=pct+"%";$("#progressBar").style.width=pct+"%";$("#progressHint").textContent=step>=questions.length?"Intake complete.":`${questions.length-step} question${questions.length-step===1?"":"s"} remaining.`;
}
function makeReport(){
 const sev=severity(answers);const id="RX-"+String(Date.now()).slice(-6);
 const x={id,application:answers.application||"Unknown application",summary:answers.summary||"No description",started:answers.started||"",affected:answers.affected||"",impact:answers.impact||"",urgency:answers.urgency||"",tried:answers.tried||"",environment:answers.environment||"",severity:sev,status:"Open",created:new Date().toISOString()};
 incidents.push(x);save();renderAll();
 addChat(`Incident ${id} has been saved. Suggested severity: ${sev}. Please review the report and confirm the priority with your support team.`);
 const wrap=document.createElement("div");wrap.className="chat-msg";const av=document.createElement("div");av.className="chat-mini-avatar";av.textContent="✦";const b=document.createElement("div");b.className="chat-bubble";
 const report=document.createElement("div");report.innerHTML=`<b style="color:#bcb2ff">Incident report · ${escapeHTML(id)}</b><br><br><b>Application:</b> ${escapeHTML(x.application)}<br><b>Severity:</b> ${escapeHTML(sev)}<br><b>Status:</b> Open<br><b>Summary:</b> ${escapeHTML(x.summary)}<br><br><button class="text-btn" id="goIncidents">View in incidents →</button>`;
 b.append(report);wrap.append(av,b);$("#chatMessages").append(wrap);$("#goIncidents").addEventListener("click",()=>navigate("incidents"));$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight;
 $("#chatInput").disabled=true;$("#chatForm").querySelector("button").disabled=true;
}
function startChat(){
 step=0;answers={};$("#chatMessages").innerHTML="";$("#chatInput").disabled=false;$("#chatForm").querySelector("button").disabled=false;
 addChat("Hi, I'm the Resolve-X incident assistant. I'll guide you through a few questions and create a structured incident report. Let's begin.");
 addChat(questions[0].label);renderContext();
}
$("#chatForm").addEventListener("submit",e=>{e.preventDefault();const input=$("#chatInput"),val=input.value.trim();if(!val||step>=questions.length)return;addChat(val,"user");answers[questions[step].key]=val;step++;input.value="";renderContext();if(step<questions.length)addChat(questions[step].label);else makeReport();});
$("#resetChat").addEventListener("click",startChat);
$("#incidentSearch").addEventListener("input",renderList);$("#severityFilter").addEventListener("change",renderList);$("#statusFilter").addEventListener("change",renderList);
$("#incidentRows").addEventListener("change",e=>{const id=e.target.dataset.update;if(!id)return;const x=incidents.find(x=>x.id===id);if(x){x.status=e.target.value;save();renderAll();showToast(`${id} updated to ${x.status}`)}});
$("#recentRows").addEventListener("click",e=>{const id=e.target.dataset.status;if(!id)return;const x=incidents.find(x=>x.id===id);if(x){x.status=x.status==="Open"?"In progress":x.status==="In progress"?"Resolved":"Open";save();renderAll();showToast(`${id} status: ${x.status}`)}});
function csv(){
 const cols=["id","application","summary","started","affected","impact","urgency","tried","environment","severity","status","created"];
 const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
 return [cols.join(","),...incidents.map(x=>cols.map(c=>q(x[c])).join(","))].join("\r\n");
}
function download(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);showToast("Your export is ready")}
function exportCsv(){download("resolve-x-incidents.csv",csv(),"text/csv;charset=utf-8")}
$("#exportCsv").addEventListener("click",exportCsv);$("#analyticsExport").addEventListener("click",exportCsv);
$("#exportJson").addEventListener("click",()=>download("resolve-x-backup.json",JSON.stringify(incidents,null,2),"application/json"));
renderAll();
