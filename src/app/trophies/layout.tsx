import type { Metadata,Viewport } from 'next';
export const metadata:Metadata={manifest:'/trophies/manifest.webmanifest',appleWebApp:{capable:true,title:'Трофеи Lab',statusBarStyle:'black-translucent'},icons:{apple:'/trophies/icons/icon-192.png'}};
export const viewport:Viewport={themeColor:'#14171e'};
export default function TrophiesLayout({children}:{children:React.ReactNode}){return children;}
