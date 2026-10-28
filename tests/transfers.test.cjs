const test=require('node:test');

test('unassigned requests reserve stock, wait for a transporter, and record each state',()=>{
 const d=empty();
 assert.equal(Ledger.initiate(menu,d,request(5,{moverId:null})).ok,true);
 assert.equal(d.transfers[0].status,'looking_for_transporter');
 assert.equal(Ledger.stock(menu,d,'Pretzel','Backstock'),30);
 assert.equal(Ledger.stock(menu,d,'Pretzel','Cherry 1'),10);
 assert.equal(Ledger.confirmDelivery(d,'t1',2000).ok,false);
 assert.equal(Ledger.assignMover(d,'t1','mover-3',3000).ok,true);
 assert.equal(Ledger.stock(menu,d,'Pretzel','Backstock'),30);
 assert.equal(Ledger.assignMover(d,'t1','mover-4',4000).ok,false);
 assert.equal(Ledger.confirmDelivery(d,'t1',5000).ok,true);
 assert.equal(Ledger.stock(menu,d,'Pretzel','Cherry 1'),15);
 assert.deepEqual(d.transfers[0].events.map(e=>e.status),['initiated','looking_for_transporter','in_transit','delivered']);
});
test('stock warnings distinguish healthy, low, near empty, zero and negative',()=>{
 assert.equal(Ledger.stockStatus(20,20),'ok');
 assert.equal(Ledger.stockStatus(4,20),'low');
 assert.equal(Ledger.stockStatus(2,20),'critical');
 assert.equal(Ledger.stockStatus(0,20),'out');
 assert.equal(Ledger.stockStatus(-32,18),'out');
});
test('typed item search matches product fragments, brand, and alternate accent spelling',()=>{
 const b=browser();
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/ui-tools.js'),'utf8'),b.context);
 assert.equal(b.run("findItems('pretz')[0][0]"),'Warm Salted Pretzel VGO');
 assert.equal(b.run("findItems('talea').length"),2);
 assert.equal(b.run("findItems('zokto')[0][0]"),'KCBC Zøktoberfest 16 oz');
 assert.equal(b.run("findItems('no-such-item').length"),0);
 b.run("renderItemSearch('pretz'); selectItem(0)");
 assert.equal(b.el('#titem').value,'Warm Salted Pretzel VGO');
});
test('item rows show severity and history displays queued-to-delivered event trail',()=>{
 const b=browser();
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/ui-tools.js'),'utf8'),b.context);
 b.run("D.sales=[{item:'Warm Salted Pretzel VGO',location:'Atrium 1',qty:23},{item:'Hot Dog',location:'Atrium 1',qty:20}]; render()");
 assert.match(b.el('#detail').innerHTML,/inventory-item critical/);
 assert.match(b.el('#detail').innerHTML,/inventory-item low/);
 assert.match(b.el('#detail').innerHTML,/NEARLY OUT/);
 b.run("D.transfers=[{item:'Hot Dog',from:'Backstock',to:'Cherry 1',qty:3,status:'looking_for_transporter',events:[{status:'initiated',at:1000},{status:'looking_for_transporter',at:1000}]}];renderHistory()");
 assert.match(b.el('#history-list').innerHTML,/Initiated/);
 assert.match(b.el('#history-list').innerHTML,/Looking for transporter/);
});

