
const L=['Atrium 1','Atrium VIP','Cherry 1','Cherry 2','Backstock'],S=L.slice(0,4),M=[['Chicken Schnitzel Sandwich',13,[30,15,25,25,35],'Mains & snacks'],['Braised Bratwurst',10.5,[20,10,20,20,20],'Mains & snacks'],['Hot Dog',8.5,[25,10,25,25,35],'Mains & snacks'],['Warm Salted Pretzel VGO',8.5,[25,10,20,20,35],'Mains & snacks'],['Harvest Salad VG, AG',16,[10,8,10,10,12],'Mains & snacks'],['Sweet Pumpkin Loaf VG, AG',7.5,[15,8,15,15,17],'Mains & snacks'],['Hal’s Chips & Popcorn VG, AG',3.5,[15,8,15,15,27],'Mains & snacks'],['Assorted Snacks',4.5,[15,8,15,15,27],'Mains & snacks'],['Talea Al Dente Pilsner 12 oz',9.5,[20,10,20,20,30],'Beer & cider'],['Talea Basically Pumpkin Ale 16 oz',11,[18,10,18,18,26],'Beer & cider'],['Grimm Ales Weisse Hefeweissbier 16 oz',11,[18,10,18,18,26],'Beer & cider'],['KCBC Zøktoberfest 16 oz',11,[18,10,18,18,26],'Beer & cider'],['Hudson North Big Apple Dry Cider 12 oz',9.5,[18,10,18,18,26],'Beer & cider'],['Hudson North Apple Pie Cider 16 oz',11,[18,10,18,18,26],'Beer & cider'],['Liquid Fables The Boy Who Cried Wolf Strawberry Mule',16.5,[15,8,15,15,22],'Beer & cider'],['Rain Brand Water 16 oz',4.5,[30,15,30,30,45],'Refreshments'],['Hal’s Seltzer 12 oz',4.25,[20,10,20,20,30],'Refreshments'],['Red Jacket Cider 12 oz',6,[18,10,18,18,26],'Refreshments'],['VIP Flight',0,[0,45,0,0,0],'VIP flight']],$=q=>document.querySelector(q),E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),key='rezis-inventory-v1';
let D=readState(),sel='Atrium 1',toastSummary=null,dashboardRevenueOverride=null;
let toastEvents=[],simulationIndex=0,simulationClock=null,simulationSpeed=1,simulationTimer=null,suggestionMode=true;
let locationRevenue={},simulationLog=[],saleEffects=[];
const mi=i=>M.find(x=>x[0]===i),op=(i,l)=>mi(i)[2][L.indexOf(l)];
const so=(i,l)=>D.sales.filter(x=>x.item===i&&x.location===l).reduce((a,x)=>a+x.qty,0);
const st=(i,l)=>TransferLedger.stock(M,D,i,l);
const tot=(f,ls=S)=>M.reduce((a,[i])=>a+ls.reduce((b,l)=>b+f(i,l),0),0);
const status=(i,l)=>TransferLedger.stockStatus(st(i,l),op(i,l));
const healthText=(s,n)=>n<0?'COUNT MISMATCH':({out:'OUT OF STOCK',critical:'NEARLY OUT',low:'LOW STOCK',ok:'HEALTHY'}[s]);
const dollars=value=>Number(value).toLocaleString('en-US',{style:'currency',currency:'USD'});
const itemSpriteIndex={'Chicken Schnitzel Sandwich':0,'Braised Bratwurst':1,'Hot Dog':2,'Warm Salted Pretzel VGO':3,'Harvest Salad VG, AG':4,'Sweet Pumpkin Loaf VG, AG':5,'Hal’s Chips & Popcorn VG, AG':6,'Assorted Snacks':7,'Talea Al Dente Pilsner 12 oz':8,'Talea Basically Pumpkin Ale 16 oz':9,'Grimm Ales Weisse Hefeweissbier 16 oz':10,'KCBC Zøktoberfest 16 oz':11,'Hudson North Big Apple Dry Cider 12 oz':12,'Hudson North Apple Pie Cider 16 oz':13,'Liquid Fables Strawberry Mule':14,'Rain Brand Water 16 oz':15,'Hal’s Seltzer 12 oz':16,'Red Jacket Cider 12 oz':17,'VIP Beer Flight':18};
function productArt(name,large=false){const index=itemSpriteIndex[name];if(index===undefined)return '';return '<span class="product-sprite '+(large?'product-sprite-large':'')+'" style="--sprite-col:'+(index%5)+';--sprite-row:'+Math.floor(index/5)+'" aria-hidden="true"></span>'}
function shopStats(location){
  const report=toastSummary?.locations?.find(row=>row.locationName===location);
  const sold=tot(so,[location]);
  const revenue=dashboardRevenueOverride!==null?(locationRevenue[location]||0):Number.isFinite(report?.revenue)?report.revenue:M.reduce((sum,[item,price])=>sum+price*so(item,location),0);
  return {stock:tot(st,[location]),sold,revenue,estimated:!report&&sold>0&&location!=='Backstock'};
}
function stationArtwork(location){
  const people=typeof StaffRoster!=='undefined'?(StaffRoster.get()?.people||[]):[];
  return '<img class="station-art" src="assets/sales-station.png" alt="" aria-hidden="true">'+['chef','sales'].map(role=>{
    const staff=people.filter(p=>p.location===location&&p.role===role);
    return '<span class="station-crew crew-'+role+'" aria-label="'+E(staff.map(p=>p.name).join(', ')||role)+'">'+staff.slice(0,2).map(p=>'<span class="team-person"><span class="staff-sprite sprite-'+role+'" aria-hidden="true"></span><small>'+E(p.name)+'</small></span>').join('')+(staff.length>2?'<span class="crew-extra">+'+(staff.length-2)+'</span>':'')+'</span>';
  }).join('');
}
function stationSaleEffects(location){const now=Date.now();return saleEffects.filter(effect=>effect.location===location).map(effect=>'<span class="sale-pop '+effect.kind+'" data-sale-effect="'+effect.id+'" style="animation-delay:-'+Math.min(1600,now-effect.createdAt)+'ms">'+E(effect.label)+'</span>').join('')}
function selectShop(button,event){
  const location=button.dataset.l;
  const touch=event?.pointerType==='touch'||(typeof matchMedia==='function'&&matchMedia('(hover: none)').matches);
  const alreadyOpen=button.classList.contains('show-tooltip');
  document.querySelectorAll('.shop').forEach(other=>{
    other.classList.toggle('active',other===button);
    other.classList.remove('show-tooltip','tooltip-dismissed');
  });
  sel=location;
  detail();
  if(touch&&!alreadyOpen)button.classList.add('show-tooltip');
  else $('#detail').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function render(){
  const issues=[];
  S.forEach(l=>M.forEach(([i])=>{if(op(i,l)&&status(i,l)!=='ok')issues.push({i,l,s:status(i,l),n:st(i,l)})}));
  const revenue=dashboardRevenueOverride!==null ? dashboardRevenueOverride : toastSummary ? toastSummary.totals.revenue : M.reduce((a,[i,p])=>a+p*S.reduce((b,l)=>b+so(i,l),0),0);
  const kpis=[['Available · shops',tot(st)],['Backstock',tot(st,['Backstock'])],['Sales revenue','$'+revenue.toFixed(0)],['Units sold',tot(so)]];
  $('#kpis').innerHTML=kpis.map(([label,value],i)=>'<div class="kpi '+((i===4||i===5)&&value?'alert':'')+'"><small>'+label+'</small><strong>'+value+'</strong></div>').join('');
  $('#notices').innerHTML=issues.length?issues.slice(0,3).map(x=>'<span class="notice '+x.s+'">'+E(x.i)+' · '+E(x.l)+' · '+healthText(x.s,x.n)+'</span>').join(''):'<span class="notice ok">✓ No refill signals</span>';
  const pins={'Atrium VIP':'av','Cherry 1':'c1','Atrium 1':'a1','Cherry 2':'c2',Backstock:'bs'};
  $('#venue').innerHTML='<img src="assets/garden-base.png" alt="Pixel-art botanical garden selling-point map">'+L.map(l=>{
    const n=tot(st,[l]),o=tot(op,[l]),alerts=issues.filter(x=>x.l===l);
    const severity=alerts.some(x=>x.s==='out'||x.s==='critical')?'out':alerts.length?'low':'ok';
    const stats=shopStats(l),percentage=Math.max(0,Math.min(100,n/Math.max(o,1)*100)),tooltipId='shop-stats-'+pins[l];
    return '<button class="shop '+pins[l]+' '+(l==='Backstock'?'warehouse ':'sales-station ')+(l===sel?'active':'')+'" data-l="'+l+'" aria-label="'+E(l==='Backstock'?'Central warehouse':l)+' — view inventory" aria-describedby="'+tooltipId+'">'+(l==='Backstock'?'':stationArtwork(l))+stationSaleEffects(l)+'<span class="shop-hud"><span class="shop-name">'+E(l==='Backstock'?'Backstock':l)+'</span><span class="health-track '+severity+'" aria-hidden="true"><span class="health-fill" style="width:'+percentage+'%"></span></span>'+(alerts.length?'<span class="health-alert '+severity+'" aria-hidden="true">!</span>':'')+'</span><span class="shop-tooltip" id="'+tooltipId+'" role="tooltip"><span class="tooltip-title">'+E(l==='Backstock'?'Central warehouse':l)+'</span><span class="tooltip-row"><span>Stock available</span><strong>'+n+' units</strong></span><span class="tooltip-row"><span>Units sold</span><strong>'+stats.sold+'</strong></span><span class="tooltip-row sales-row"><span>'+(stats.estimated?'Est. sales':'Sales')+'</span><strong>'+dollars(stats.revenue)+'</strong></span><span class="tooltip-note">'+(alerts.length?alerts.length+' item'+(alerts.length===1?'':'s')+' need attention':Math.round(percentage)+'% of opening stock')+(stats.estimated?' · At menu prices':'')+'</span><span class="tooltip-instruction">Click to inspect items<span class="touch-instruction">Tap again to inspect items</span></span></span></button>';

  }).join('');
  renderTransfers();
  $('#venue').insertAdjacentHTML('beforeend',L.map(location=>'<button class="team-edit-map '+pins[location]+'" type="button" data-team-edit="'+E(location)+'" aria-label="Manage '+E(location==='Backstock'?'Central warehouse':location)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>').join(''));
  document.querySelectorAll('.shop').forEach(button=>{
    button.onclick=event=>selectShop(button,event);
    button.onkeydown=event=>{if(event.key==='Escape'){button.classList.add('tooltip-dismissed');button.classList.remove('show-tooltip');}};
    button.onmouseenter=()=>button.classList.remove('tooltip-dismissed');
    button.onfocus=()=>button.classList.remove('tooltip-dismissed');
    button.onblur=()=>button.classList.remove('show-tooltip');
  });
  document.querySelectorAll('[data-team-edit]').forEach(button=>button.onclick=event=>{event.stopPropagation();openTeamRoster(button.dataset.teamEdit)});
  detail();
  $('#watch').innerHTML=issues.sort((a,b)=>a.n-b.n).map(x=>'<tr><td>'+E(x.i)+'</td><td>'+E(x.l)+'</td><td class="num">'+x.n+'</td><td><span class="pill '+x.s+'">'+healthText(x.s,x.n)+'</span></td></tr>').join('')||'<tr><td colspan="4">All stock levels are healthy.</td></tr>';
  const max=Math.max(...S.map(l=>tot(st,[l])),1);
  $('#bars').innerHTML=S.map(l=>'<div class="line"><div class="row"><span>'+l+'</span><span class="nums">'+tot(st,[l])+' units</span></div><div class="bar"><i style="width:'+Math.max(0,tot(st,[l])/max*100)+'%"></i></div></div>').join('');
  if(typeof renderHistory==='function')renderHistory();
  renderSuggestions();
  updateCommandBadges();
}
function detail(){
  const visible=x=>op(x[0],sel)>0||st(x[0],sel)!==0;
  const cats=[...new Set(M.filter(visible).map(x=>x[3]))];
  $('#detail').innerHTML='<div class="detailtop"><div><h2>'+E(sel==='Backstock'?'Central warehouse':sel)+'</h2></div></div><div class="cats">'+cats.map(c=>'<article class="cat"><div class="photo" style="background-image:url('+(c==='Food'?'assets/menu-food.png':'assets/menu-drinks.png')+')"></div><div class="ctitle">'+E(c)+'</div><div class="lines">'+M.filter(x=>x[3]===c&&visible(x)).map(([i])=>{
    const n=st(i,sel),o=op(i,sel),q=status(i,sel);
    return '<div class="line inventory-item '+q+'"><div class="row"><button class="product-preview-trigger" type="button" data-product-preview="'+E(i)+'" aria-label="View image of '+E(i)+'">'+productArt(i)+'<span>'+E(i)+'</span></button><span class="nums">'+n+'/'+o+' · '+so(i,sel)+' sold</span></div>'+(q!=='ok'?'<span class="stock-status">'+healthText(q,n)+(n<0?' · Reconcile this item count':'')+'</span>':'')+'<div class="bar '+q+'"><i style="width:'+Math.max(0,Math.min(100,n/Math.max(o,1)*100))+'%"></i></div></div>';
  }).join('')+'</div></article>').join('')+'</div>';
  document.querySelectorAll('[data-product-preview]').forEach(button=>button.onclick=()=>openProductPreview(button.dataset.productPreview));
}
function fill(id,v){$(id).innerHTML=v.map(x=>'<option>'+E(x)+'</option>').join('')}

function readState() {
  const raw = localStorage.getItem(key);
  const state = raw ? JSON.parse(raw) : {sales:[],transfers:[]};
  if (!Array.isArray(state.sales) || !Array.isArray(state.transfers)) throw new Error('Stored inventory cannot be read.');
  return state;
}
const positions = {'Atrium 1':[18.4,75],'Atrium VIP':[18.4,38],'Cherry 1':[80.8,38],'Cherry 2':[80.8,75],Backstock:[50,68]};
const walkDuration = 12000;
let toastTimer, deliveryId = null, transferBusy = false, activeMover = null, selectedMoverId = null;
const movers=TransferLedger.moverIds.map((id,index)=>({id,get name(){return typeof StaffRoster!=='undefined'?StaffRoster.name(id,'Hand '+(index+1)):'Hand '+(index+1)},number:index+1,color:['#f97316','#2563eb','#9333ea','#0f766e','#e11d48'][index],home:[[28,48],[30,64],[50,77],[70,64],[72,48]][index]}));
const moverName=id=>movers.find(m=>m.id===id)?.name||'Runner';
function trolleySprite(color) {
  return '<span class="runner-person staff-sprite sprite-hands" aria-hidden="true"></span>';
}
function showMoverMenu(id,restore=false) {
  const mover=movers.find(x=>x.id===id);
  if(!mover) return;
  selectedMoverId=id;
  const task=D.transfers.find(t=>TransferLedger.pending(t)&&t.moverId===id);
  const panel=$('#mover-menu');
  panel.hidden=false;
  panel.innerHTML='<button class="menu-close" type="button" aria-label="Close mover menu">×</button><div class="mover-menu-avatar">'+trolleySprite(mover.color)+'</div><h3 class="mover-menu-name"><span aria-hidden="true"></span><span class="mover-menu-name-text">'+E(mover.name)+'</span><button type="button" class="mover-edit" aria-label="Edit name for '+E(mover.name)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button></h3><p>'+(task?'Delivering '+task.qty+' × '+E(task.item)+' to '+E(task.to):'Available · Trolley ready')+'</p><button class="action mover-transfer" type="button" '+(task?'disabled':'')+'>Transfer</button>'+(task?'<button class="reset mover-receipt" type="button">Confirm delivery</button>':'');
  panel.querySelector('.menu-close').onclick=()=>{selectedMoverId=null;panel.hidden=true};
  panel.querySelector('.mover-transfer').onclick=()=>openTransfer(id);
  panel.querySelector('.mover-edit').onclick=()=>{selectedMoverId=null;panel.hidden=true;if(typeof openStaffEditor==='function')openStaffEditor(id);};
  if(task) panel.querySelector('.mover-receipt').onclick=()=>openDelivery(task.id);
  if(!restore)panel.querySelector(task?'.mover-receipt':'.mover-transfer').focus();
}
function openTransfer(id) {
  const mover=movers.find(x=>x.id===id);
  D=readState();
  if(id && D.transfers.some(t=>TransferLedger.pending(t)&&t.moverId===id)) {
    render();notify('This mover is busy. Select another available mover.');return;
  }
  activeMover=id||null;
  $('#mover-menu').hidden=true;
  $('#dispatch-mover').textContent=mover?'Assigned to '+mover.name+' · Trolley ready':'Looking for a transporter · Assign a mover after initiating';
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
  if (!mi(item) || !L.includes(from)) { $('#available').textContent='Type to search, then select an item from the results.'; $('#tqty').removeAttribute('max'); return; }
  const quantity = Math.max(0,st(item,from));
  const arriving = D.transfers.filter(t=>TransferLedger.pending(t)&&t.to===from&&t.item===item).reduce((n,t)=>n+t.qty,0);
  $('#available').textContent = quantity+' units available at '+from+(arriving ? ' · '+arriving+' inbound, not yet available' : '');
  $('#tqty').max = String(quantity);
}
function renderTransfers() {
  const pending = D.transfers.filter(TransferLedger.pending);
  $('#transit-total').textContent = pending.filter(TransferLedger.waiting).length+' WAITING · '+pending.filter(TransferLedger.inTransit).reduce((n,t)=>n+t.qty,0)+' UNITS MOVING';
  const freeMovers=movers.filter(m=>!pending.some(t=>t.moverId===m.id));
  $('#pending-transfers').innerHTML=pending.length?pending.map(t=>{
    const waiting=TransferLedger.waiting(t);
    const action=waiting?'<div class="assignment"><label for="assign-'+E(t.id)+'">Choose transporter</label><select id="assign-'+E(t.id)+'">'+freeMovers.map(m=>'<option value="'+m.id+'">'+E(m.name)+'</option>').join('')+'</select><button class="action" type="button" data-assign="'+E(t.id)+'" '+(freeMovers.length?'':'disabled')+'>Assign transporter</button>'+(freeMovers.length?'':'<small>All five movers are on a task.</small>')+'</div>':'<button class="action receive-button" type="button" data-receive="'+E(t.id)+'">Confirm receipt at '+E(t.to)+'</button>';
    return '<article class="transfer-ticket" id="transfer-'+E(t.id)+'"><div><span class="transit-badge '+(waiting?'waiting':'')+'">'+(waiting?'Looking for transporter':E(moverName(t.moverId))+' · On a task')+'</span><h3>'+t.qty+' × '+E(t.item)+'</h3><p>'+E(t.from)+' → '+E(t.to)+'</p><small>Initiated '+formatEventTime(t.at)+' · '+(waiting?'Reserved at source':'Destination stock unchanged')+'</small></div>'+action+'</article>';
  }).join(''):'<p class="empty-transfers">No active transfers. Select a mover on the map or request a transfer.</p>';
  document.querySelectorAll('[data-receive]').forEach(button=>button.onclick=()=>openDelivery(button.dataset.receive));
  document.querySelectorAll('[data-assign]').forEach(button=>button.onclick=()=>assignTransporter(button.dataset.assign));
  const history=D.transfers.filter(t=>t.status==='delivered').sort((a,b)=>b.deliveredAt-a.deliveredAt).slice(0,8);
  $('#delivered-transfers').innerHTML=history.map(t=>'<div class="history-row"><span>✓ '+t.qty+' × '+E(t.item)+' · '+E(t.to)+'</span><small>'+new Date(t.deliveredAt).toLocaleString()+'</small></div>').join('')||'<p class="hint">No deliveries confirmed in this workflow yet.</p>';
  let paths='',people='';
  movers.forEach(mover=>{
    const t=pending.find(t=>t.moverId===mover.id);
    if(!t) {
      const home=mover.home;
      people+='<button type="button" class="mover idle" data-mover="'+mover.id+'" aria-label="'+E(mover.name)+', available. Select to transfer." style="left:'+home[0]+'%;top:'+home[1]+'%;--mover-color:'+mover.color+'">'+trolleySprite(mover.color)+'<span class="mover-name">'+E(mover.name)+'</span></button>';
      return;
    }
    const [sx,sy]=positions[t.from], [ex,ey]=positions[t.to],elapsed=Math.min(walkDuration,Math.max(0,Date.now()-(t.assignedAt||t.at)));
    paths+='<path d="M '+sx+' '+sy+' L 50 61 L '+ex+' '+ey+'" />';
    people+='<button type="button" class="runner mover '+(elapsed>=walkDuration?'awaiting':'')+'" data-mover="'+mover.id+'" data-runner="'+E(t.id)+'" data-destination-side="'+(ex>=50?'right':'left')+'" aria-label="'+E(mover.name)+', delivering '+E(t.qty+' '+t.item+' from '+t.from+' to '+t.to)+'. Select for delivery status." style="--sx:'+sx+'%;--sy:'+sy+'%;--ex:'+ex+'%;--ey:'+ey+'%;--mover-color:'+mover.color+';animation-delay:-'+elapsed+'ms">'+trolleySprite(mover.color)+'<span class="mover-name">'+E(mover.name)+'</span><span class="runner-label">'+mover.number+' · '+t.qty+' units · <span class="runner-state">'+(elapsed>=walkDuration?'Confirm receipt':'On the way')+'</span></span></button>';
  });
  $('#venue').insertAdjacentHTML('beforeend','<svg class="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+paths+'</svg>'+people+'<div class="mover-menu" id="mover-menu" hidden></div><div class="team-label">Hands team · '+(5-pending.filter(t=>t.moverId).length)+'/5 available</div>');
  document.querySelectorAll('[data-mover]').forEach(button=>button.onclick=()=>showMoverMenu(button.dataset.mover));
  if(selectedMoverId)showMoverMenu(selectedMoverId,true);
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
    notify(TransferLedger.waiting(result.transfer)?'Transfer initiated successfully. Looking for a transporter; stock is reserved.':'Transfer initiated successfully. '+moverName(result.transfer.moverId)+' is moving '+result.transfer.qty+' units to '+result.transfer.to+'.');
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
  if(!transfer || !TransferLedger.inTransit(transfer)) return;
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
fill('#from',L);fill('#to',L);$('#titem').value=M[0][0];
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
function formatEventTime(at){return at?new Date(at).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'}):'Time unavailable';}
async function assignTransporter(id){
  if(transferBusy)return;
  const moverId=$('#assign-'+id).value;
  transferBusy=true;
  try{
    const result=await mutateTransfers(fresh=>TransferLedger.assignMover(fresh,id,moverId,Date.now()));
    notify(result.ok?moverName(moverId)+' is now on a task.':result.error);
  }catch(error){notify('Assignment could not be saved. Please try again.');}
  finally{transferBusy=false;}
}
render();

function eventTime(order){return new Date(order.closedDate).getTime()}
function formattedClock(){return simulationClock?new Date(simulationClock).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}):'11:00 AM'}
function updateSimulatorUi(){
  const start=$('#sim-start'),pause=$('#sim-pause'),reset=$('#sim-reset'),step=$('#sim-step'),progress=$('#sim-progress'),clock=$('#sim-clock'),state=$('#sim-state');
  if(!start) return;
  const done=toastEvents.length&&simulationIndex>=toastEvents.length;
  start.disabled=!toastEvents.length||!!simulationTimer||done;
  pause.disabled=!simulationTimer;
  reset.disabled=!toastEvents.length;
  step.disabled=!toastEvents.length||!!simulationTimer||done;
  progress.textContent=toastEvents.length?simulationIndex+' / '+toastEvents.length+' transactions processed':'Loading transaction feed…';
  clock.textContent='Event time: '+formattedClock();
  state.textContent=!toastEvents.length?'Loading practice data':done?'Scenario complete':simulationTimer?'Live simulation':'Ready to run';
  state.className='sim-state '+(simulationTimer?'live':done?'complete':'ready');
  renderSalesFeed();
}
function setupSimulatorUi(){
  if(!document.head||!$('#kpis'))return;
  document.head.insertAdjacentHTML('beforeend','<style>.simulator{margin:0 0 16px;padding:18px;border:1px solid #99f6e4;border-radius:18px;background:#ecfdf5;box-shadow:var(--shadow)}.simulator-top{display:flex;justify-content:space-between;gap:16px;align-items:center}.simulator h2{margin:3px 0}.sim-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.sim-controls button,.sim-controls select{width:auto;min-height:42px}.sim-controls button{padding:0 14px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#172033;font-weight:800;cursor:pointer}.sim-controls button.primary{background:#0f766e;color:#fff;border-color:#0f766e}.sim-controls button:disabled{opacity:.45;cursor:not-allowed}.sim-status{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 0;color:#475569;font:800 11px ui-monospace,monospace}.sim-status span{padding:7px 9px;border-radius:8px;background:#fff;border:1px solid #dceee8}.sim-state.live{color:#075c55;background:#d1fae5}.sim-state.complete{color:#1e40af;background:#dbeafe}.sim-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px;margin-top:14px}.suggestions,.sale-feed{border:1px solid #b7e7db;border-radius:12px;padding:12px;background:#ffffffa8}.suggestions-head,.sale-feed-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.suggestions h3,.sale-feed h3{margin:0;font-size:15px}.suggestion-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:9px;margin-top:9px}.suggestion{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:10px}.suggestion strong{display:block;font-size:13px}.suggestion p{margin:4px 0 8px;color:#526174;font-size:12px}.suggestion button{border:1px solid #0f766e;border-radius:7px;background:#fff;color:#0f766e;font-weight:800;padding:7px 9px;cursor:pointer}.mode-toggle{display:flex;align-items:center;gap:7px;font:700 12px/1.2 Inter,system-ui,sans-serif;color:#334155}.mode-toggle input{width:18px;min-height:18px}.sale-feed-list{display:grid;gap:7px;margin-top:9px}.sale-event{display:flex;justify-content:space-between;gap:8px;padding:8px;border-radius:8px;background:#fff;border-left:3px solid #0f766e;font-size:12px}.sale-event small{color:#526174}.sale-event strong{white-space:nowrap}.sale-event.comp{border-left-color:#9a3412}.sale-event.void{border-left-color:#b91c1c}@media(max-width:800px){.simulator-top,.sim-grid{display:block}.sim-controls{margin-top:12px}.sale-feed{margin-top:12px}}</style>');
  document.querySelector('#kpis').insertAdjacentHTML('beforebegin','<section class="simulator" aria-labelledby="sim-title"><div class="simulator-top"><div><div class="eyebrow">Practice mode</div><h2 id="sim-title">Live sales simulator</h2><p class="hint">Run the event continuously or step through one transaction at a time.</p></div><div class="sim-controls"><select id="sim-speed" aria-label="Simulation speed"><option value="0.25">Slow · ¼×</option><option value="1" selected>Normal · 1×</option><option value="5">Fast · 5×</option><option value="20">Very fast · 20×</option></select><button id="sim-start" class="primary" type="button">Start event</button><button id="sim-pause" type="button">Pause</button><button id="sim-step" type="button">Step 1 sale</button><button id="sim-reset" type="button">Reset</button></div></div><div class="sim-status" aria-live="polite"><span id="sim-state" class="sim-state ready">Loading practice data</span><span id="sim-clock">Event time: 11:00 AM</span><span id="sim-progress">Loading transaction feed…</span></div><div class="sim-grid"><section class="suggestions" aria-labelledby="suggestion-title"><div class="suggestions-head"><div><div class="eyebrow">Operations guide</div><h3 id="suggestion-title">Transfer suggestions</h3></div><label class="mode-toggle"><input id="suggestion-mode" type="checkbox" checked> Suggest transfers</label></div><div id="suggestion-list" class="suggestion-list"><p class="hint">Start the simulation to receive recommendations.</p></div></section><section class="sale-feed" aria-labelledby="sale-feed-title"><div class="sale-feed-head"><div><div class="eyebrow">Live activity</div><h3 id="sale-feed-title">Latest transactions</h3></div></div><div id="sale-feed-list" class="sale-feed-list"><p class="hint">Transactions will appear here as the event begins.</p></div></section></div></section>');
  $('#sim-speed').onchange=e=>{simulationSpeed=Number(e.target.value)};
  $('#sim-start').onclick=startSimulation; $('#sim-pause').onclick=pauseSimulation; $('#sim-step').onclick=stepSimulation; $('#sim-reset').onclick=resetSimulation;
  $('#suggestion-mode').onchange=e=>{suggestionMode=e.target.checked;renderSuggestions()};
}
function processOrder(order){
  const sales=order.checks.flatMap(check=>check.selections.filter(selection=>selection.reziDashboard.inventoryImpact>0).map(selection=>({item:selection.item.name,location:order.restaurant.name,qty:selection.reziDashboard.inventoryImpact,at:order.closedDate,orderId:order.guid})));
  D.sales.push(...sales);
  dashboardRevenueOverride=money2((dashboardRevenueOverride||0)+order.reziDashboard.recognizedRevenue);
  locationRevenue[order.restaurant.name]=money2((locationRevenue[order.restaurant.name]||0)+order.reziDashboard.recognizedRevenue);
  simulationLog.unshift({id:order.guid,location:order.restaurant.name,time:order.closedDate,revenue:order.reziDashboard.recognizedRevenue,status:order.reziDashboard.orderStatus,items:sales.map(s=>s.qty+' × '+s.item).join(', ')});
  simulationLog=simulationLog.slice(0,5);
  const paid=order.reziDashboard.recognizedRevenue>0;
  const effect={id:order.guid+'-'+Date.now(),location:order.restaurant.name,label:paid?dollars(order.reziDashboard.recognizedRevenue):order.reziDashboard.orderStatus==='COMPED'?'COMP':'VOID',kind:paid?'paid':order.reziDashboard.orderStatus==='COMPED'?'comp':'void',createdAt:Date.now()};
  saleEffects.push(effect);
  setTimeout(()=>{saleEffects=saleEffects.filter(x=>x.id!==effect.id);document.querySelector('[data-sale-effect="'+effect.id+'"]')?.remove()},1600);
}
function money2(n){return Math.round(n*100)/100}
function mapInteractionActive(){return Boolean(document.querySelector('.shop:hover,.team-edit-map:hover,.mover:hover,#mover-menu:hover'))}
function runSimulationFrame(){
  if(!simulationClock||simulationIndex>=toastEvents.length){pauseSimulation();return}
  simulationClock+=simulationSpeed*15000;
  while(simulationIndex<toastEvents.length&&eventTime(toastEvents[simulationIndex])<=simulationClock){processOrder(toastEvents[simulationIndex++])}
  localStorage.setItem(key,JSON.stringify(D));if(!mapInteractionActive())render();else {renderSuggestions();updateCommandBadges()}updateSimulatorUi();
  if(simulationIndex>=toastEvents.length){pauseSimulation();notify('Event simulation complete. All 480 transactions have been processed.');}
}
function startSimulation(){
  if(simulationTimer)return;
  if(!toastEvents.length){
    $('#sim-progress').textContent='Still loading transactions… please try again in a moment.';
    loadToastMock();
    return;
  }
  simulationTimer=setInterval(runSimulationFrame,250);updateSimulatorUi();runSimulationFrame();
}
function stepSimulation(){
  if(!toastEvents.length||simulationTimer||simulationIndex>=toastEvents.length)return;
  const order=toastEvents[simulationIndex++];simulationClock=eventTime(order);processOrder(order);
  localStorage.setItem(key,JSON.stringify(D));render();updateSimulatorUi();
  if(simulationIndex>=toastEvents.length)notify('Event simulation complete. All 480 transactions have been processed.');
}
function pauseSimulation(){if(simulationTimer){clearInterval(simulationTimer);simulationTimer=null}updateSimulatorUi()}
function resetSimulation(){pauseSimulation();simulationIndex=0;simulationClock=toastEvents.length?eventTime(toastEvents[0]):null;D={sales:[],transfers:[]};dashboardRevenueOverride=0;locationRevenue={};simulationLog=[];saleEffects=[];localStorage.setItem(key,JSON.stringify(D));render();updateSimulatorUi();notify('Simulation reset to the start of service.');}
function openSuggestion(item,from,to,qty){activeMover=null;$('#from').value=from;$('#to').value=to;$('#titem').value=item;$('#tqty').value=qty;updateAvailability();$('#transfer-dialog').showModal();}
function renderSuggestions(){
  const host=$('#suggestion-list');if(!host)return;
  if(!suggestionMode){host.innerHTML='<p class="hint">Suggestion mode is paused. You can still make transfers manually.</p>';return}
  if(!D.sales.length){host.innerHTML='<p class="hint">Recommendations appear as sales move inventory toward low-stock levels.</p>';return}
  const candidates=[];
  S.forEach(to=>M.forEach(([item,,stock])=>{const opening=stock[L.indexOf(to)],left=st(item,to),ratio=left/opening;if(!opening||ratio>.2)return;const from=S.filter(place=>place!==to).map(place=>({place,left:st(item,place)})).filter(x=>x.left>Math.max(6,Math.ceil(opening*.3))).sort((a,b)=>b.left-a.left)[0];if(from){const qty=Math.min(Math.max(1,Math.ceil(opening*.4)-left),Math.max(1,Math.floor(from.left*.25)));candidates.push({item,from:from.place,to,qty,left,urgent:ratio<=.1})}}));
  const shown=candidates.sort((a,b)=>a.left-b.left).slice(0,3);
  host.innerHTML=shown.length?shown.map(x=>'<article class="suggestion"><strong>'+(x.urgent?'Urgent · ':'')+'Move '+x.qty+' × '+E(x.item)+'</strong><p>'+E(x.to)+' has '+x.left+' left. '+E(x.from)+' can spare stock without creating a low-stock alert.</p><button type="button" data-suggest-item="'+E(x.item)+'" data-suggest-from="'+E(x.from)+'" data-suggest-to="'+E(x.to)+'" data-suggest-qty="'+x.qty+'">Prepare transfer</button></article>').join(''):'<p class="hint">Inventory is balanced. No transfer is suggested right now.</p>';
  if(host.querySelectorAll)host.querySelectorAll('[data-suggest-item]').forEach(button=>button.onclick=()=>openSuggestion(button.dataset.suggestItem,button.dataset.suggestFrom,button.dataset.suggestTo,Number(button.dataset.suggestQty)));
}
function renderSalesFeed(){
  const host=$('#sale-feed-list');if(!host)return;
  if(!simulationLog.length){host.innerHTML='<p class="hint">Transactions will appear here as the event begins.</p>';return}
  host.innerHTML=simulationLog.map(entry=>'<article class="sale-event '+(entry.status==='VOIDED'?'void':entry.status==='COMPED'?'comp':'')+'"><div><strong>'+E(entry.location)+'</strong><small>'+E(entry.items||entry.status.toLowerCase())+' · '+new Date(entry.time).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'})+'</small></div><strong>'+dollars(entry.revenue)+'</strong></article>').join('');
}
function renderActivityPanel(){
  const host=$('#activity-content');if(!host)return;
  const sales=simulationLog.length?simulationLog.map(entry=>'<article class="command-row"><div><strong>'+E(entry.location)+'</strong><small>'+E(entry.items||entry.status)+' · '+new Date(entry.time).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'})+'</small></div><strong>'+dollars(entry.revenue)+'</strong></article>').join(''):'<p class="hint">Start the simulator to see live sales.</p>';
  const delivered=D.transfers.filter(TransferLedger.delivered).slice().sort((a,b)=>(b.deliveredAt||b.at)-(a.deliveredAt||a.at)).slice(0,6);
  const transfers=delivered.length?delivered.map(t=>'<article class="command-row"><div><strong>'+E(t.item)+'</strong><small>'+E(t.from)+' → '+E(t.to)+'</small></div><strong>Delivered</strong></article>').join(''):'<p class="hint">No delivered transfers yet.</p>';
  host.innerHTML='<section><div class="eyebrow">Live activity</div><h3>Latest sales</h3>'+sales+'</section><section><div class="eyebrow">Delivered transfers</div><h3>Transfer history</h3>'+transfers+'</section>';
}
function renderNotificationPanel(){
  const host=$('#notification-content');if(!host)return;
  const issues=[];S.forEach(location=>M.forEach(([item])=>{const state=status(item,location);if(op(item,location)&&state!=='ok')issues.push({item,location,state,left:st(item,location)})}));
  const transfers=D.transfers.filter(TransferLedger.pending);
  const alerts=issues.length?issues.slice(0,8).map(x=>'<article class="command-row '+x.state+'"><div><strong>'+E(x.item)+'</strong><small>'+E(x.location)+' · '+healthText(x.state,x.left)+'</small></div><strong>'+x.left+' left</strong></article>').join(''):'<p class="hint">No refill or stockout alerts.</p>';
  const moving=transfers.length?transfers.map(t=>'<article class="command-row"><div><strong>'+E(t.item)+'</strong><small>'+E(t.from)+' → '+E(t.to)+'</small></div><strong>'+E(t.status==='in_transit'?'In transit':'Waiting')+'</strong></article>').join(''):'<p class="hint">No stock is in transit.</p>';
  host.innerHTML='<section><div class="eyebrow">Suggested transfers</div><h3>Next best moves</h3><div class="command-suggestions">'+($('#suggestion-list')?.innerHTML||'<p class="hint">Start the simulation for suggestions.</p>')+'</div></section><section><div class="eyebrow">Refill & stockout signals</div><h3>Attention needed</h3>'+alerts+'</section><section><div class="eyebrow">In transit</div><h3>Transfers moving now</h3>'+moving+'</section>';
}
function updateCommandBadges(){
  const badge=$('#notification-badge');if(!badge)return;
  let count=D.transfers.filter(TransferLedger.pending).length;
  S.forEach(location=>M.forEach(([item])=>{if(op(item,location)&&status(item,location)!=='ok')count++}));
  badge.textContent=count>99?'99+':String(count);
  badge.hidden=count===0;
  badge.setAttribute('aria-label',count+' unread operations notifications');
}
function setupCommandMenu(){
  const top=document.querySelector('.top');if(!top||$('#command-menu'))return;
  document.head.insertAdjacentHTML('beforeend','<style>.command-menu{display:flex;gap:8px;align-items:center;margin:12px 0 16px}.command-menu button{display:flex;align-items:center;gap:7px;border:1px solid #d8d0c5;border-radius:9px;background:#fff;padding:9px 11px;color:#334155;font:800 12px Inter,system-ui,sans-serif;cursor:pointer}.command-menu button:hover{border-color:#0f766e;color:#0f766e}.command-menu svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.notification-button{position:relative}.notification-badge{position:absolute;right:-7px;top:-8px;min-width:18px;height:18px;padding:0 4px;border:2px solid #fff;border-radius:999px;background:#dc2626;color:#fff;font:800 10px/14px ui-monospace,monospace;text-align:center}.mapcard>.head{display:none}.mapcard{padding:12px}.mapcard .venue{margin-top:0}.venue:after{display:none}.transfer-panel,.lower{display:none!important}.shop-tooltip{display:none!important}.command-dialog{width:min(650px,calc(100vw - 28px));max-height:80vh;border:0;border-radius:18px;padding:0;background:#fff;color:#172033;box-shadow:0 25px 80px #17203355}.command-dialog::backdrop{background:#17203399}.command-dialog-inner{padding:20px;overflow:auto;max-height:80vh}.command-dialog-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.command-dialog h2{margin:4px 0 14px}.command-dialog h3{font-size:15px;margin:3px 0 8px}.command-dialog section+section{margin-top:18px;padding-top:15px;border-top:1px solid #e5e7eb}.command-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid #edf0f2;font-size:13px}.command-row small{display:block;color:#64748b;margin-top:2px}.command-row.critical,.command-row.out{border-left:3px solid #dc2626;padding-left:8px}.command-suggestions .suggestion-list{display:block}.command-suggestions .suggestion{margin:7px 0}.command-close{width:40px;height:40px;border:1px solid #d8d0c5;border-radius:9px;background:#fff;font-size:25px;line-height:1;cursor:pointer}@media(max-width:600px){.command-menu{overflow:auto;padding-bottom:2px}.command-menu button{white-space:nowrap}}</style>');
  document.head.insertAdjacentHTML('beforeend','<style>.shop-tooltip{display:block!important}.shop.active{outline:0!important;filter:none!important}.shop.active .shop-hud{transform:translateX(-50%) scale(1.03)}.shop.warehouse.active .shop-hud{transform:scale(1.03)}</style>');
  top.insertAdjacentHTML('afterend','<nav id="command-menu" class="command-menu" aria-label="Dashboard sections"><button type="button" id="menu-activity"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>Activity</button><button type="button" id="menu-notifications" class="notification-button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 1-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>Notifications<span id="notification-badge" class="notification-badge" hidden></span></button><button type="button" id="menu-simulator"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5z"/></svg>Simulator</button></nav><dialog id="activity-dialog" class="command-dialog" aria-labelledby="activity-title"><div class="command-dialog-inner"><div class="command-dialog-top"><div><div class="eyebrow">Activity</div><h2 id="activity-title">Event activity</h2></div><button class="command-close" type="button" data-command-close="activity-dialog" aria-label="Close activity">×</button></div><div id="activity-content"></div></div></dialog><dialog id="notification-dialog" class="command-dialog" aria-labelledby="notification-title"><div class="command-dialog-inner"><div class="command-dialog-top"><div><div class="eyebrow">Notifications</div><h2 id="notification-title">Operations notifications</h2></div><button class="command-close" type="button" data-command-close="notification-dialog" aria-label="Close notifications">×</button></div><div id="notification-content"></div></div></dialog>');
  const simulator=document.querySelector('.simulator');if(simulator)simulator.hidden=true;
  $('#menu-activity').onclick=()=>{renderActivityPanel();$('#activity-dialog').showModal()};
  $('#menu-notifications').onclick=()=>{renderNotificationPanel();$('#notification-dialog').showModal()};
  $('#menu-simulator').onclick=()=>{simulator.hidden=false;simulator.scrollIntoView({behavior:'smooth',block:'start'});$('#sim-start').focus()};
  document.querySelectorAll('[data-command-close]').forEach(button=>button.onclick=()=>$('#'+button.dataset.commandClose).close());
}
function setupProductPreview(){
  if(!document.head||!document.body)return;
  document.head.insertAdjacentHTML('beforeend','<style>.product-preview-trigger{display:flex;align-items:center;gap:7px;min-width:0;border:0;background:transparent;padding:0;color:inherit;font:inherit;font-weight:700;text-align:left;cursor:zoom-in}.product-preview-trigger>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.product-sprite{display:inline-block;flex:0 0 30px;width:30px;height:30px;border-radius:7px;background-image:url("assets/real-menu-sprites.png");background-size:500% 400%;background-position:calc(var(--sprite-col) * 25%) calc(var(--sprite-row) * 33.333%);image-rendering:auto;border:1px solid #d8d0c5}.product-dialog{max-width:min(560px,calc(100vw - 28px));padding:0;border:0;border-radius:18px;color:#172033;background:#fff;box-shadow:0 25px 80px #17203355}.product-dialog::backdrop{background:#17203399}.product-preview-card{padding:20px}.product-preview-top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.product-preview-top h2{margin:4px 0}.product-preview-close{width:42px;height:42px;border:1px solid #d8d0c5;border-radius:9px;background:#fff;font-size:26px;line-height:1;cursor:pointer}.product-preview-art{display:grid;place-items:center;min-height:300px;margin:16px 0;border-radius:14px;background:linear-gradient(135deg,#fff8f1,#ecfdf5);border:1px solid #d8eee8}.product-sprite-large{width:min(320px,70vw);height:min(320px,70vw);border:0;border-radius:14px;background-size:500% 400%;box-shadow:0 10px 24px #1720331a}.sale-pop{position:absolute;z-index:8;left:50%;top:13%;transform:translateX(-50%);pointer-events:none;padding:5px 8px;border-radius:8px;background:#fff;color:#047857;border:2px solid #99f6e4;font:900 15px ui-monospace,monospace;box-shadow:0 5px 14px #17203333;animation:sale-float 1.4s ease-out forwards}.sale-pop.comp{color:#9a3412;border-color:#fdba74}.sale-pop.void{color:#b91c1c;border-color:#fecaca}@keyframes sale-float{0%{opacity:0;transform:translate(-50%,8px) scale(.8)}15%{opacity:1;transform:translate(-50%,0) scale(1.05)}100%{opacity:0;transform:translate(-50%,-60px) scale(1)}}@media(prefers-reduced-motion:reduce){.sale-pop{animation:none}}@media(max-width:600px){.product-preview-art{min-height:240px}}</style>');
  document.head.insertAdjacentHTML('beforeend','<style>.sale-pop{display:flex;align-items:center;gap:3px;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;color:#facc15;font:900 18px ui-monospace,monospace;letter-spacing:-.04em;text-shadow:2px 2px 0 #713f12,0 0 2px #fff;animation:sale-float-once 1.6s ease-out forwards}.sale-pop::before{content:"+";display:inline-block;font:900 18px/1 ui-monospace,monospace;color:inherit;text-shadow:inherit}.sale-pop.comp,.sale-pop.void{color:#fff7ed;text-shadow:2px 2px 0 #7c2d12;border:0}.sale-pop.comp::before,.sale-pop.void::before{display:none}@keyframes sale-float-once{0%{opacity:0;transform:translate(-50%,10px) scale(.85)}14%{opacity:1;transform:translate(-50%,0) scale(1)}72%{opacity:1;transform:translate(-50%,-24px) scale(1)}100%{opacity:0;transform:translate(-50%,-42px) scale(1)}}@media(prefers-reduced-motion:reduce){.sale-pop{animation:none;opacity:1}}</style>');
  document.body.insertAdjacentHTML('beforeend','<dialog id="product-preview" class="product-dialog" aria-labelledby="product-preview-title"><section class="product-preview-card"><div class="product-preview-top"><div><div class="eyebrow">Menu item</div><h2 id="product-preview-title">Product preview</h2></div><button id="product-preview-close" class="product-preview-close" type="button" aria-label="Close product preview">×</button></div><div id="product-preview-art" class="product-preview-art" role="img"></div><p id="product-preview-description" class="hint">Pixel-art menu image used in the event simulation.</p></section></dialog>');
  $('#product-preview-close').onclick=()=>$('#product-preview').close();
}
function openProductPreview(name){
  const dialog=$('#product-preview');if(!dialog)return;
  $('#product-preview-title').textContent=name;
  $('#product-preview-art').innerHTML=productArt(name,true);
  $('#product-preview-art').setAttribute('aria-label','Pixel-art image of '+name);
  $('#product-preview-description').textContent='Pixel-art preview of '+name+'. Select a station to view its live inventory.';
  dialog.showModal();
}
// This loader reads the normalized fields that a future Toast webhook adapter will write.
async function loadToastMock(){
  try {
    const base='mock-toast-pos/';
    const [configResponse,feedResponse,summaryResponse]=await Promise.all([fetch(base+'event-config.json'),fetch(base+'toast-webhook-events.json'),fetch(base+'dashboard-summary.json')]);
    if(!configResponse.ok||!feedResponse.ok||!summaryResponse.ok)throw new Error('Mock data is unavailable.');
    const [config,feed,summary]=await Promise.all([configResponse.json(),feedResponse.json(),summaryResponse.json()]);
    const opening=Object.fromEntries(config.startingInventory.map(location=>[location.locationName,Object.fromEntries(location.items.map(item=>[item.itemId,item.startingQuantity]))]));
    const backstock={"ITEM-SCHNITZEL":48,"ITEM-BRAT":38,"ITEM-HOTDOG":44,"ITEM-PRETZEL":44,"ITEM-SALAD":25,"ITEM-PUMPKIN":30,"ITEM-CHIPS":30,"ITEM-SNACKS":30,"ITEM-TALEA-PILSNER":38,"ITEM-TALEA-PUMPKIN":34,"ITEM-GRIMM":34,"ITEM-KCBC":34,"ITEM-HUDSON-APPLE":34,"ITEM-HUDSON-PIE":34,"ITEM-LIQUID-FABLES":28,"ITEM-WATER":55,"ITEM-SELTZER":38,"ITEM-RED-JACKET":34,"ITEM-VIP-BEER-FLIGHT":50};
    M.splice(0,M.length,...config.products.map(product=>[product.name,product.price,L.map(location=>location==='Backstock'?(backstock[product.id]||0):(opening[location]?.[product.id]||0)),product.category]));
    toastEvents=feed.events.sort((a,b)=>eventTime(a)-eventTime(b));toastSummary=summary;simulationClock=eventTime(toastEvents[0]);D={sales:[],transfers:[]};dashboardRevenueOverride=0;locationRevenue={};simulationLog=[];saleEffects=[];
    localStorage.setItem(key,JSON.stringify(D));$('#titem').value=M[0][0];document.querySelector('.live').textContent='Toast · Simulator ready';render();updateSimulatorUi();
  }catch(error){
    document.querySelector('.live').textContent='Toast · Practice data unavailable';
    const progress=$('#sim-progress');if(progress)progress.textContent='Could not load the practice transactions. Refresh the page and try again.';
    console.warn('Toast mock feed was not loaded.',error);
  }
}
if(document.head&&$('#kpis')&&typeof fetch==='function'){setupProductPreview();setupSimulatorUi();setupCommandMenu();loadToastMock();}
