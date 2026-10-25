import {mkdirSync,readFileSync,writeFileSync,renameSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import type {Session} from '../shared/types';
// Only server-created snapshots are authoritative; browser drafts cannot alter funds.
export class FileSessions {
 constructor(private directory:string){mkdirSync(directory,{recursive:true,mode:0o700});}
 private file(id:string){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid save identifier.');return path.join(this.directory,id+'.json');}
 load(id:string):Session|undefined {
  let raw:string;try{raw=readFileSync(this.file(id),'utf8');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return undefined;throw new Error('Your saved village could not be read. Keep this session and try again.');}
  try{const save=JSON.parse(raw);if(save.version!==1||save.session.id!==id||!Array.isArray(save.session.history))throw Error();return save.session;}catch{throw new Error('Your saved village is unreadable. It has been preserved; restore its backup before retrying.');}
 }
 save(session:Session){const destination=this.file(session.id),temporary=destination+'.'+randomUUID()+'.tmp';try{writeFileSync(temporary,JSON.stringify({version:1,session}),{mode:0o600,flag:'wx'});renameSync(temporary,destination);}catch{try{unlinkSync(temporary);}catch{}throw new Error('Could not save your village. Nothing was committed; check disk space and retry.');}}
}
