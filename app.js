
const DB_KEY="bdverse_demo_v3";
const seed={
  user:null,
  stories:[{
    id:"kongo",title:"Le Guerrier Kongo",category:"Histoires africaines",
    creator:"Mavunde Studio",premiumPrice:300,followers:0,
    episodes:[
      {id:1,title:"L'appel du Léopard",premium:false},
      {id:2,title:"Le Village en Flammes",premium:true},
      {id:3,title:"Le Conseil des Anciens",premium:true},
      {id:4,title:"La Marque du Léopard",premium:true}
    ]
  }]
};
function db(){return JSON.parse(localStorage.getItem(DB_KEY)||JSON.stringify(seed))}
function save(d){localStorage.setItem(DB_KEY,JSON.stringify(d))}
function currentUser(){return db().user}
function openLogin(){document.getElementById('login').style.display='flex'}
function closeLogin(){document.getElementById('login').style.display='none'}
function registerDemo(){
  const email=document.querySelector('#login input[type=email]')?.value || "lecteur@bdverse.demo";
  const d=db(); d.user={email,coins:1000,unlocked:[]}; save(d); closeLogin(); updateHeader();
  alert("Compte démo créé. Solde initial : 1 000 crédits.");
}
function updateHeader(){
  const u=currentUser();
  document.querySelectorAll(".account-state").forEach(x=>x.textContent=u?`Compte • ${u.coins} crédits`:"Se connecter");
}
function unlock(id){
  const d=db(), u=d.user;
  if(!u){openLogin();return}
  const s=d.stories.find(x=>x.id==="kongo");
  if(u.unlocked.includes(id)){location.href="reader.html";return}
  if(u.coins < s.premiumPrice){alert("Solde insuffisant dans la démo.");return}
  u.coins-=s.premiumPrice;u.unlocked.push(id);save(d);
  alert("Épisode débloqué dans la démo.");
}
function follow(){
  const d=db(); if(!d.user){openLogin();return}
  d.stories[0].followers++;save(d);alert("Série ajoutée à tes favoris.");
}
function publishDemo(){
  const title=document.getElementById("newTitle")?.value.trim();
  if(!title){alert("Entre un titre.");return}
  const d=db(); d.stories.push({id:"story-"+Date.now(),title,category:"Nouvelle création",creator:d.user?.email||"Créateur démo",premiumPrice:300,followers:0,episodes:[]});save(d);
  alert("BD créée dans la démo locale.");
}
window.addEventListener("DOMContentLoaded",()=>{updateHeader();document.querySelectorAll(".account-state").forEach(x=>x.onclick=openLogin)})
