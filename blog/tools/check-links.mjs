import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT=process.cwd();
const POSTS_FILE=path.join(ROOT,'blog/data/materias.json');
const REPORT_FILE=path.join(ROOT,'blog/data/link-check.json');
const SITE_ORIGIN='https://asscontal.com.br';
const BLOG_BASE='https://asscontal.com.br/blog/';
const TIMEOUT_MS=12000;
const CONCURRENCY=6;

function slugify(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100);
}

function decodeHtml(value){
  return String(value||'')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&lt;/gi,'<')
    .replace(/&gt;/gi,'>')
    .replace(/&#x2F;/gi,'/');
}

function stripHtml(value){
  return decodeHtml(String(value||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
}

function extractLinks(post){
  const html=String(post.content||'');
  const base=`${SITE_ORIGIN}/blog/materia?slug=${encodeURIComponent(post.slug||slugify(post.title)||post.id||'materia')}`;
  const found=[];
  const re=/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while((match=re.exec(html))){
    const raw=decodeHtml(match[1]??match[2]??match[3]??'').trim();
    if(!raw||/^(#|mailto:|tel:|javascript:|data:|blob:)/i.test(raw))continue;
    let url;
    try{url=new URL(raw,base)}catch(_){continue}
    if(!/^https?:$/i.test(url.protocol))continue;
    url.hash='';
    found.push({url:url.href,text:stripHtml(match[4]).slice(0,180),raw});
  }
  return found;
}

function isInternal(url){
  try{
    const host=new URL(url).hostname.replace(/^www\./i,'');
    return host==='asscontal.com.br';
  }catch(_){return false}
}

function classifyHttp(status){
  if(status>=200&&status<400)return'ok';
  if([400,404,410,422].includes(status))return'broken';
  return'warning';
}

function networkClassification(error){
  const code=error?.cause?.code||error?.code||'';
  if(['ENOTFOUND','ECONNREFUSED'].includes(code))return'broken';
  return'warning';
}

async function requestUrl(url,method){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{
    const headers={
      'user-agent':'AsscontalBlogLinkChecker/1.0 (+https://asscontal.com.br/blog/)',
      'accept':'text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5'
    };
    if(method==='GET')headers.range='bytes=0-4095';
    const response=await fetch(url,{method,redirect:'follow',signal:controller.signal,headers});
    return {status:response.status,finalUrl:response.url||url};
  }finally{
    clearTimeout(timer);
  }
}

async function checkUrl(url){
  const internal=isInternal(url);
  const started=Date.now();
  try{
    let result;
    if(internal){
      result=await requestUrl(url,'GET');
    }else{
      result=await requestUrl(url,'HEAD');
      if([403,405,501].includes(result.status)){
        try{result=await requestUrl(url,'GET')}catch(_){/* mantém o resultado do HEAD */}
      }
    }
    return {
      url,
      internal,
      status:classifyHttp(result.status),
      httpStatus:result.status,
      finalUrl:result.finalUrl,
      responseMs:Date.now()-started,
      checkedAt:new Date().toISOString()
    };
  }catch(error){
    const aborted=error?.name==='AbortError';
    const code=error?.cause?.code||error?.code||'';
    return {
      url,
      internal,
      status:aborted?'warning':networkClassification(error),
      httpStatus:null,
      finalUrl:url,
      responseMs:Date.now()-started,
      checkedAt:new Date().toISOString(),
      error:aborted?'Tempo limite excedido':String(error?.cause?.message||error?.message||'Falha de rede').slice(0,300),
      errorCode:String(code||'').slice(0,80)
    };
  }
}

async function mapLimit(items,limit,worker){
  const output=new Array(items.length);
  let cursor=0;
  async function run(){
    while(true){
      const index=cursor++;
      if(index>=items.length)return;
      output[index]=await worker(items[index],index);
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,items.length||1)},run));
  return output;
}

const posts=JSON.parse(await fs.readFile(POSTS_FILE,'utf8'));
const usages=[];
const postMeta=new Map();

for(const post of posts){
  const id=String(post.id||'');
  const links=extractLinks(post);
  postMeta.set(id,{id,title:String(post.title||'Sem título'),status:String(post.status||'draft'),slug:String(post.slug||''),total:links.length});
  for(const link of links)usages.push({...link,postId:id,postTitle:String(post.title||'Sem título')});
}

const uniqueUrls=[...new Set(usages.map(x=>x.url))];
console.log(`Verificando ${uniqueUrls.length} links únicos em ${posts.length} matérias...`);
const checked=await mapLimit(uniqueUrls,CONCURRENCY,async(url,index)=>{
  const result=await checkUrl(url);
  console.log(`[${index+1}/${uniqueUrls.length}] ${result.status.toUpperCase()} ${result.httpStatus??'-'} ${url}`);
  return result;
});
const resultMap=new Map(checked.map(x=>[x.url,x]));

const byPost={};
for(const meta of postMeta.values())byPost[meta.id]={...meta,ok:0,broken:0,warnings:0,links:[]};

const problems=[];
for(const usage of usages){
  const result=resultMap.get(usage.url);
  if(!result)continue;
  const target=byPost[usage.postId];
  if(result.status==='ok')target.ok++;
  else if(result.status==='broken')target.broken++;
  else target.warnings++;
  const item={
    url:usage.url,
    text:usage.text,
    status:result.status,
    httpStatus:result.httpStatus,
    finalUrl:result.finalUrl,
    internal:result.internal,
    error:result.error||'',
    errorCode:result.errorCode||''
  };
  target.links.push(item);
  if(result.status!=='ok')problems.push({postId:usage.postId,postTitle:usage.postTitle,...item});
}

const uniqueSummary={
  total:checked.length,
  ok:checked.filter(x=>x.status==='ok').length,
  broken:checked.filter(x=>x.status==='broken').length,
  warnings:checked.filter(x=>x.status==='warning').length,
  internal:checked.filter(x=>x.internal).length,
  external:checked.filter(x=>!x.internal).length
};

const postSummary={
  total:posts.length,
  withLinks:Object.values(byPost).filter(x=>x.total>0).length,
  withBroken:Object.values(byPost).filter(x=>x.broken>0).length,
  withWarnings:Object.values(byPost).filter(x=>x.warnings>0).length
};

problems.sort((a,b)=>{
  const rank={broken:0,warning:1};
  return (rank[a.status]??9)-(rank[b.status]??9)||a.postTitle.localeCompare(b.postTitle,'pt-BR');
});

const report={
  version:1,
  status:'complete',
  generatedAt:new Date().toISOString(),
  site:BLOG_BASE,
  timeoutMs:TIMEOUT_MS,
  summary:uniqueSummary,
  posts:postSummary,
  byPost,
  problems
};

await fs.writeFile(REPORT_FILE,JSON.stringify(report,null,2)+'\n','utf8');
console.log(`Relatório salvo em ${path.relative(ROOT,REPORT_FILE)}: ${uniqueSummary.broken} quebrado(s), ${uniqueSummary.warnings} aviso(s).`);
