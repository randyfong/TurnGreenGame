import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rules } from '../shared/types';
import {FileSessions} from './persistence';
import { MCPGateway } from './mcp';
import {ScienceService} from './science';
import { RequestError, SessionStore } from './sessions';
const root=fileURLToPath(new URL('../',import.meta.url));
const gateway=new MCPGateway();const store=new SessionStore(gateway,new FileSessions(process.env.COOLVILLAGE_SAVE_DIR??path.join(root,'data','sessions')));const science=new ScienceService(gateway);
const production=process.env.NODE_ENV==='production';
const vite=production?null:await (await import('vite')).createServer({root,server:{middlewareMode:true,watch:{usePolling:true,interval:300}},appType:'spa'});
const server=createServer(async(req,res)=>{
  const url=new URL(req.url??'/','http://localhost');
  if(!url.pathname.startsWith('/api/')) {
    if(vite)return vite.middlewares(req,res);
    try { const pathname=decodeURIComponent(url.pathname);const file=path.resolve(root,'dist','.'+pathname);const base=path.join(root,'dist');if(!file.startsWith(base+path.sep)&&file!==base)throw Error();
      let target=file;try{if(!path.extname(target))target=path.join(base,'index.html');const data=await readFile(target);const ext=path.extname(target);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'} as Record<string,string>)[ext]??'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('Not found');}
    }catch{res.writeHead(400);res.end('Invalid path');}return;
  }
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  try {
    if(req.method==='POST') {const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`)throw new RequestError('Origin not allowed.',403);}
    let body:any={};if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16384)throw new RequestError('Request too large.',413);}try{body=JSON.parse(raw);}catch{throw new RequestError('Invalid JSON.');}if(!body||typeof body!=='object'||Array.isArray(body))throw new RequestError('Invalid request body.');}
    let out:unknown; const m=url.pathname.match(/^\/api\/sessions\/([a-f0-9-]+)(?:\/(baseline|turn|post|resolution))?$/);
    if(req.method==='GET'&&url.pathname==='/api/config')out=rules;
    else if(req.method==='GET'&&url.pathname==='/api/science')out=await science.get(url.searchParams.get('topic')??'');
    else if(req.method==='GET'&&url.pathname==='/api/health')out={status:'ok',simulation:'connects on first request',persistence:'local versioned files'};
    else if(req.method==='POST'&&url.pathname==='/api/sessions')out=store.create(body.profile_id);
    else if(m&&req.method==='GET'&&!m[2])out=store.get(m[1]);
    else if(m&&req.method==='POST'&&m[2]==='baseline')out=await store.baseline(m[1],body);
    else if(m&&req.method==='POST'&&m[2]==='resolution')out=await store.resolution(m[1],body);
    else if(m&&req.method==='POST'&&m[2]==='post')out=await store.post(m[1],body);
    else if(m&&req.method==='POST'&&m[2]==='turn')out=await store.turn(m[1],body);
    else throw new RequestError('Route not found.',404);
    res.end(JSON.stringify(out));
  }catch(error){const status=error instanceof RequestError?error.status:502;res.writeHead(status);res.end(JSON.stringify({error:error instanceof Error?error.message:'The server request failed.'}));}
});
const port=Number(process.env.PORT??5173);server.listen(port,'127.0.0.1',()=>console.log(`CoolTown: http://127.0.0.1:${port}`));
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,async()=>{server.close();await vite?.close();await gateway.close();process.exit(0);});
