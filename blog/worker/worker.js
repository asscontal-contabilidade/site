const GH_API = "https://api.github.com";
const OWNER = "asscontal-contabilidade";
const REPO = "site";
const BRANCH = "main";
const DATA_PATH = "blog/data/materias.json";

const json = (data, status=200, origin="*") => new Response(JSON.stringify(data), {status, headers:{"content-type":"application/json; charset=utf-8","access-control-allow-origin":origin,"access-control-allow-headers":"content-type, authorization","access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS"}});

function allowedOrigin(req, env){
  const origin=req.headers.get("Origin")||"";
  const allowed=(env.ALLOWED_ORIGIN||"").split(",").map(x=>x.trim()).filter(Boolean);
  return allowed.includes(origin)?origin:(allowed[0]||"*");
}
function authorized(req, env){return req.headers.get("Authorization")===`Bearer ${env.ADMIN_PASSWORD}`}
async function gh(path, env, options={}){
  const r=await fetch(`${GH_API}/repos/${OWNER}/${REPO}/${path}`,{...options,headers:{"Accept":"application/vnd.github+json","Authorization":`Bearer ${env.GITHUB_TOKEN}`,"X-GitHub-Api-Version":"2022-11-28","User-Agent":"asscontal-blog-cms",...(options.headers||{})}});
  if(!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`);
  return r.status===204?null:r.json();
}
async function readPosts(env){
  const f=await gh(`contents/${DATA_PATH}?ref=${BRANCH}`,env);
  const text=decodeURIComponent(escape(atob(f.content.replace(/\n/g,""))));
  return {posts:JSON.parse(text||"[]"),sha:f.sha};
}
async function writePosts(env, posts, sha, message){
  const text=JSON.stringify(posts,null,2)+"\n";
  const content=btoa(unescape(encodeURIComponent(text)));
  return gh(`contents/${DATA_PATH}`,env,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({message,content,sha,branch:BRANCH})});
}
export default {async fetch(req,env){
  const origin=allowedOrigin(req,env);
  if(req.method==="OPTIONS") return json({ok:true},200,origin);
  const url=new URL(req.url);
  try{
    if(url.pathname==="/health") return json({ok:true},200,origin);
    if(url.pathname==="/login"&&req.method==="POST"){
      const b=await req.json();
      return b.password===env.ADMIN_PASSWORD?json({ok:true,token:env.ADMIN_PASSWORD},200,origin):json({error:"Senha inválida"},401,origin);
    }
    if(!authorized(req,env)) return json({error:"Não autorizado"},401,origin);
    if(url.pathname==="/posts"&&req.method==="GET"){
      const {posts}=await readPosts(env); return json(posts,200,origin);
    }
    if(url.pathname==="/posts"&&req.method==="POST"){
      const item=await req.json(); const {posts,sha}=await readPosts(env);
      item.id=item.id||crypto.randomUUID(); item.updatedAt=new Date().toISOString();
      posts.unshift(item); await writePosts(env,posts,sha,`blog: publica ${item.title||item.id}`); return json(item,201,origin);
    }
    if(url.pathname.startsWith("/posts/")&&req.method==="PUT"){
      const id=decodeURIComponent(url.pathname.split("/").pop()); const item=await req.json(); const {posts,sha}=await readPosts(env); const i=posts.findIndex(p=>String(p.id)===id);
      if(i<0)return json({error:"Matéria não encontrada"},404,origin); item.id=posts[i].id; item.updatedAt=new Date().toISOString(); posts[i]=item; await writePosts(env,posts,sha,`blog: atualiza ${item.title||id}`); return json(item,200,origin);
    }
    if(url.pathname.startsWith("/posts/")&&req.method==="DELETE"){
      const id=decodeURIComponent(url.pathname.split("/").pop()); const {posts,sha}=await readPosts(env); const next=posts.filter(p=>String(p.id)!==id); if(next.length===posts.length)return json({error:"Matéria não encontrada"},404,origin); await writePosts(env,next,sha,`blog: remove matéria ${id}`); return json({ok:true},200,origin);
    }
    return json({error:"Rota não encontrada"},404,origin);
  }catch(e){return json({error:e.message},500,origin)}
}};