test('five movers are selectable and the transfer form opens for the selected person',()=>{
 const b=browser();
 assert.equal((b.el('#venue').innerHTML.match(/data-mover=/g)||[]).length,5);
 b.run("openTransfer('mover-3')");
 assert.equal(b.el('#transfer-dialog').open,true);
 assert.match(b.el('#dispatch-mover').textContent,/Mover 3/);
 assert.equal(b.run('activeMover'),'mover-3');
});
test('one delivery per mover; confirmed receipt releases the mover for a new job',()=>{
 const d=empty();
 assert.equal(Ledger.initiate(menu,d,request(5)).ok,true);
 const busy=Ledger.initiate(menu,d,request(5,{id:'t2'}));
 assert.equal(busy.ok,false);assert.match(busy.error,/already delivering/);
 assert.equal(Ledger.initiate(menu,d,request(5,{id:'t3',moverId:'mover-2'})).ok,true);
 assert.equal(Ledger.confirmDelivery(d,'t1',3000).ok,true);
 assert.equal(Ledger.initiate(menu,d,request(5,{id:'t4'})).ok,true);
});
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const Ledger=require('../dist/transfer-ledger.js');
const menu=[['Pretzel',8.5,[10,10,10,10,35]],['VIP Flight',0,[0,45,0,0,0]]];
const empty=()=>({sales:[],transfers:[]});
const request=(qty,extra={})=>({id:'t1',item:'Pretzel',from:'Backstock',to:'Cherry 1',qty,at:1000,moverId:'mover-1',...extra});
test('overstock, fractional, zero and negative transfers never change stock',()=>{
 for(const qty of [36,0,-1,0.5,NaN,Infinity]) {
  const d=empty();const result=Ledger.initiate(menu,d,request(qty));
  assert.equal(result.ok,false);assert.equal(d.transfers.length,0);
  assert.equal(Ledger.stock(menu,d,'Pretzel','Backstock'),35);
 }
});
test('pending units are unavailable at both locations; total including transit is conserved',()=>{
 const d=empty();assert.equal(Ledger.initiate(menu,d,request(30)).ok,true);
 assert.equal(Ledger.stock(menu,d,'Pretzel','Backstock'),5);
 assert.equal(Ledger.stock(menu,d,'Pretzel','Cherry 1'),10);
 assert.equal(Ledger.initiate(menu,d,request(6,{id:'t2'})).ok,false);
 assert.equal(Ledger.initiate(menu,d,request(11,{id:'t3',from:'Cherry 1',to:'Cherry 2'})).ok,false);
 const totals=['Atrium 1','Atrium VIP','Cherry 1','Cherry 2','Backstock'].reduce((n,l)=>n+Ledger.stock(menu,d,'Pretzel',l),0);
 assert.equal(totals+30,75);
});
test('receipt credits destination exactly once, including after refresh',()=>{
 const d=empty();Ledger.initiate(menu,d,request(35));
 const reload=JSON.parse(JSON.stringify(d));
 assert.equal(Ledger.stock(menu,reload,'Pretzel','Backstock'),0);
 assert.equal(Ledger.stock(menu,reload,'Pretzel','Cherry 1'),10);
 assert.equal(Ledger.confirmDelivery(reload,'t1',3000).ok,true);
 assert.equal(Ledger.stock(menu,reload,'Pretzel','Cherry 1'),45);
 assert.equal(Ledger.stock(menu,reload,'Pretzel','Backstock'),0);
 assert.equal(Ledger.confirmDelivery(reload,'t1',4000).ok,false);
 assert.equal(Ledger.stock(menu,reload,'Pretzel','Cherry 1'),45);
});
test('legacy transfers remain received and sales reduce available source stock',()=>{
 const d={sales:[{item:'Pretzel',location:'Backstock',qty:3}],transfers:[{item:'Pretzel',from:'Backstock',to:'Cherry 1',qty:7}]};
 assert.equal(Ledger.stock(menu,d,'Pretzel','Backstock'),25);
 assert.equal(Ledger.stock(menu,d,'Pretzel','Cherry 1'),17);
 assert.equal(Ledger.initiate(menu,d,request(26)).ok,false);
});
test('same location and invalid item/location are rejected; VIP stays at approved locations',()=>{
 const d=empty();
 for(const req of [request(1,{to:'Backstock'}),request(1,{item:'missing'}),request(1,{from:'unknown'}),request(1,{item:'VIP Flight',from:'Atrium VIP',to:'Cherry 1'})])assert.equal(Ledger.initiate(menu,d,req).ok,false);
});
function browser(){
 const elements=new Map(),memory=new Map();
 const el=id=>{
  if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',checked:false,disabled:false,hidden:true,attrs:{},classList:{add(){}},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener(){},insertAdjacentHTML(pos,v){this.innerHTML+=v},scrollIntoView(){},showModal(){this.open=true},close(){this.open=false}});
  return elements.get(id);
 };
 const context=vm.createContext({TransferLedger:Ledger,document:{querySelector:el,querySelectorAll:()=>[]},localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},window:{addEventListener(){}},navigator:{locks:{request:async(k,fn)=>fn()}},crypto:{randomUUID:()=>Math.random().toString(36).slice(2)},setTimeout:()=>1,clearTimeout(){},setInterval(){}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8'),context);
 return {el,context,memory,run:s=>vm.runInContext(s,context)};
}
test('actual form blocks excess, shows success, renders runner, waits for confirmation and preserves reload state',async()=>{
 const b=browser();
 b.run("openTransfer('mover-1')");
 b.el('#titem').value='Warm Salted Pretzel VGO';b.el('#from').value='Backstock';b.el('#to').value='Cherry 1';b.el('#tqty').value='36';
 await b.run('dispatchTransfer({preventDefault(){}})');
 assert.match(b.el('#transfer-error').textContent,/Only 35 units/);
 assert.equal(b.run('D.transfers.length'),0);
 b.el('#tqty').value='30';
 await b.run('dispatchTransfer({preventDefault(){}})');
 assert.match(b.el('#toast-message').textContent,/Transfer initiated successfully/);
 assert.match(b.el('#venue').innerHTML,/runner-person/);
 assert.match(b.el('#pending-transfers').innerHTML,/Confirm receipt at Cherry 1/);
 assert.equal(b.run("st('Warm Salted Pretzel VGO','Backstock')"),5);
 assert.equal(b.run("st('Warm Salted Pretzel VGO','Cherry 1')"),20);
 const stored=JSON.parse(b.memory.get('rezis-inventory-v1'));assert.equal(stored.transfers[0].status,'in_transit');
 b.run('openDelivery(D.transfers[0].id)');
 assert.equal(b.el('#confirm-delivery').disabled,true);
 await b.run('receiveDelivery()');
 assert.equal(b.run("st('Warm Salted Pretzel VGO','Cherry 1')"),20);
 b.el('#receipt-check').checked=true;
 await b.run('receiveDelivery()');
 assert.equal(b.run("st('Warm Salted Pretzel VGO','Cherry 1')"),50);
 assert.equal(b.run("st('Warm Salted Pretzel VGO','Backstock')"),5);
 assert.match(b.el('#toast-message').textContent,/Delivery confirmed/);
 assert.doesNotMatch(b.el('#venue').innerHTML,/class="runner /);
 await b.run('receiveDelivery()');assert.equal(b.run("st('Warm Salted Pretzel VGO','Cherry 1')"),50);
});
test('form revalidates the latest persisted stock before dispatch',async()=>{
 const b=browser();
 b.run("openTransfer('mover-1')");
 b.el('#titem').value='Warm Salted Pretzel VGO';b.el('#from').value='Backstock';b.el('#to').value='Cherry 1';b.el('#tqty').value='10';
 b.memory.set('rezis-inventory-v1',JSON.stringify({sales:[],transfers:[{id:'other-tab',item:'Warm Salted Pretzel VGO',from:'Backstock',to:'Cherry 2',qty:30,at:Date.now(),status:'in_transit'}]}));
 await b.run('dispatchTransfer({preventDefault(){}})');
 assert.match(b.el('#transfer-error').textContent,/Only 5 units/);
 assert.equal(b.run('D.transfers.length'),1);
});
