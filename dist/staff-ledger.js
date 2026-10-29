(function(root){
  'use strict';
  const locations=['Atrium 1','Atrium VIP','Cherry 1','Cherry 2','Backstock'];
  const roles={sales:'Sales',chef:'Chef',hands:'Hands'};
  function initial(){
    return {version:1,people:[
      ...Array.from({length:5},(_,i)=>({id:'mover-'+(i+1),name:'Hand '+(i+1),role:'hands',location:null})),
      ...locations.slice(0,4).flatMap((location,i)=>[
        {id:'sales-'+(i+1),name:'Sales '+(i+1),role:'sales',location},
        {id:'chef-'+(i+1),name:'Chef '+(i+1),role:'chef',location}
      ])],events:[]};
  }
  function validate(state){
    if(!state||state.version!==1||!Array.isArray(state.people)||!Array.isArray(state.events))throw new Error('Staff roster cannot be read.');
    const ids=new Set();
    state.people.forEach(p=>{
      if(!p||typeof p.id!=='string'||ids.has(p.id)||!roles[p.role]||typeof p.name!=='string'||!p.name.trim()||p.name.length>30||
        (p.role==='hands'?p.location!==null:!locations.includes(p.location)))throw new Error('Staff roster contains an invalid person.');
      ids.add(p.id);
    });
    if(!['mover-1','mover-2','mover-3','mover-4','mover-5'].every(id=>state.people.some(p=>p.id===id&&p.role==='hands')))throw new Error('Hands roster is incomplete.');
    return state;
  }
  function update(state,id,changes,at){
    const person=state.people.find(p=>p.id===id);
    if(!person)return {ok:false,error:'This person is no longer in the roster.'};
    const name=typeof changes.name==='string'?changes.name.trim():'';
    if(!name||name.length>30||/[\u0000-\u001f\u007f]/.test(name))return {ok:false,error:'Enter a name between 1 and 30 characters.'};
    const location=person.role==='hands'?null:changes.location;
    if(person.role==='hands'&&changes.location!=null)return {ok:false,error:'Hands move through the stock-transfer workflow.'};
    if(person.role!=='hands'&&!locations.includes(location))return {ok:false,error:'Choose a valid station.'};
    const before={name:person.name,location:person.location};
    person.name=name;person.location=location;
    if(before.name!==name||before.location!==location)state.events.push({personId:id,at,from:before.location,to:location,oldName:before.name,name});
    return {ok:true,person,before,moved:before.location!==location};
  }
  const api={initial,validate,update,locations,roles};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else {
    root.StaffLedger=api;
    const key='rezis-staff-v1';
    let error=null,cache;
    function read(){
      const raw=localStorage.getItem(key);
      return raw?validate(JSON.parse(raw)):initial();
    }
    function reload(){try{cache=read();error=null;}catch(e){error='Staff data could not be read. Stored data was not changed.';cache=null;}}
    reload();
    root.StaffRoster={key,reload,get:()=>cache,error:()=>error,name:(id,fallback)=>cache?.people.find(p=>p.id===id)?.name||fallback,
      async save(id,changes){
        const run=()=>{
          const fresh=read();const result=update(fresh,id,changes,Date.now());
          if(result.ok){localStorage.setItem(key,JSON.stringify(fresh));cache=fresh;error=null;}
          return result;
        };
        try{return await (navigator.locks?navigator.locks.request(key,run):run());}
        catch(e){return {ok:false,error:'Staff changes could not be saved. Nothing was changed. Please check browser storage and try again.'};}
      }
    };
  }
})(globalThis);
