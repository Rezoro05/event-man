'use strict';
let searchResults=[],activeResult=-1;
const normalizeSearch=value=>String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ø/g,'o').replace(/’/g,"'");
function findItems(query){
  const words=normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  return M.filter(item=>words.every(word=>normalizeSearch(item[0]+' '+item[3]).includes(word)));
}
function hideItemSearch(){
  $('#item-results').hidden=true;
  $('#titem').setAttribute('aria-expanded','false');
  $('#titem').removeAttribute('aria-activedescendant');
  activeResult=-1;
}
function renderItemSearch(query){
  searchResults=findItems(query);
  activeResult=-1;
  $('#item-results').innerHTML=searchResults.length?searchResults.map(([name],index)=>{
    const available=st(name,$('#from').value);
    return '<button type="button" role="option" aria-selected="false" tabindex="-1" id="item-choice-'+index+'" data-item-index="'+index+'"><span>'+E(name)+'</span><small>'+Math.max(0,available)+' available</small></button>';
  }).join(''):'<p class="no-results">No matching items. Try a product or brand name.</p>';
  $('#item-results').hidden=false;
  $('#titem').setAttribute('aria-expanded','true');
  $('#titem').removeAttribute('aria-activedescendant');
  document.querySelectorAll('[data-item-index]').forEach(button=>{
    button.addEventListener('mousedown',event=>event.preventDefault());
    button.onclick=()=>selectItem(Number(button.dataset.itemIndex));
  });
}
function selectItem(index){
  const result=searchResults[index];
  if(!result)return;
  $('#titem').value=result[0];
  hideItemSearch();
  $('#transfer-error').textContent='';
  $('#titem').removeAttribute('aria-invalid');
  updateAvailability();
}
function moveResult(direction){
  if($('#item-results').hidden)renderItemSearch(mi($('#titem').value)?'':$('#titem').value);
  if(!searchResults.length)return;
  activeResult=(activeResult+direction+searchResults.length)%searchResults.length;
  document.querySelectorAll('[data-item-index]').forEach((button,index)=>{
    button.setAttribute('aria-selected',String(index===activeResult));
    if(index===activeResult)button.scrollIntoView({block:'nearest'});
  });
  $('#titem').setAttribute('aria-activedescendant','item-choice-'+activeResult);
}
$('#titem').addEventListener('focus',()=>{
  $('#titem').select();
  renderItemSearch(mi($('#titem').value)?'':$('#titem').value);
});
$('#titem').addEventListener('input',()=>{
  renderItemSearch($('#titem').value);
  updateAvailability();
});
$('#titem').addEventListener('keydown',event=>{
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();moveResult(event.key==='ArrowDown'?1:-1);}
  else if(event.key==='Enter'&&!$('#item-results').hidden){
    event.preventDefault();
    if(activeResult>=0)selectItem(activeResult);
    else if(searchResults.length===1)selectItem(0);
  }else if(event.key==='Escape'&&!$('#item-results').hidden){event.preventDefault();event.stopPropagation();hideItemSearch();}
});
$('.item-search').addEventListener('focusout',event=>{
  if(!event.currentTarget.contains(event.relatedTarget))hideItemSearch();
});
$('#from').addEventListener('change',()=>{
  if(!$('#item-results').hidden)renderItemSearch($('#titem').value);
});
$('#transfer-dialog').addEventListener('close',hideItemSearch);
const transferStatusLabels={initiated:'Initiated',looking_for_transporter:'Looking for transporter',in_transit:'On a task',delivered:'Delivered'};
function transferEvents(t){
  if(t.events?.length)return t.events;
  // Prior transfers did not record the complete event trail.
  const events=[];
  if(t.at)events.push({status:'initiated',at:t.at});
  if(t.status==='in_transit')events.push({status:'in_transit',at:t.assignedAt||t.at});
  if(TransferLedger.delivered(t))events.push({status:'delivered',at:t.deliveredAt});
  return events;
}
function renderHistory(){
  const filter=$('#history-filter').value||'all';
  const entries=D.transfers.map((t,index)=>({...t,historyIndex:index})).filter(t=>{
    if(filter==='all')return true;
    if(filter==='initiated')return transferEvents(t).some(event=>event.status==='initiated');
    if(filter==='delivered')return TransferLedger.delivered(t);
    return t.status===filter;
  }).sort((a,b)=>(b.at||0)-(a.at||0)||b.historyIndex-a.historyIndex);
  $('#history-list').innerHTML=entries.map(t=>{
    const state=t.status||'delivered';
    return '<article class="history-ticket"><div class="history-top"><strong>'+t.qty+' × '+E(t.item)+'</strong><span class="history-status '+state+'">'+(transferStatusLabels[state]||state)+'</span></div><p>'+E(t.from)+' → '+E(t.to)+' · '+(t.moverId?E(moverName(t.moverId)):state==='looking_for_transporter'?'Transporter needed':'Transporter not recorded')+'</p><ol class="transfer-timeline">'+transferEvents(t).map(event=>'<li><span>'+transferStatusLabels[event.status]+'</span><time>'+formatEventTime(event.at)+'</time></li>').join('')+'</ol></article>';
  }).join('')||'<p class="empty-transfers">No transfers match this status.</p>';
}
$('#history-filter').onchange=renderHistory;
$('#open-history').onclick=()=>{D=readState();renderHistory();$('#history-dialog').showModal();};
$('#close-history').onclick=()=>$('#history-dialog').close();
$('#request-transfer').onclick=()=>openTransfer(null);
renderHistory();
