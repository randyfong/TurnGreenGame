import type {ToolGateway} from '../shared/types';
import {isScienceTopic,scienceTopics,normalizeReference,bundledSources,type ScienceReference} from '../shared/science';
import {RequestError} from './sessions';
export class ScienceService {
 private cache=new Map<string,Promise<ScienceReference>>();
 constructor(private gateway:ToolGateway){}
 async get(topic:string):Promise<ScienceReference>{
  if(!isScienceTopic(topic))throw new RequestError('Choose a listed science topic.');
  if(scienceTopics[topic].source!=='model')return {topic_id:topic,title:scienceTopics[topic].title,equations:[],citations:bundledSources(topic)};
  let pending=this.cache.get(topic);
  if(!pending){pending=this.gateway.call('science','get_science_explanation',{topic_id:topic,audience:'all'}).then(raw=>normalizeReference(topic,raw));this.cache.set(topic,pending);}
  try{return await pending;}catch(error){if(this.cache.get(topic)===pending)this.cache.delete(topic);throw error;}
 }
}
