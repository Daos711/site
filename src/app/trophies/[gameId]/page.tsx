import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GAME_CATALOGS,getGame } from '@/lib/trophies/catalog';
import TrophyTracker from '../TrophyTracker';
export const dynamicParams=false;
export function generateStaticParams(){return GAME_CATALOGS.map(game=>({gameId:game.id}));}
export async function generateMetadata({params}:{params:Promise<{gameId:string}>}):Promise<Metadata>{const {gameId}=await params;const game=getGame(gameId);return {title:game?game.title+' — Трофеи | Lab':'Трофеи | Lab'};}
export default async function GamePage({params}:{params:Promise<{gameId:string}>}){const {gameId}=await params;if(!getGame(gameId))notFound();return <TrophyTracker gameId={gameId}/>;}
