const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(process.env.DB_FILE || "bdverse.db");

app.use(express.json({limit:"2mb"}));
app.use(express.static(__dirname));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'reader',
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  creator_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creator_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  is_premium INTEGER NOT NULL DEFAULT 0,
  price INTEGER NOT NULL DEFAULT 0,
  content TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(story_id) REFERENCES stories(id)
);
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  episode_id INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, episode_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(episode_id) REFERENCES episodes(id)
);
`);

app.get("/api/health", (req,res)=>res.json({ok:true,service:"BDVerse API",version:"0.4"}));

app.post("/api/register", async (req,res)=>{
  const {email,password,role="reader"} = req.body || {};
  if(!email || !password || password.length < 6)
    return res.status(400).json({error:"Email et mot de passe (6 caractères minimum) requis."});
  const hash = await bcrypt.hash(password,10);
  try{
    const info = db.prepare("INSERT INTO users(email,password_hash,role,credits) VALUES(?,?,?,?)")
      .run(email.toLowerCase().trim(),hash,role==="creator"?"creator":"reader",role==="reader"?1000:0);
    res.status(201).json({id:info.lastInsertRowid,email,role});
  }catch(e){ res.status(409).json({error:"Ce compte existe déjà."}); }
});

app.post("/api/login", async (req,res)=>{
  const {email,password} = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE email=?").get((email||"").toLowerCase().trim());
  if(!user || !(await bcrypt.compare(password||"",user.password_hash)))
    return res.status(401).json({error:"Identifiants incorrects."});
  res.json({id:user.id,email:user.email,role:user.role,credits:user.credits});
});

app.get("/api/stories",(req,res)=>{
  const rows = db.prepare(`
    SELECT s.id,s.title,s.category,s.description,u.email AS creator
    FROM stories s JOIN users u ON u.id=s.creator_id ORDER BY s.id DESC
  `).all();
  res.json(rows);
});

app.post("/api/stories",(req,res)=>{
  const {title,category="Histoires africaines",description="",creatorId} = req.body || {};
  if(!title || !creatorId) return res.status(400).json({error:"Titre et créateur requis."});
  const info=db.prepare("INSERT INTO stories(title,category,description,creator_id) VALUES(?,?,?,?)")
    .run(title,category,description,creatorId);
  res.status(201).json({id:info.lastInsertRowid,title,category});
});

app.post("/api/stories/:storyId/episodes",(req,res)=>{
  const {title,isPremium=false,price=0,content=""}=req.body||{};
  if(!title) return res.status(400).json({error:"Titre requis."});
  const info=db.prepare("INSERT INTO episodes(story_id,title,is_premium,price,content) VALUES(?,?,?,?,?)")
    .run(req.params.storyId,title,isPremium?1:0,Number(price)||0,content);
  res.status(201).json({id:info.lastInsertRowid,title,isPremium:!!isPremium,price:Number(price)||0});
});

app.get("/api/stories/:storyId/episodes",(req,res)=>{
  const rows=db.prepare("SELECT id,title,is_premium AS isPremium,price,created_at FROM episodes WHERE story_id=? ORDER BY id").all(req.params.storyId);
  res.json(rows);
});

/* Demo purchase endpoint.
   Production: replace this route with a verified payment webhook/provider. */
app.post("/api/purchases",(req,res)=>{
  const {userId,episodeId}=req.body||{};
  const user=db.prepare("SELECT * FROM users WHERE id=?").get(userId);
  const ep=db.prepare("SELECT * FROM episodes WHERE id=?").get(episodeId);
  if(!user || !ep) return res.status(404).json({error:"Utilisateur ou épisode introuvable."});
  if(!ep.is_premium) return res.json({unlocked:true,price:0});
  if(user.credits < ep.price) return res.status(402).json({error:"Crédits insuffisants."});
  try{
    db.prepare("INSERT INTO purchases(user_id,episode_id,price) VALUES(?,?,?)").run(userId,episodeId,ep.price);
    db.prepare("UPDATE users SET credits=credits-? WHERE id=?").run(ep.price,userId);
    res.json({unlocked:true,remainingCredits:user.credits-ep.price});
  }catch(e){
    res.json({unlocked:true,alreadyPurchased:true});
  }
});

app.get("/api/creator/:creatorId/stats",(req,res)=>{
  const stories=db.prepare("SELECT COUNT(*) AS n FROM stories WHERE creator_id=?").get(req.params.creatorId).n;
  const episodes=db.prepare(`
    SELECT COUNT(*) AS n FROM episodes e JOIN stories s ON s.id=e.story_id WHERE s.creator_id=?
  `).get(req.params.creatorId).n;
  const revenue=db.prepare(`
    SELECT COALESCE(SUM(p.price),0) AS total FROM purchases p
    JOIN episodes e ON e.id=p.episode_id
    JOIN stories s ON s.id=e.story_id WHERE s.creator_id=?
  `).get(req.params.creatorId).total;
  res.json({stories,episodes,revenueCredits:revenue});
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.listen(PORT,()=>console.log(`BDVerse v0.4: http://localhost:${PORT}`));
