import type {Policy, Turn} from '../shared/types';
export const projects:Record<Policy,{name:string;icon:string;description:string;strength:string;verb:string}>={
 urban_canopy_trees:{name:'Shade squad',icon:'🌳',description:'Restore shade and living cover on exposed ground.',strength:'Shade + rain capture',verb:'Plant the plan'},
 bioswales:{name:'Rain catchers',icon:'🌼',description:'Catch rainfall and support cover through dry spells.',strength:'Rain capture + future dry-season protection',verb:'Make room for rain'},
 cool_roofs:{name:'Rooftop glow-up',icon:'🏠',description:'Reflect sunshine off bright roofs.',strength:'Cooling only · does not restore soil cover',verb:'Cool those rooftops'}
};
export const missions=[
 {name:'Maya',role:'Corner shop owner',avatar:'🧑🏽‍🍳',title:'Shade for the village paths',request:'The walk to our village shop is hot, and open ground is drying out. Can we restore some living cover?' ,hint:'Neighbor request: invest at least 50 coins in trees.',badge:'Shade starter',icon:'🌳',policy:'urban_canopy_trees',min:50,thanks:'That is a proper start for our shade squad!'},
 {name:'Leo',role:'Community gardener',avatar:'🧑🏻‍🌾',title:'Keep rain in the village',request:'Rain comes in bursts between long dry spells. Let’s catch some for planted ground instead of letting it run away.',hint:'Neighbor request: invest at least 60 coins in rain gardens.',badge:'Sponge hero',icon:'💧',policy:'bioswales',min:60,thanks:'A garden with a job. I like the way you think!'},
 {name:'Zuri',role:'School club captain',avatar:'🧑🏾‍🎓',title:'Take the heat off our roofs',request:'Our village classroom needs relief from heat. Bright roofs can help, but we will still need plants to protect exposed ground.',hint:'Neighbor request: invest at least 45 coins in cool roofs.',badge:'Roof raiser',icon:'☀️',policy:'cool_roofs',min:45,thanks:'Our rooftop club has a plan worth showing off!'},
 {name:'Maya',role:'Corner shop owner',avatar:'🧑🏽‍🍳',title:'Hold on to the soil',request:'Wind reaches the patches where plant cover has been lost. Can we make a bigger restoration push?' ,hint:'Neighbor request: invest at least 75 coins in trees or rain gardens.',badge:'Big thinker',icon:'✨',policy:null,min:75,thanks:'That is a big commitment to our village.'},
 {name:'The crew',role:'Your neighborhood team',avatar:'🎉',title:'Bring it all together',request:'Different projects do different jobs. Can our five-year plan include all three?',hint:'Neighbor request: finish with all three project types in your plan.',badge:'Village all-rounder',icon:'🏅',policy:null,min:0,thanks:'Trees, gardens, and roofs. Everyone brought something to the gathering!'}
] as const;
export function missionWon(turn:Turn,history:Turn[]):boolean {
 const m=missions[turn.year-1];if(!m)return false;
 if(turn.year===4)return turn.policy!=='cool_roofs'&&turn.spend_coins>=75;
 if(turn.year===5)return new Set(history.filter(t=>t.year<=5).map(t=>t.policy)).size===3;
 return (m.policy===null||m.policy===turn.policy)&&turn.spend_coins>=m.min;
}
export function earnedBadges(history:Turn[]){return history.filter(t=>missionWon(t,history)).map(t=>missions[t.year-1]);}
