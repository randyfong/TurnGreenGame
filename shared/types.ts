import type {DrySeasonImpact} from './dryland';
import rules from '../config/game-rules.json';
export { rules };
export type Policy = 'urban_canopy_trees' | 'bioswales' | 'cool_roofs';
export type LandCover = Record<'tree_cover_10'|'shrubland_20'|'grassland_30'|'cropland_40'|'built_up_50'|'bare_soil_60'|'water_80', number>;
export interface EngineState { land_cover: LandCover; remaining_budget: number; total_area_hectares: number; roof_treatment_hectares?: number; baseline_land_cover?: Partial<LandCover>; baseline_runoff_mm?: number; }
export interface Assessment { q1_canopy_flooding: number; q2_pavement_heat: number; }
export interface Simulation { projects_executed?:ExecutedProject[]; turn: number; intervention: { id: string; budget_allocated: number; budget_capped?: boolean; area_converted_hectares: number }; next_state: EngineState; player_metrics: {community_cheer_score: number; [key:string]: number}; science_payload: {invest_urban_cooling: {surface_temp_drop_celsius: number}; invest_urban_flood: {baseline_runoff_mm: number; post_runoff_mm: number; stormwater_retained_m3: number; incremental_runoff_reduction_m3: number}}; }
export interface ProjectChoice {policy:Policy;quantity:number;}
export interface ExecutedProject {intervention_id:Policy;budget_allocated:number;budget_capped?:boolean;area_converted_hectares:number;}
interface TurnRecord {year:number;request_id:string;spend_coins:number;unused_allowance:number;dry_season?:DrySeasonImpact;result:Simulation;}
/** Legacy fields are accepted only to read older sessions and callers. New records use projects. */
export type Turn = TurnRecord & ({projects:ProjectChoice[];policy?:Policy;quantity?:number;} | {projects?:undefined;policy:Policy;quantity:number;});
export interface Session { id:string; profile_id:string; scenario_version?:'dryland-v1'; phase:'baseline'|'planning'|'complete'; year:number; engine:EngineState; baseline?:Assessment; post_assessment?:Assessment; assessment_result?:AssessmentResult; history:Turn[]; resolution?:import('./resolution').Resolution; }
export interface TurnInput { year:number; request_id:string; policy?:Policy; quantity?:number; projects?:ProjectChoice[]; }
export interface ToolGateway { call(server:'simulation'|'science'|'assessment'|'resolution', name:string, args:Record<string,unknown>):Promise<unknown>; close():Promise<void>; }

export interface AssessmentResult { status:'completed'; turn:5; session_id:string; learning_gain:{average_normalized_gain:number; gain_type:'standard'|'ceiling_effect'; question_breakdown:{question_id:string; pre_score:number; post_score:number; raw_delta:number; normalized_gain:number}[]}; }
