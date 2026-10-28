
const L=['Atrium 1','Atrium VIP','Cherry 1','Cherry 2','Backstock'],S=L.slice(0,4),M=[['Chicken Schnitzel Sandwich',13,[30,15,25,25,35],'Mains & snacks'],['Braised Bratwurst',10.5,[20,10,20,20,20],'Mains & snacks'],['Hot Dog',8.5,[25,10,25,25,35],'Mains & snacks'],['Warm Salted Pretzel VGO',8.5,[25,10,20,20,35],'Mains & snacks'],['Harvest Salad VG, AG',16,[10,8,10,10,12],'Mains & snacks'],['Sweet Pumpkin Loaf VG, AG',7.5,[15,8,15,15,17],'Mains & snacks'],['Hal’s Chips & Popcorn VG, AG',3.5,[15,8,15,15,27],'Mains & snacks'],['Assorted Snacks',4.5,[15,8,15,15,27],'Mains & snacks'],['Talea Al Dente Pilsner 12 oz',9.5,[20,10,20,20,30],'Beer & cider'],['Talea Basically Pumpkin Ale 16 oz',11,[18,10,18,18,26],'Beer & cider'],['Grimm Ales Weisse Hefeweissbier 16 oz',11,[18,10,18,18,26],'Beer & cider'],['KCBC Zøktoberfest 16 oz',11,[18,10,18,18,26],'Beer & cider'],['Hudson North Big Apple Dry Cider 12 oz',9.5,[18,10,18,18,26],'Beer & cider'],['Hudson North Apple Pie Cider 16 oz',11,[18,10,18,18,26],'Beer & cider'],['Liquid Fables The Boy Who Cried Wolf Strawberry Mule',16.5,[15,8,15,15,22],'Beer & cider'],['Rain Brand Water 16 oz',4.5,[30,15,30,30,45],'Refreshments'],['Hal’s Seltzer 12 oz',4.25,[20,10,20,20,30],'Refreshments'],['Red Jacket Cider 12 oz',6,[18,10,18,18,26],'Refreshments'],['VIP Flight',0,[0,45,0,0,0],'VIP flight']],$=q=>document.querySelector(q),E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),key='rezis-inventory-v1';let D=readState(),sel='Atrium 1';const mi=i=>M.find(x=>x[0]===i),op=(i,l)=>mi(i)[2][L.indexOf(l)],so=(i,l)=>D.sales.filter(x=>x.item===i&&x.location===l).reduce((a,x)=>a+x.qty,0),st=(i,l)=>TransferLedger.stock(M,D,i,l),tot=(f,ls=S)=>M.reduce((a,[i])=>a+ls.reduce((b,l)=>b+f(i,l),0),0),status=(i,l)=>{let n=st(i,l),o=op(i,l);return n<=0?'out':n<=Math.max(4,Math.ceil(o*.2))?'low':'ok'},save=()=>localStorage.setItem(key,JSON.stringify(D));function render(){let issues=[];S.forEach(l=>M.forEach(x=>{if(op(x[0],l)&&status(x[0],l)!=='ok')issues.push({i:x[0],l,s:status(x[0],l),n:st(x[0],l)})}));let rev=M.reduce((a,[i,p])=>a+p*S.reduce((b,l)=>b+so(i,l),0),0),K=[['Sales revenue','$'+rev.toFixed(0)],['Units sold',tot(so)],['Available · shops',tot(st)],['Backstock',tot(st,['Backstock'])],['Refill signals',issues.length],['Stockouts',issues.filter(x=>x.s==='out').length],['In transit',D.transfers.filter(TransferLedger.pending).reduce((n,t)=>n+t.qty,0)]];$('#kpis').innerHTML=K.map((x,i)=>'<div class="kpi '+((i===4||i===5)&&+String(x[1]).replace(/\D/g,'')?'alert':'')+'"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join('');$('#notices').innerHTML=issues.length?issues.slice(0,3).map(x=>'<span class="notice">'+E(x.i)+' · '+E(x.l)+' '+x.s+'</span>').join(''):'<span class="notice ok">✓ No refill signals</span>';let p={'Atrium VIP':'av','Cherry 1':'c1','Atrium 1':'a1','Cherry 2':'c2','Backstock':'bs'};$('#venue').innerHTML='<img src="assets/garden-map.png" alt="Pixel-art botanical garden selling-point map">'+L.map(l=>{let n=tot(st,[l]),o=tot(op,[l]),a=issues.filter(x=>x.l===l).length,ss=a?issues.some(x=>x.l===l&&x.s==='out')?'out':'low':'ok';return '<button class="shop '+p[l]+' '+(l==='Backstock'?'warehouse ':'')+(l===sel?'active':'')+'" data-l="'+l+'"><b>'+E(l==='Backstock'?'Central warehouse':l)+'</b><br><strong>'+n+'</strong> <small>on hand</small><div class="battery '+ss+'"><i style="width:'+Math.min(100,n/Math.max(o,1)*100)+'%"></i></div>'+(a?'<span class="tag">'+a+' LOW</span>':'')+'</button>'}).join('');renderTransfers();document.querySelectorAll('.shop').forEach(b=>b.onclick=()=>{sel=b.dataset.l;render();$('#detail').scrollIntoView({behavior:'smooth',block:'nearest'})});detail();$('#watch').innerHTML=issues.sort((a,b)=>a.n-b.n).map(x=>'<tr><td>'+E(x.i)+'</td><td>'+E(x.l)+'</td><td class="num">'+x.n+'</td><td><span class="pill '+x.s+'">'+x.s.toUpperCase()+'</span></td></tr>').join('')||'<tr><td colspan="4">All stock levels are healthy.</td></tr>';let max=Math.max(...S.map(l=>tot(st,[l])),1);$('#bars').innerHTML=S.map(l=>'<div class="line"><div class="row"><span>'+l+'</span><span class="nums">'+tot(st,[l])+' units</span></div><div class="bar"><i style="width:'+tot(st,[l])/max*100+'%"></i></div></div>').join('')}function detail(){let cats=['Mains & snacks','Beer & cider','Refreshments','VIP flight'].filter(c=>M.some(x=>x[3]===c&&(op(x[0],sel)||st(x[0],sel)>0)));$('#detail').innerHTML='<div class="detailtop"><div><div class="eyebrow">Selected point</div><h2>'+E(sel==='Backstock'?'Central warehouse':sel)+'</h2><p class="hint">Item-level quantities and progress toward a refill signal.</p></div></div><span class="mini">'+tot(st,[sel])+' ON HAND</span><span class="mini">'+tot(so,[sel])+' SOLD</span><div class="cats">'+cats.map(c=>'<article class="cat"><div class="photo" style="background-image:url('+ (c==='Mains & snacks'?'assets/menu-food.png':'assets/menu-drinks.png') +')"></div><div class="ctitle">'+c+'</div><div class="lines">'+M.filter(x=>x[3]===c&&(op(x[0],sel)||st(x[0],sel)>0)).map(x=>{let n=st(x[0],sel),o=op(x[0],sel),q=status(x[0],sel);return '<div class="line"><div class="row"><span>'+E(x[0])+'</span><span class="nums">'+n+'/'+o+' · '+so(x[0],sel)+' sold</span></div><div class="bar '+q+'"><i style="width:'+Math.max(0,Math.min(100,n/Math.max(o,1)*100))+'%"></i></div></div>'}).join('')+'</div></article>').join('')+'</div>'}function fill(id,v){$(id).innerHTML=v.map(x=>'<option>'+E(x)+'</option>').join('')}

function readState() {
  const raw = localStorage.getItem(key);
  const state = raw ? JSON.parse(raw) : {sales:[],transfers:[]};
  if (!Array.isArray(state.sales) || !Array.isArray(state.transfers)) throw new Error('Stored inventory cannot be read.');
  return state;
}
const positions = {'Atrium 1':[18.4,88],'Atrium VIP':[18.4,30],'Cherry 1':[80.8,30],'Cherry 2':[80.8,88],Backstock:[50,61]};
const walkDuration = 12000;
let toastTimer, deliveryId = null, transferBusy = false, activeMover = null;
const movers=TransferLedger.moverIds.map((id,index)=>({id,name:'Mover '+(index+1),number:index+1,color:['#f97316','#2563eb','#9333ea','#0f766e','#e11d48'][index],home:[[26,56],[38,64],[50,72],[62,64],[74,56]][index]}));
const moverName=id=>movers.find(m=>m.id===id)?.name||'Runner';
function trolleySprite(color) {
  return '<svg viewBox="0 0 42 40" aria-hidden="true" class="runner-person" shape-rendering="crispEdges"><ellipse cx="22" cy="38" rx="19" ry="2" fill="#17203333"/><g class="runner-legs"><path d="M7 24h5v10H5v-4h2z" fill="#172033"/><path d="M13 24h5v10h2v3h-7z" fill="#334155"/></g><path d="M6 12h12v14H6z" fill="'+color+'"/><path d="M8 4h9v9H8z" fill="#dca474"/><path d="M6 2h13v5H6z" fill="#172033"/><path d="M15 15h5v5h4v4h-9z" fill="#dca474"/><path d="M21 21h3v12h15v3H21z" fill="#334155"/><path d="M25 18h13v14H25z" fill="#b7793e"/><path d="M29 18h4v14h-4z" fill="#f8d099"/><circle cx="25" cy="36" r="3" fill="#0f172a"/><circle cx="37" cy="36" r="3" fill="#0f172a"/></svg>';
}
function showMoverMenu(id) {
  const mover=movers.find(x=>x.id===id);
  if(!mover) return;
  const task=D.transfers.find(t=>TransferLedger.pending(t)&&t.moverId===id);
  const panel=$('#mover-menu');
  panel.hidden=false;
  panel.innerHTML='<button class="menu-close" type="button" aria-label="Close mover menu">×</button><div class="mover-menu-avatar">'+trolleySprite(mover.color)+'</div><h3>'+mover.name+'</h3><p>'+(task?'Delivering '+task.qty+' × '+E(task.item)+' to '+E(task.to):'Available · Trolley ready')+'</p><button class="action mover-transfer" type="button" '+(task?'disabled':'')+'>Transfer</button>'+(task?'<button class="reset mover-receipt" type="button">Confirm delivery</button>':'');
  panel.querySelector('.menu-close').onclick=()=>{panel.hidden=true};
  panel.querySelector('.mover-transfer').onclick=()=>openTransfer(id);
  if(task) panel.querySelector('.mover-receipt').onclick=()=>openDelivery(task.id);
  panel.querySelector(task?'.mover-receipt':'.mover-transfer').focus();
}
function openTransfer(id) {
  const mover=movers.find(x=>x.id===id);
  if(!mover) return;
  D=readState();
  if(D.transfers.some(t=>TransferLedger.pending(t)&&t.moverId===id)) {
    render();notify('This mover is busy. Select another available mover.');return;
  }
  activeMover=id;
  $('#mover-menu').hidden=true;
  $('#dispatch-mover').textContent='Assigned to '+mover.name+' · Trolley ready';
  $('#transfer-error').textContent='';
  $('#tqty').removeAttribute('aria-invalid');
  updateAvailability();
  $('#transfer-dialog').showModal();
}

function notify(message) {
  clearTimeout(toastTimer);
  $('#toast-message').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 8000);
}
function updateAvailability() {
  const item = $('#titem').value, from = $('#from').value;
  if (!mi(item) || !L.includes(from)) return;
  const quantity = Math.max(0,st(item,from));
  const arriving = D.transfers.filter(t=>TransferLedger.pending(t)&&t.to===from&&t.item===item).reduce((n,t)=>n+t.qty,0);
  $('#available').textContent = quantity+' units available at '+from+(arriving ? ' · '+arriving+' inbound, not yet available' : '');
  $('#tqty').max = String(quantity);
}
function renderTransfers() {
  const pending = D.transfers.filter(TransferLedger.pending);
  $('#transit-total').textContent = pending.reduce((n,t)=>n+t.qty,0)+' UNITS IN TRANSIT';
  $('#pending-transfers').innerHTML = pending.length ? pending.map(t=>
    '<article class="transfer-ticket" id="transfer-'+E(t.id)+'"><div><span class="transit-badge">'+moverName(t.moverId)+' · In transit</span><h3>'+t.qty+' × '+E(t.item)+'</h3><p>'+E(t.from)+' <span aria-hidden="true">→</span> '+E(t.to)+'</p><small>Started '+new Date(t.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · Destination stock unchanged</small></div><button class="action receive-button" type="button" data-receive="'+E(t.id)+'">Confirm receipt at '+E(t.to)+'</button></article>'
  ).join('') : '<p class="empty-transfers">No products in transit. Select a mover on the map to start a transfer.</p>';
  document.querySelectorAll('[data-receive]').forEach(button=>button.onclick=()=>openDelivery(button.dataset.receive));
  const history=D.transfers.filter(t=>t.status==='delivered').sort((a,b)=>b.deliveredAt-a.deliveredAt).slice(0,8);
  $('#delivered-transfers').innerHTML=history.map(t=>'<div class="history-row"><span>✓ '+t.qty+' × '+E(t.item)+' · '+E(t.to)+'</span><small>'+new Date(t.deliveredAt).toLocaleString()+'</small></div>').join('')||'<p class="hint">No deliveries confirmed in this workflow yet.</p>';
  let paths='',people='';
  movers.forEach(mover=>{
    const t=pending.find(t=>t.moverId===mover.id);
    if(!t) {
      const home=mover.home;
      people+='<button type="button" class="mover idle" data-mover="'+mover.id+'" aria-label="'+mover.name+', available. Select to transfer." style="left:'+home[0]+'%;top:'+home[1]+'%;--mover-color:'+mover.color+'">'+trolleySprite(mover.color)+'<span class="mover-number">'+mover.number+'</span></button>';
      return;
    }
    const [sx,sy]=positions[t.from], [ex,ey]=positions[t.to],elapsed=Math.min(walkDuration,Math.max(0,Date.now()-t.at));
    paths+='<path d="M '+sx+' '+sy+' L 50 61 L '+ex+' '+ey+'" />';
    people+='<button type="button" class="runner mover '+(elapsed>=walkDuration?'awaiting':'')+'" data-mover="'+mover.id+'" data-runner="'+E(t.id)+'" data-destination-side="'+(ex>=50?'right':'left')+'" aria-label="'+mover.name+', delivering '+E(t.qty+' '+t.item+' from '+t.from+' to '+t.to)+'. Select for delivery status." style="--sx:'+sx+'%;--sy:'+sy+'%;--ex:'+ex+'%;--ey:'+ey+'%;--mover-color:'+mover.color+';animation-delay:-'+elapsed+'ms">'+trolleySprite(mover.color)+'<span class="mover-number">'+mover.number+'</span><span class="runner-label">'+mover.number+' · '+t.qty+' units · <span class="runner-state">'+(elapsed>=walkDuration?'Confirm receipt':'On the way')+'</span></span></button>';
  });
  $('#venue').insertAdjacentHTML('beforeend','<svg class="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+paths+'</svg>'+people+'<div class="mover-menu" id="mover-menu" hidden></div><div class="team-label">Trolley team · '+(5-pending.filter(t=>t.moverId).length)+'/5 available</div>');
  document.querySelectorAll('[data-mover]').forEach(button=>button.onclick=()=>showMoverMenu(button.dataset.mover));
  updateAvailability();
}
async function mutateTransfers(operation) {
  const run=()=>{
    const fresh=readState();
    const result=operation(fresh);
    if(!result.ok) { D=fresh; render(); return result; }
    localStorage.setItem(key,JSON.stringify(fresh));
    D=fresh;
    render();
    return result;
  };
  // Serialize read/validate/write across tabs on the same browser.
  return navigator.locks ? navigator.locks.request(key,run) : run();
}
async function dispatchTransfer(event) {
  event.preventDefault();
  if(transferBusy) return;
  transferBusy=true;
  $('#start-transfer').disabled=true;
  $('#transfer-error').textContent='';
  $('#tqty').removeAttribute('aria-invalid');
  try {
    const request={id:crypto.randomUUID(),item:$('#titem').value,from:$('#from').value,to:$('#to').value,qty:Number($('#tqty').value),at:Date.now(),moverId:activeMover};
    const result=await mutateTransfers(fresh=>TransferLedger.initiate(M,fresh,request));
    if(!result.ok) {
      $('#transfer-error').textContent=result.error;
      $('#tqty').setAttribute('aria-invalid','true');
      notify(result.error);
      return;
    }
    $('#transfer-dialog').close();
    activeMover=null;
    notify('Transfer initiated successfully. '+moverName(result.transfer.moverId)+' is moving '+result.transfer.qty+' units to '+result.transfer.to+'.');
    $('#venue').scrollIntoView({behavior:'smooth',block:'center'});
  } catch(error) {
    $('#transfer-error').textContent='Transfer could not be saved. No stock was moved. Please try again.';
    notify($('#transfer-error').textContent);
  } finally {
    transferBusy=false;
    $('#start-transfer').disabled=false;
  }
}
function openDelivery(id) {
  const transfer=D.transfers.find(t=>t.id===id&&TransferLedger.pending(t));
  if(!transfer) return;
  $('#mover-menu').hidden=true;
  deliveryId=id;
  $('#delivery-summary').innerHTML='<div class="delivery-quantity">'+transfer.qty+' units</div><p><strong>'+E(transfer.item)+'</strong></p><p>'+E(transfer.from)+' → <strong>'+E(transfer.to)+'</strong></p><p class="hint">Confirm only after all products have been received. This adds '+transfer.qty+' units to '+E(transfer.to)+'.</p>';
  $('#receipt-check').checked=false;
  $('#confirm-delivery').disabled=true;
  $('#delivery-error').textContent='';
  $('#delivery-dialog').showModal();
}
async function receiveDelivery() {
  if(!deliveryId||!$('#receipt-check').checked||transferBusy) return;
  transferBusy=true;
  $('#confirm-delivery').disabled=true;
  try {
    const result=await mutateTransfers(fresh=>TransferLedger.confirmDelivery(fresh,deliveryId,Date.now()));
    if(!result.ok) {
      $('#delivery-error').textContent=result.error;
      return;
    }
    sel=result.transfer.to;
    render();
    $('#delivery-dialog').close();
    deliveryId=null;
    notify('Delivery confirmed. '+result.transfer.qty+' units added to '+result.transfer.to+'.');
  } catch(error) {
    $('#delivery-error').textContent='Delivery could not be saved. Stock has not been credited. Please try again.';
  } finally {
    transferBusy=false;
    $('#confirm-delivery').disabled=!$('#receipt-check').checked;
  }
}
fill('#from',L);fill('#to',L);fill('#titem',M.map(x=>x[0]));
$('#from').value='Backstock';
$('#to').value='Atrium 1';
$('#transferform').onsubmit=dispatchTransfer;
$('#close-transfer').onclick=()=>{$('#transfer-dialog').close();activeMover=null};
$('#transfer-dialog').addEventListener('cancel',()=>{activeMover=null});
['#from','#to','#titem'].forEach(id=>$(id).addEventListener('change',()=>{
  D=readState(); updateAvailability(); $('#transfer-error').textContent='';
}));
$('#dismiss-toast').onclick=()=>{$('#toast').hidden=true};
$('#close-delivery').onclick=()=>{$('#delivery-dialog').close();deliveryId=null};
$('#receipt-check').onchange=()=>{$('#confirm-delivery').disabled=!$('#receipt-check').checked||transferBusy};
$('#confirm-delivery').onclick=receiveDelivery;
window.addEventListener('storage',event=>{if(event.key===key){D=readState();render()}});
setInterval(()=>{
  document.querySelectorAll('[data-runner]').forEach(button=>{
    const t=D.transfers.find(x=>x.id===button.dataset.runner);
    if(t && Date.now()-t.at>=walkDuration) {
      button.classList.add('awaiting');
      button.querySelector('.runner-state').textContent='Confirm receipt';
    }
  });
},1000);
render();
