/* Staffing is separate from the stock ledger: moving people never moves products. */
let editingStaffId=null,staffSaving=false,staffReturnFocus=null,teamLocationFilter=null;
const staffSprite=role=>'<span class="staff-sprite sprite-'+role+'" aria-hidden="true"></span>';
function renderStationStaff(){
  const state=StaffRoster.get();
  if(!state){$('#detail').insertAdjacentHTML('afterbegin','<p role="alert" class="transfer-error">'+E(StaffRoster.error())+'</p>');return;}
  const assigned=state.people.filter(p=>p.role!=='hands'&&p.location===sel);
  const count=role=>assigned.filter(p=>p.role===role).length;
  const section='<section class="station-staff" aria-label="Station staff"><div class="staff-heading"><div><div class="eyebrow">Station team · '+E(sel)+'</div><h3>'+count('sales')+' Sales <span>·</span> '+count('chef')+' Chef'+(count('chef')===1?'':'s')+'</h3></div><button type="button" class="reset" id="manage-team">Manage team</button></div><p class="hint">Select a person to rename or move them to another station.</p><div class="staff-cards">'+assigned.map(p=>'<button type="button" class="staff-card" data-staff="'+E(p.id)+'" aria-label="Manage '+E(p.name)+', '+StaffLedger.roles[p.role]+'"><span class="staff-card-art">'+staffSprite(p.role)+'</span><span class="staff-card-info"><strong>'+E(p.name)+'</strong><small>'+StaffLedger.roles[p.role]+'</small><span>Rename / Move →</span></span></button>').join('')+'</div>'+(!assigned.length?'<p class="staff-empty">No Sales or Chefs assigned here. Use Manage team to move someone in.</p>':'')+'<p class="storage-note">Starter roster: one Sales person and one Chef per selling station. Names and assignments are saved in this browser.</p></section>';
  $('#detail').insertAdjacentHTML('afterbegin',section);
  $('#manage-team').onclick=openTeamRoster;
  document.querySelectorAll('[data-staff]').forEach(b=>b.onclick=()=>openStaffEditor(b.dataset.staff));
}
function openStaffEditor(id){
  const p=StaffRoster.get()?.people.find(p=>p.id===id);
  if(!p){notify('Staff roster unavailable.');return;}
  staffReturnFocus=document.activeElement;
  editingStaffId=id;
  $('#staff-title').textContent=p.role==='hands'?'Rename Hand':'Manage '+StaffLedger.roles[p.role];
  $('#staff-avatar').innerHTML=staffSprite(p.role);
  $('#staff-name').value=p.name;
  $('#staff-location').innerHTML=StaffLedger.locations.map(l=>'<option>'+E(l)+'</option>').join('');
  $('#staff-location').value=p.location||'Backstock';
  $('#staff-location-field').hidden=p.role==='hands';
  $('#staff-location').disabled=p.role==='hands';
  $('#staff-help').textContent=p.role==='hands'?'This name follows the Hand on the map and in transfer assignments. Active deliveries stay assigned to the same person.':'Moving this person changes their station assignment immediately. Inventory quantities do not change.';
  $('#staff-error').textContent='';
  $('#staff-name').removeAttribute('aria-invalid');
  $('#staff-save').disabled=false;
  $('#staff-dialog').showModal();
  $('#staff-name').focus();
}
function closeStaffEditor(){
  if(staffSaving)return;
  $('#staff-dialog').close();editingStaffId=null;
  if(staffReturnFocus?.isConnected)staffReturnFocus.focus();
}
async function saveStaff(event){
  event.preventDefault();if(staffSaving||!editingStaffId)return;
  const person=StaffRoster.get()?.people.find(p=>p.id===editingStaffId);
  if(!person)return;
  staffSaving=true;$('#staff-save').disabled=true;
  try{
    const result=await StaffRoster.save(editingStaffId,{name:$('#staff-name').value,location:person.role==='hands'?null:$('#staff-location').value});
    if(!result.ok){$('#staff-error').textContent=result.error;$('#staff-name').setAttribute('aria-invalid','true');return;}
    $('#staff-dialog').close();editingStaffId=null;
    if(result.moved)sel=result.person.location;
    render();
    if($('#team-dialog').open)renderTeamRoster();
    notify(result.moved?result.person.name+' moved from '+result.before.location+' to '+result.person.location+'.':result.person.name+' saved successfully.');
    if($('#team-dialog').open)$('#team-close').focus();
    else if(person.role==='hands')document.querySelector('[data-mover="'+person.id+'"]').focus();
    else {$('#detail').scrollIntoView({behavior:'smooth',block:'start'});$('#manage-team').focus();}
  }finally{staffSaving=false;$('#staff-save').disabled=false;}
}
function renderTeamRoster(){
  const state=StaffRoster.get();
  if(!state){$('#team-list').textContent=StaffRoster.error();return;}
  const people=teamLocationFilter?state.people.filter(p=>p.location===teamLocationFilter):state.people;
  $('#team-title').textContent=teamLocationFilter?teamLocationFilter+' team':'Event team';
  $('#team-list').innerHTML=['sales','chef','hands'].map(role=>'<section class="roster-group"><h3>'+StaffLedger.roles[role]+' <span class="staff-count">'+people.filter(p=>p.role===role).length+'</span></h3>'+people.filter(p=>p.role===role).map(p=>'<div class="roster-row">'+staffSprite(role)+'<div><strong>'+E(p.name)+'</strong><small>'+E(p.location||'Map team · Stock transfers')+'</small></div><button type="button" class="reset" data-roster-edit="'+E(p.id)+'" aria-label="Edit '+E(p.name)+'">✎</button>'+(role!=='hands'?'<button type="button" class="reset danger" data-roster-delete="'+E(p.id)+'" aria-label="Remove '+E(p.name)+'">Remove</button>':'')+'</div>').join('')+'</section>').join('')||'<p class="hint">No team members are assigned here.</p>';
  document.querySelectorAll('[data-roster-edit]').forEach(b=>b.onclick=()=>openStaffEditor(b.dataset.rosterEdit));
  document.querySelectorAll('[data-roster-delete]').forEach(b=>b.onclick=()=>deleteStaff(b.dataset.rosterDelete));
}
function openTeamRoster(location=null){teamLocationFilter=location;renderTeamRoster();$('#team-dialog').showModal();}
async function deleteStaff(id){
  const person=StaffRoster.get()?.people.find(p=>p.id===id);if(!person)return;
  const result=await StaffRoster.remove(id);
  if(!result.ok){notify(result.error);return;}
  render();renderTeamRoster();notify(person.name+' was removed from the station team.');
}
document.body.insertAdjacentHTML('beforeend','<dialog id="staff-dialog" aria-labelledby="staff-title"><button class="modal-close" type="button" id="staff-close" aria-label="Close staff editor">×</button><div id="staff-avatar"></div><h2 id="staff-title">Manage staff</h2><form id="staff-form" novalidate><label for="staff-name">Name</label><input id="staff-name" maxlength="30" autocomplete="off" required aria-describedby="staff-error"><div id="staff-location-field"><label for="staff-location">Assigned station</label><select id="staff-location"></select></div><p class="hint" id="staff-help"></p><p class="transfer-error" id="staff-error" role="alert"></p><button class="action" id="staff-save" type="submit">Save changes</button></form></dialog><dialog id="team-dialog" aria-labelledby="team-title"><button class="modal-close" id="team-close" type="button" aria-label="Close team roster">×</button><div class="eyebrow">People, not products</div><h2 id="team-title">Event team</h2><p class="hint">Sales and Chefs can move between stations. Hands use stock transfers to move goods.</p><div id="team-list"></div><p class="storage-note">Example staffing, editable here. Saved in this browser only.</p></dialog>');
$('#staff-form').onsubmit=saveStaff;
$('#staff-close').onclick=closeStaffEditor;
$('#staff-dialog').addEventListener('cancel',e=>{if(staffSaving)e.preventDefault();else editingStaffId=null;});
$('#team-close').onclick=()=>{teamLocationFilter=null;$('#team-dialog').close()};
window.addEventListener('storage',event=>{if(event.key===StaffRoster.key){StaffRoster.reload();render();if($('#team-dialog').open)renderTeamRoster();}});
render();
