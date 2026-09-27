const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE-ME-IN-RENDER";
const OWNER_USERNAME = "ttnowner";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "CHANGE-ME-IN-RENDER";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://gokubrouytb987654321-blip.github.io";

app.use(cors({ origin: FRONTEND_ORIGIN, methods:["GET","POST","PUT","DELETE"], allowedHeaders:["Content-Type","Authorization"] }));
app.use(express.json({limit:"256kb"}));

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname,"data");
const DB_FILE = path.join(DATA_DIR,"accounts.json");
fs.mkdirSync(DATA_DIR,{recursive:true});

function loadDB(){
  try { return normalizeDB(JSON.parse(fs.readFileSync(DB_FILE,"utf8"))); }
  catch { return {accounts:[],messages:[]}; }
}
function normalizeDB(db){
  if(!Array.isArray(db.accounts)) db.accounts=[];
  if(!Array.isArray(db.messages)) db.messages=[];
  return db;
}
function saveDB(db){
  const temp=DB_FILE+".tmp";
  fs.writeFileSync(temp,JSON.stringify(db,null,2));
  fs.renameSync(temp,DB_FILE);
}
function cleanUsername(v){ return String(v||"").trim(); }
function key(v){ return cleanUsername(v).toLowerCase(); }
function validUsername(v){
  return v.length>=3 && v.length<=24 && /^[a-zA-Z0-9_.-]+$/.test(v) && /[a-zA-Z]/.test(v);
}
function publicUser(a){ return {id:a.id,username:a.username,settings:a.settings||{},createdAt:a.createdAt,isOwner:false}; }
function sign(payload){ return jwt.sign(payload,JWT_SECRET,{expiresIn:"30d"}); }

function auth(req,res,next){
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  try{ req.auth=jwt.verify(token,JWT_SECRET); next(); }
  catch{ res.status(401).json({error:"Session expirée. Reconnecte-toi."}); }
}
function owner(req,res,next){
  if(!req.auth?.isOwner) return res.status(403).json({error:"Owner uniquement."});
  next();
}

app.get("/",(req,res)=>res.json({ok:true,name:"Labubu Cloud API",version:"1.5.00"}));

app.post("/api/register",async(req,res)=>{
  const username=cleanUsername(req.body.username);
  const password=String(req.body.password||"");
  if(!validUsername(username)) return res.status(400).json({error:"Pseudo invalide : 3-24 caractères et au moins une lettre."});
  if(key(username)===OWNER_USERNAME) return res.status(400).json({error:"Pseudo réservé."});
  if(password.length<6 || password.length>128) return res.status(400).json({error:"Mot de passe : 6 à 128 caractères."});

  const db=loadDB();
  if(db.accounts.some(a=>key(a.username)===key(username))) return res.status(409).json({error:"Ce pseudo existe déjà."});

  const account={
    id:crypto.randomUUID(),
    username,
    passwordHash:await bcrypt.hash(password,12),
    settings:req.body.settings && typeof req.body.settings==="object" ? req.body.settings : {},
    createdAt:new Date().toISOString()
  };
  db.accounts.push(account); saveDB(db);
  res.json({token:sign({id:account.id,isOwner:false}),user:publicUser(account)});
});

app.post("/api/login",async(req,res)=>{
  const username=cleanUsername(req.body.username);
  const password=String(req.body.password||"");

  if(key(username)===OWNER_USERNAME){
    if(OWNER_PASSWORD==="CHANGE-ME-IN-RENDER" || password!==OWNER_PASSWORD) return res.status(401).json({error:"Identifiants incorrects."});
    return res.json({token:sign({id:"owner",isOwner:true}),user:{id:"owner",username:"TTNOWNER",settings:{},createdAt:null,isOwner:true}});
  }

  const db=loadDB();
  const account=db.accounts.find(a=>key(a.username)===key(username));
  if(!account || !(await bcrypt.compare(password,account.passwordHash))) return res.status(401).json({error:"Pseudo ou mot de passe incorrect."});
  res.json({token:sign({id:account.id,isOwner:false}),user:publicUser(account)});
});

