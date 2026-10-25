import {mkdirSync,readFileSync,writeFileSync,renameSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {rules,type Session} from '../shared/types';
/** Normalize the persisted history without recalculating any historical results or funds. */
export function migrateSession(session:Session):Session{
 const next=structuredClone(session);
 next.history=next.history.map(turn=>{
  const projects=turn.projects??[{policy:turn.policy,quantity:turn.quantity}];
  if(!projects.length||projects.some(p=>!rules.interventions.some(rule=>rule.id===p.policy)||!Number.isInteger(p.quantity)||p.quantity<1))throw new Error('Invalid saved project list.');
  const {policy:_policy,quantity:_quantity,...record}=turn;
  return {...record,projects};
 });
 return next;
}
// Only server-created snapshots are authoritative; browser drafts cannot alter funds.
export class FileSessions {
 constructor(private directory:string){mkdirSync(directory,{recursive:true,mode:0o700});}
 private file(id:string){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid save identifier.');return path.join(this.directory,id+'.json');}
 load(id:string):Session|undefined {
  let raw:string;try{raw=readFileSync(this.file(id),'utf8');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return undefined;throw new Error('Your saved village could not be read. Keep this session and try again.');}
  try{const save=JSON.parse(raw);if(![1,2].includes(save.version)||save.session.id!==id||!Array.isArray(save.session.history))throw Error();return migrateSession(save.session);}catch{throw new Error('Your saved village is unreadable. It has been preserved; restore its backup before retrying.');}
 }
 save(session:Session){const destination=this.file(session.id),temporary=destination+'.'+randomUUID()+'.tmp';try{writeFileSync(temporary,JSON.stringify({version:2,session:migrateSession(session)}),{mode:0o600,flag:'wx'});renameSync(temporary,destination);}catch{try{unlinkSync(temporary);}catch{}throw new Error('Could not save your village. Nothing was committed; check disk space and retry.');}}
}
