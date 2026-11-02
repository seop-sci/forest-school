/* Player actions are time-budgeted assumptions. Reward/cost/quest functions run
   from the actual game. No q.lat or forced quest/level/league completion. */
window.auditSessions = function(o) {
 const F=window.__forest,A=window.__audit,S=F.S,R=F.rt;A.mute();R.paused=false;R.reduced=true;
 let seed=o.seed;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const start=Date.parse('2026-11-02T13:00:00+09:00');let t=start,day=0,elapsed=0;
 const clock=x=>{t=x;window._auditNow=x;R.fakeNow=x;R.fakePerf=0;F.SVR.ok=false;S.clk.last=x};clock(t);
 // Explicit reference graduate fixture; not a prediction of the preceding school.
 S.tier=2;S.tg=2;S.sem=1;S.grade=4;S.best=4;S.students=120;
 Object.assign(S.f,{classroom:32,cafeteria:26,library:26,playground:28,science:18,store:24});
 for(const k in S.fu)S.fu[k]=S.fu[k].map(()=>S.f[k]||0);
 S.fp={schol:o.fp??6,rep:3,dip:2};S.fund=0;S.tdip=500;S.yearEarned=1e19;S.p.species=12;
 for(const k of F.AC.keys)S.ac[k]={lv:20,xp:0};S.bt.pts=1600;S.bt.lg=3;S.bt.st.w=20;
 S.q.m=F.MAIN.findIndex(q=>q.id==='j31');S.q.mid='j31';S.q.mb=0;S.q.lat='';
 S.tut={st:'skip',nop:true};S.sound=false;S.bgm=false;S.pending=0;S.pendingSec=0;
 if(!F.canPromote())throw Error('reference fixture cannot graduate');F.promote();
 S.pid='AUDIT42';S.q.m=F.MAIN.findIndex(q=>q.id==='hs1');S.q.mid='hs1';S.q.mb=0;S.q.lat='';
 F.rosterEnsure();F.clubAuto(true);S.ess=0;S.gold=0;S.tk={h3:0,h1:0,m30:0,m5:0};
 F.mgOpen();F.mgClose();
 R.modalQueue=[];R.modalOpen=null;R.fest=null;R.sports=null;
 const input={fp:{...S.fp},fund:S.fund,species:S.p.species,ac:JSON.parse(JSON.stringify(S.ac)),bt:{pts:S.bt.pts,lg:S.bt.lg,w:S.bt.st.w},budget:S.budget,roster:S.roster.list.length};
 const ledger={},history=[],milestones=[],daily=[],mergeTrace=[];const actionCounts={};const rngs={};let dormDay=null,complete=false,lastQuest='',lastEnd=start,adsUsed=0,battles=0,puzzles=0,sw=0;
 const wallet=()=>({acorns:S.budget,gold:S.gold,ess:S.ess,dip:S.p.dip,fund:S.fund,ticketMinutes:S.tk.m5*5+S.tk.m30*30+S.tk.h1*60+S.tk.h3*180,pieces:S.mg.pieces,up:S.mg.up,energy:S.mg.e});
 const initialWallet=wallet();
 const record=(tag,fn)=>{actionCounts[tag]=(actionCounts[tag]||0)+1;const a=wallet(),oldRandom=Math.random;let z=rngs[tag]??((o.seed+Array.from(tag).reduce((n,c)=>n+c.charCodeAt(0)*31,0))>>>0);Math.random=()=>{z=(Math.imul(z,1664525)+1013904223)>>>0;return z/4294967296};let r;try{r=fn()}finally{rngs[tag]=z;Math.random=oldRandom}const b=wallet();ledger[tag]??={};for(const k of Object.keys(a)){const d=b[k]-a[k];if(d){ledger[tag][k]??={in:0,out:0};ledger[tag][k][d>0?'in':'out']+=Math.abs(d)}}return r};
 const clear=()=>{R.modalQueue=[];R.modalOpen=null;R.fest=null;R.sports=null;document.querySelectorAll('.overlay').forEach(x=>{x.hidden=true});};
 const advance=sec=>{const base=t;for(let d=0;d<sec;d+=10){const n=Math.min(10,sec-d);clock(t+n*1000);record('constructionComplete',()=>F.conTick());record('online',()=>{S.students=Math.min(F.capacity(),S.students+F.CFG.enroll*n);const g=F.rate()*n;S.budget+=g;F.earn(g)});}elapsed+=(t-base)/1000;clear()};
 const spend=(sec,fn,tag)=>{if(elapsed+sec>o.minutes*60)return false;advance(sec);record(tag,fn);clear();return true};
 const quest=()=>{const q=F.curMain();if(q&&q.id!==lastQuest){history.push({day:day+1,minute:elapsed/60,id:q.id,rate:F.rate(),budget:S.budget});lastQuest=q.id}return q};
 const claim=()=>{for(let i=0;i<100&&F.mainReady();i++)record('main',()=>F.claimMain(null));quest();clear()};
 const collect=()=>{for(let i=0;i<S.dm.list.length;i++)record('daily',()=>F.claimMission(i));record('dailyBonus',()=>F.claimBonus());for(let i=0;i<S.wk.list.length;i++)record('weekly',()=>F.claimWeekMission(i));for(let i=0;i<F.MP_BOX.length;i++)record('weeklyBox',()=>F.claimBox(i));A.evSync();for(let i=0;i<S.ev.list.length;i++)record('eventMission',()=>A.claimEvMission(i));record('eventBox',()=>A.claimEvBox());clear()};
 const build=()=>{
   const q=quest();let candidates=[];
   if(q?.t==='xt'&&S.budget>=F.xtCost(q.k))return spend(3,()=>F.xtAct(q.k),'teacherExtra');
   if(q?.t==='fpUp') {const ks=Object.keys(F.FPERKS).sort((a,b)=>F.fpCost(a)-F.fpCost(b));if(S.fund>=F.fpCost(ks[0]))return spend(3,()=>F.buyFundPerk(ks[0],document.body),'foundation');}
   const rr=F.recommend();if(rr)candidates.push(rr);
   for(const k of F.facKeys()){
     if(F.conOn(k))continue;
     if(A.furReady(k)&&!A.facMaxed(k))candidates.push({kind:'fac',k});
     else F.FUR[k].forEach((_,i)=>{if(!A.furDone(k,i))candidates.push({kind:'fur',k,i})});
   }
   for(const k of Object.keys(F.TEA))if(!F.teaMaxed(k))candidates.push({kind:'tea',k});
   const cost=r=>r.kind==='tea'?F.teaCost(r.k):r.kind==='fur'?F.furCost(r.k,r.i):F.facCost(r.k);
   // Prefer recommendation when affordable; otherwise cheapest affordable investment.
   const r=(rr&&cost(rr)<=S.budget)?rr:candidates.filter(x=>cost(x)<=S.budget).sort((a,b)=>cost(a)-cost(b))[0];if(!r)return false;
   return spend(3,()=>r.kind==='tea'?F.teacherAct(r.k):r.kind==='fur'?F.buyFur(r.k,r.i,true):F.buyFacility(r.k),'growth');
 };
 const freeAndTickets=()=>{for(const k of F.facKeys())if(F.conOn(k)){if(A.conFreeLeft(k))record('freeBuild',()=>A.conFree(k));else if(F.tkPlan(F.conLeft(k)).cut>0)record('ticketUse',()=>F.tkUseAll(k));}clear()};
 const invest=()=>{for(let i=0;i<12&&elapsed<o.minutes*60;i++){claim();if(!build())break;freeAndTickets();}if(dormDay===null&&S.f.dorm)dormDay=day+1;};
 const buffs=()=>{const ks=Object.keys(F.PERKS).filter(k=>!F.perkMaxed(k)).sort((a,b)=>F.perkCost(a)-F.perkCost(b));if(ks[0]&&F.perkCost(ks[0])<=S.p.dip)spend(3,()=>F.buyPerk(ks[0],document.body),'diplomaSpend');};
 const ad=(type)=>spend(30,()=>{F.adGold();S.st.ads++;
   if(type==='offline')A.grantOffline(2);
   if(type==='ticket'){if(S.tka.day!==F.gameToday())S.tka={day:F.gameToday(),n:0};if(S.tka.n>=F.TKAD.perDay)throw Error('ticket quota');S.tka.n++;S.tk.m5+=F.TKAD.n;}
   if(type==='lesson'){const a=F.boostAmount();S.budget+=a;F.earn(a);}
   adsUsed++;
 },'ad:'+type);
 const battle=()=>{
   A.btDay();if(A.btLeft()<=0)return false;
   return spend(90,()=>{const m=A.btMake(),pool=A.btRoster(),pick=A.btBest(m.evs,pool).pick;
     m.me=pick.map(id=>pool.find(x=>x.id===id));m.res=m.evs.map((e,i)=>{const r=A.btRoll(m.me[i].st[e],m.opp[i].st,A.btOppCheer());const correct=[0,0,0].reduce(n=>n+(Math.random()<.75?1:0),0);return {win:A.btWin(r,e==='pe'?7:[0,3,7,10][correct])}});
     S.bt.n++;S.bt.last=m.si;A.btFinish(m);battles++;
   },'battle');
 };
 const puzzle=()=>{if(F.pzLeft()<=0)return false;return spend(180,()=>{const c=F.pzStart();c.score=o.score??1500;c.ess=0;F.pzFinish(c);puzzles++;},'puzzle')};
 const sweep=()=>{if(!F.pzSwOpen()||F.pzLeft()<=0)return;spend(10,()=>{const n=F.pzLeft(),g=F.pzSwGain(n);F.pzSweep(n);sw+=n;},'sweep')};
 const mergeStep=()=>{
   if(S.mg.orders.some(F.mgOrderOk))return spend(3,()=>F.mgClaimOrder(S.mg.orders.findIndex(F.mgOrderOk)),'mergeOrder');
   const cells=F.mgCells(),need=S.mg.orders.flatMap(x=>x.it);let pair=null;
   const max=F.mgMulMax(),mul=max>=4?4:max>=2?2:1;
   if(S.mg.mul!==mul||!S.mg.mm)return spend(2,()=>{F.mgPickMul(mul);F.mgPickMode(1);if(mergeTrace.length<4)mergeTrace.push({mul,stored:S.mg.mul,mode:S.mg.mm,board:S.mg.board.slice(0,16),orders:S.mg.orders});},'mergeControls');
   const upgrade=cells.findIndex(c=>F.MG.gens[c[0]]&&parseInt(c[1],36)<5&&S.mg.up>=F.MG.UPCOST[parseInt(c[1],36)]);
   if(upgrade>=0)return spend(2,()=>F.mgUpgrade(upgrade),'mergeUpgrade');
   for(let i=0;i<cells.length;i++){const c=cells[i];if(!F.MG.kinds[c[0]]||c[1]==='A')continue;const j=cells.indexOf(c,i+1);if(j<0)continue;const required=need.some(x=>x.k===c[0]&&x.n===parseInt(c[1],36)&&cells.filter(z=>z===c).length<=x.c);if(!required){pair=[i,j];break;}}
   if(pair)return spend(2,()=>F.mgDrop(...pair),'mergeCombine');
   const target=need.slice().sort((a,b)=>a.n-b.n).find(x=>!cells.some(c=>c[0]===x.k&&parseInt(c[1],36)>=x.n))||need[0];
   const gen=Object.keys(F.MG.gens).find(g=>F.MG.gens[g].kinds.includes(target?.k));const at=cells.findIndex(x=>x[0]===gen);
   if(at<0||S.mg.e<=0)return false;
   if(!cells.includes('..'))return spend(2,()=>F.mgSell(cells.findIndex(c=>!!F.MG.kinds[c[0]])),'mergeSell');
   return spend(2,()=>F.mgTapGen(at),'mergeProduce');
 };
 for(day=0;day<o.days;day++){
   const ledgerBefore=JSON.parse(JSON.stringify(ledger));elapsed=0;clock(start+day*86400000);clear();record('constructionComplete',()=>F.conTick());record('clubWeek',()=>F.clubWeekTick());F.dmDay();F.wkWeek();record('naturalEnergy',()=>F.mgTick());F.mgFillOrders();A.evSync();A.btDay();
   if(day){record('offlineAccrue',()=>F.applyAway((t-lastEnd)/1000));if(o.ads)ad('offline');else record('offlineClaim',()=>A.grantOffline(1));}
   record('nightXP',()=>F.nsSettle(true));record('attendance',()=>A.stampAtt());record('eventStamp',()=>A.claimStamp());
   spend(60,()=>{},'navigation');collect();invest();
   if(o.ads){for(let i=0;i<2;i++)ad('ticket');if(o.ads===5){ad('lesson');ad('lesson');}}
   invest();buffs();record('nightReserve',()=>{R.nsSub='math';F.nsStart()});
   // One daily puzzle then actual available sweeps; score/time are explicit skill assumptions.
   puzzle();sweep();collect();invest();
   if(F.nsOpen())record('nightReserve',()=>{R.nsSub='math';F.nsStart()});
   const q=quest();if(q?.t==='trials')spend(30,()=>{F.startTrial('snake');for(let i=0;i<30&&R.trial;i++)F.hitTrial()},'intruder');
   if(F.showReady())spend(15,()=>{F.clubAuto(true);const i=F.CLUBS.findIndex((_,i)=>F.clubMembers(i).length);if(i>=0)F.clubShowGo(i)},'clubShow');
   if(!S.trip.cur&&S.students>=10)record('tripStart',()=>{const d=F.TRIPS.filter(x=>S.st.trips>=x.need).sort((a,b)=>a.min-b.min)[0];if(d)F.startTrip(d.id)});
   if(S.trip.cur&&S.trip.end<=t)record('tripReturn',()=>F.claimTrip(1));
   // Focus math until Lv30, then the lowest subject. No injected currency.
   const bookKey=S.ac.math.lv<30?'math':F.AC.keys.slice().sort((a,b)=>S.ac[a].lv-S.ac[b].lv)[0];
   if(S.ess>=A.bookCost(bookKey))spend(5,()=>A.acBuyBook(bookKey),'book');
   // Battle consumes actual simulated time; do not grant league/wins directly.
   battle();if(o.minutes===15)battle();
   while(elapsed+3<=o.minutes*60){claim();const q=quest();
      if(q?.t==='fest'&&A.festOpen(q.k)){if(!spend(65,()=>{F.startFest(q.k,false);if(R.fest){R.fest.t=0;F.endFest()}},'festival'))break;}
      else if(!mergeStep())break;
   }
   collect();invest();buffs();claim();record('grade',()=>F.checkGrade());
   if(F.canGraduate()){const before={y:S.tg+1,sem:S.sem+1};record('ceremony',()=>F.graduate());milestones.push({...before,day:day+1,elapsed});clear();}
   claim();const qend=quest();
   const todayLedger={};for(const tag in ledger){todayLedger[tag]={};for(const key in ledger[tag]){const v=ledger[tag][key],b=ledgerBefore[tag]?.[key]||{in:0,out:0};todayLedger[tag][key]={in:v.in-b.in,out:v.out-b.out}}}daily.push({day:day+1,seconds:elapsed,wallet:wallet(),ledger:todayLedger,tg:S.tg,sem:S.sem,quest:qend?.id||null,math:S.ac.math.lv,battle:S.bt.pts,missions:S.dm.list.map(x=>({id:x.id,done:x.done}))});
   if(elapsed>o.minutes*60)throw Error('time budget exceeded');
   if(S.tg>=3&&!qend){complete=true;break;}
   lastEnd=t;
   history.push({day:day+1,id:'END',quest:qend?.id,rate:F.rate(),wallet:wallet(),tg:S.tg,sem:S.sem,ac:S.ac.math.lv,bt:S.bt.pts,dailyDone:S.dm.list.filter(x=>x.done).length});
 }
 const finalWallet=wallet(),reconcile={};for(const k of Object.keys(finalWallet)){const net=Object.values(ledger).reduce((n,x)=>n+(x[k]?.in||0)-(x[k]?.out||0),0);const error=finalWallet[k]-initialWallet[k]-net;reconcile[k]=error;if(Math.abs(error)>1e-8*Math.max(1,Math.abs(finalWallet[k]),Math.abs(net)))throw Error('untracked balance '+k+':'+error);if(!Number.isFinite(finalWallet[k])||finalWallet[k]<0)throw Error('invalid balance '+k)}
 return {...o,input,initialWallet,reconcile,dormDay,milestones,complete,endQuest:F.curMain()?.id||null,endDay:Math.min(day+1,o.days),ledger,history,daily,actionCounts,mergeTrace,wallet:wallet(),adsUsed,battles,puzzles,sweeps:sw,final:{tier:S.tier,tg:S.tg,sem:S.sem,f:{...S.f},t:{...S.t},fp:{...S.fp},perks:{...S.p.perk},math:{...S.ac.math},bt:{pts:S.bt.pts,lg:S.bt.lg,w:S.bt.st.w},ns:{...S.ns}}};
};
window.auditConstants = function(){
 const F=window.__forest,A=window.__audit,S=F.S;A.mute();S.tier=3;S.students=30;S.f.classroom=6;S.f.cafeteria=3;S.t.owl=3;S.t.squirrel=3;
 const src=k=>A[k]??F[k];const constants={};for(const k of ['DM','MP','MP_BOX','GOLD','ESHOP','TK','TKAD','TK_REW','TKE','PZ','MG','MGB','AC','BT','BT_LG','EV_STAMPS','EV_BOX','MG_DEX_MS','MG_DEX','PERKS','FPERKS','NSL','GSHOP','PS','CB','BOOST','BF','LAB','RARE'])constants[k]=JSON.parse(JSON.stringify(src(k)));
 constants.themePrices=Object.entries(A.THEMES).map(([id,x])=>({id:x.id,name:x.name,price:x.price,bgPrice:x.bgPrice,bonus:x.bonus}));
 constants.passTrack=Array.from({length:30},(_,i)=>A.psReward(i+1,0));
 constants.decoPieces={count:F.DECO.filter(x=>!x.rare&&!x.ev).length,maxPerKind:A.DECO_MAX,cost:5};
 constants.LG_PRIZE_ranks=[1,2,3,10,100].map(r=>[r,A.LG_PRIZE(r)]);
 constants.values=[0,1,2,3].map(tier=>{S.tier=tier;return{tier,rate:F.rate(),minAcorns30:A.minAcorns(30),order8:F.mgOrderReward({it:[{k:'a',n:8,c:1}]}),exchange:A.esExCost()}});
 constants.puzzleScores=[500,1000,1500,2000,3750].map(score=>({score,ess:F.pzEssOf(score),xp:F.pzXpOf(score),sweep:F.pzSwGain?Math.floor(score*F.PZ.sweep):null}));
 return constants;
};

void 0;