app.get("/api/me",auth,(req,res)=>{
  if(req.auth.isOwner) return res.json({user:{id:"owner",username:"TTNOWNER",settings:{},createdAt:null,isOwner:true}});
  const db=loadDB(); const a=db.accounts.find(x=>x.id===req.auth.id);
  if(!a) return res.status(404).json({error:"Compte introuvable."});
  res.json({user:publicUser(a)});
});

app.put("/api/settings",auth,(req,res)=>{
  if(req.auth.isOwner) return res.json({ok:true});
  if(!req.body.settings || typeof req.body.settings!=="object") return res.status(400).json({error:"Settings invalides."});
  const db=loadDB(); const a=db.accounts.find(x=>x.id===req.auth.id);
  if(!a) return res.status(404).json({error:"Compte introuvable."});
  a.settings=req.body.settings; saveDB(db); res.json({ok:true});
});


app.get("/api/chat",auth,(req,res)=>{
  const db=loadDB();
  const limit=Math.max(1,Math.min(100,Number(req.query.limit)||100));
  const messages=db.messages.slice(-limit).map(m=>({
    id:m.id,userId:m.userId,username:m.username,text:m.text,createdAt:m.createdAt,isOwner:!!m.isOwner
  }));
  res.json({messages});
});

app.post("/api/chat",auth,(req,res)=>{
  const text=String(req.body.text||"").trim();
  if(!text || text.length>300) return res.status(400).json({error:"Message : 1 à 300 caractères."});
  const db=loadDB();
  let username="TTNOWNER";
  let isOwner=!!req.auth.isOwner;
  let userId="owner";

  if(!isOwner){
    const a=db.accounts.find(x=>x.id===req.auth.id);
    if(!a) return res.status(404).json({error:"Compte introuvable."});
    username=a.username;
    userId=a.id;
  }

  const message={id:crypto.randomUUID(),userId,username,text,createdAt:new Date().toISOString(),isOwner};
  db.messages.push(message);
  if(db.messages.length>1000) db.messages=db.messages.slice(-1000);
  saveDB(db);
  res.json({message});
});

app.get("/api/owner/accounts",auth,owner,(req,res)=>{
  const db=loadDB();
  res.json({accounts:db.accounts.map(a=>({id:a.id,username:a.username,createdAt:a.createdAt}))});
});

app.put("/api/owner/accounts/:id/username",auth,owner,(req,res)=>{
  const username=cleanUsername(req.body.username);
  if(!validUsername(username) || key(username)===OWNER_USERNAME) return res.status(400).json({error:"Pseudo invalide."});
  const db=loadDB();
  if(db.accounts.some(a=>a.id!==req.params.id && key(a.username)===key(username))) return res.status(409).json({error:"Pseudo déjà utilisé."});
  const a=db.accounts.find(x=>x.id===req.params.id); if(!a) return res.status(404).json({error:"Compte introuvable."});
  a.username=username; saveDB(db); res.json({ok:true});
});

app.put("/api/owner/accounts/:id/password",auth,owner,async(req,res)=>{
  const password=String(req.body.password||"");
  if(password.length<6 || password.length>128) return res.status(400).json({error:"Mot de passe invalide."});
  const db=loadDB(); const a=db.accounts.find(x=>x.id===req.params.id); if(!a) return res.status(404).json({error:"Compte introuvable."});
  a.passwordHash=await bcrypt.hash(password,12); saveDB(db); res.json({ok:true});
});

app.delete("/api/owner/accounts/:id",auth,owner,(req,res)=>{
  const db=loadDB(); const before=db.accounts.length;
  db.accounts=db.accounts.filter(x=>x.id!==req.params.id);
  if(db.accounts.length===before) return res.status(404).json({error:"Compte introuvable."});
  saveDB(db); res.json({ok:true});
});

app.listen(PORT,"0.0.0.0",()=>console.log("Labubu Cloud API running on "+PORT));
