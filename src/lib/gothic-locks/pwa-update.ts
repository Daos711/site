/** Explicit update boundary shared by the recovery route and the app button. */
function waitForState(worker:ServiceWorker, states:ServiceWorkerState[], timeout=20000):Promise<void> {
 return new Promise((resolve,reject)=>{
  const finish=()=>{clearTimeout(timer);worker.removeEventListener('statechange',check);};
  const check=()=>{if(states.includes(worker.state)){finish();resolve();}else if(worker.state==='redundant'){finish();reject(new Error('Не удалось загрузить обновление.'));}};
  const timer=setTimeout(()=>{finish();reject(new Error('Обновление не завершилось. Проверьте интернет и повторите.'));},timeout);
  worker.addEventListener('statechange',check);check();
 });
}
export async function updateGothicApp():Promise<void> {
 if(!('serviceWorker' in navigator)) return;
 const registration=await navigator.serviceWorker.register('/apps/gothic-locks-sw.js',{scope:'/apps/gothic-locks',updateViaCache:'none'});
 await registration.update();
 const installing=registration.installing;
 if(installing) await waitForState(installing,['installed','activated']);
 const waiting=registration.waiting;
 if(waiting){
  const activated=waitForState(waiting,['activated']);
  waiting.postMessage({type:'GOTHIC_APPLY_UPDATE'});
  await activated;
 } else if(registration.active && registration.active.state!=='activated') {
  await waitForState(registration.active,['activated']);
 }
 // Never use serviceWorker.ready here: /apps/g/ is deliberately outside the scope.
 // No localStorage writes, unregistering, cache clearing, or forced navigation of other tabs.
}
