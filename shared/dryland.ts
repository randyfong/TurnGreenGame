import type {EngineState,LandCover,Turn} from './types';
/** Educational scenario parameters, not calibrated drought/erosion predictions. */
export const drySeasons = [
 {title:'The first long dry spell',lossRate:.08,story:'Less rain leaves open ground unprotected. Help your town keep its living cover.'},
 {title:'Rain arrives in short bursts',lossRate:.12,story:'Long dry gaps stress plants. Catching rainfall can support cover through the next dry season.'},
 {title:'A hotter, drier year',lossRate:.18,story:'Plant cover is under pressure. Cool roofs help with heat, but they do not restore exposed soil.'},
 {title:'Wind over exposed ground',lossRate:.22,story:'With less cover, soil is exposed to wind and rain. Rebuild vegetation before more ground is left bare.'},
 {title:'Protect what is growing back',lossRate:.15,story:'A single project does not end land degradation. Keep the town’s recovering ground covered.'}
] as const;
export const vegetationKeys=['tree_cover_10','shrubland_20','grassland_30','cropland_40'] as const;
export function livingCover(cover:LandCover){return vegetationKeys.reduce((sum,key)=>sum+cover[key],0);}
export interface DrySeasonImpact {title:string;scenario_loss_rate:number;protection_fraction:number;vegetation_lost_ha:number;before_vegetation_pct:number;after_dry_season_vegetation_pct:number;after_project_vegetation_pct:number;no_project_vegetation_pct:number;}
export function applyDrySeason(state:EngineState,year:number,history:Turn[]=[]):{state:EngineState;impact:DrySeasonImpact}{
 const event=drySeasons[year-1];if(!event)throw Error('Dry-season year must be between 1 and 5.');
 const result=structuredClone(state);result.baseline_land_cover??=structuredClone(state.land_cover);
 // Established rain-garden projects reduce subsequent scenario losses, up to 45%.
 const protection=Math.min(.45,history.filter(t=>t.policy==='bioswales').reduce((sum,t)=>sum+t.spend_coins,0)/600);
 const sensitivity={tree_cover_10:.4,shrubland_20:.6,grassland_30:1,cropland_40:1};
 let lost=0;
 for(const key of vegetationKeys){const loss=result.land_cover[key]*event.lossRate*sensitivity[key]*(1-protection);result.land_cover[key]-=loss;lost+=loss;}
 result.land_cover.bare_soil_60+=lost;
 return {state:result,impact:{title:event.title,scenario_loss_rate:event.lossRate,protection_fraction:protection,vegetation_lost_ha:lost*state.total_area_hectares/100,before_vegetation_pct:livingCover(state.land_cover),after_dry_season_vegetation_pct:livingCover(result.land_cover),after_project_vegetation_pct:0,no_project_vegetation_pct:0}};
}
export function noProjectCover(baseline:LandCover,area:number,year:number){let state:EngineState={land_cover:structuredClone(baseline),remaining_budget:0,total_area_hectares:area};for(let n=1;n<=year;n++)state=applyDrySeason(state,n).state;return state.land_cover;}
