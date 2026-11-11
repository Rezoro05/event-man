const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const Staff=require('../dist/staff-ledger.js');
const Transfer=require('../dist/transfer-ledger.js');
test('starter roster has five Hands, two Sales and one Chef at each station',()=>{
 const s=Staff.initial();assert.equal(s.people.length,17);Staff.validate(s);
 for(const l of Staff.locations.slice(0,4)){assert.equal(s.people.filter(p=>p.location===l&&p.role==='sales').length,2);assert.equal(s.people.filter(p=>p.location===l&&p.role==='chef').length,1);}
 assert.equal(s.people.filter(p=>p.role==='hands').length,5);
});
test('moving a Chef updates both station counts without duplicating the person',()=>{
 const s=Staff.initial();const r=Staff.update(s,'chef-1',{name:'Alex',location:'Cherry 2'},1000);
 assert.equal(r.ok,true);assert.equal(r.moved,true);
 assert.equal(s.people.filter(p=>p.role==='chef'&&p.location==='Atrium 1').length,0);
 assert.equal(s.people.filter(p=>p.role==='chef'&&p.location==='Cherry 2').length,2);
 assert.equal(s.people.length,17);assert.equal(s.events[0].from,'Atrium 1');
});
test('Sales can move to Backstock and names trim whitespace',()=>{
 const s=Staff.initial();assert.equal(Staff.update(s,'sales-1',{name:'  Jamie  ',location:'Backstock'},1000).ok,true);
 assert.equal(s.people.find(p=>p.id==='sales-1').name,'Jamie');
});
test('invalid names, stations, and unknown people do not mutate the roster',()=>{
 const s=Staff.initial(),before=JSON.stringify(s);
 for(const name of ['', '   ', 'a'.repeat(31), 'a\nb'])assert.equal(Staff.update(s,'chef-1',{name,location:'Cherry 1'},100).ok,false);
 assert.equal(Staff.update(s,'sales-1',{name:'A',location:'Unknown'},100).ok,false);
 assert.equal(Staff.update(s,'missing',{name:'A',location:'Cherry 1'},100).ok,false);
 assert.equal(Staff.update(s,'mover-1',{name:'A',location:'Cherry 1'},100).ok,false);
 assert.equal(JSON.stringify(s),before);
});
test('renaming a Hand retains its stable delivery assignment and inventory',()=>{
 const s=Staff.initial(),inventory={sales:[],transfers:[]},menu=[['Pretzel',8,[10,10,10,10,30]]];
 Transfer.initiate(menu,inventory,{id:'t1',item:'Pretzel',from:'Backstock',to:'Cherry 1',qty:5,moverId:'mover-1',at:1000});
 const before=JSON.stringify(inventory);
 Staff.update(s,'mover-1',{name:'Morgan',location:null},2000);
 assert.equal(JSON.stringify(inventory),before);assert.equal(inventory.transfers[0].moverId,'mover-1');
 assert.equal(Transfer.stock(menu,inventory,'Pretzel','Cherry 1'),10);
});
function service(memory,throws=false){
 const ctx=vm.createContext({localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>{if(throws)throw Error('Quota');memory.set(k,v)}},navigator:{locks:{request:async(k,fn)=>fn()}}});
 vm.runInContext(fs.readFileSync(require.resolve('../dist/staff-ledger.js'),'utf8'),ctx);return ctx.StaffRoster;
}
test('names and assignments persist after reload and concurrent-tab saves merge',async()=>{
 const memory=new Map(),a=service(memory),b=service(memory);
 await a.save('chef-1',{name:'Alex',location:'Cherry 2'});
 await b.save('sales-1',{name:'Jamie',location:'Backstock'});
 const c=service(memory);assert.equal(c.name('chef-1',''),'Alex');assert.equal(c.name('sales-1',''),'Jamie');
 assert.equal(c.get().people.find(p=>p.id==='chef-1').location,'Cherry 2');
});
test('storage failures and corrupt data are reported without overwriting stored state',async()=>{
 const memory=new Map(),s=service(memory,true);
 assert.equal((await s.save('chef-1',{name:'Alex',location:'Cherry 2'})).ok,false);
 assert.equal(s.name('chef-1',''),'Chef 1');
 memory.set('rezis-staff-v1','broken');const bad=service(memory);
 assert.ok(bad.error());assert.equal(bad.get(),null);
 assert.equal((await bad.save('chef-1',{name:'Alex',location:'Cherry 2'})).ok,false);
 assert.equal(memory.get('rezis-staff-v1'),'broken');
});
