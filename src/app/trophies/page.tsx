import type { Metadata } from 'next';
import TrophyTracker from './TrophyTracker';
export const metadata:Metadata={title:'Трофеи и прохождения | Lab',description:'Личный журнал прохождения игр и ручной трекер трофеев PlayStation.'};
export default function TrophiesPage(){return <TrophyTracker/>;}
