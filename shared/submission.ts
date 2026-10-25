import {turnProjects,projectCoins} from './planning';
import {rules,type Session,type TurnInput,type ProjectChoice} from './types';
const signature=(projects:ProjectChoice[])=>JSON.stringify(projects.slice().sort((a,b)=>a.policy.localeCompare(b.policy)));
/** Do not discard the draft until the server acknowledges this exact request. */
export function confirmYearCommit(value:unknown,sessionId:string,input:TurnInput):Session{
 const fail=()=>{throw new Error('Could not confirm the saved year. Your selections are kept. Retry the same plan to check its status without spending twice.');};
 if(!value||typeof value!=='object')return fail();
 const s=value as Session;
 if(s.id!==sessionId||!Array.isArray(s.history)||!s.engine||!Number.isFinite(s.engine.remaining_budget)||s.engine.remaining_budget<0)return fail();
 const matches=s.history.filter(t=>t?.year===input.year);
 const choices=input.projects??(input.policy&&input.quantity?[{policy:input.policy,quantity:input.quantity}]:[]);
 if(!choices.length||matches.length!==1)return fail();
 const turn=matches[0];
 if(turn.request_id!==input.request_id||signature(turnProjects(turn))!==signature(choices)||turn.spend_coins!==choices.reduce((n,p)=>n+projectCoins(p.policy,p.quantity),0)||!turn.result?.next_state)return fail();
 if(s.history.length<input.year||s.year<Math.min(input.year+1,rules.years)||!['planning','complete'].includes(s.phase)||(input.year===rules.years&&s.phase!=='complete'))return fail();
 return s;
}
