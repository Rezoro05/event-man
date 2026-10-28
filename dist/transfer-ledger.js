(function (root) {
  'use strict';
  const moverIds = ['mover-1','mover-2','mover-3','mover-4','mover-5'];
  function delivered(t) { return t.status === undefined || t.status === 'delivered'; }
  function inTransit(t) { return t.status === 'in_transit'; }
  function waiting(t) { return t.status === 'looking_for_transporter'; }
  function pending(t) { return inTransit(t) || waiting(t); }
  function stockStatus(current, opening) {
    if (current <= 0) return 'out';
    if (current <= Math.max(2, Math.ceil(opening * .1))) return 'critical';
    if (current <= Math.max(4, Math.ceil(opening * .2))) return 'low';
    return 'ok';
  }
  function stock(menu, state, item, location) {
    const row = menu.find(x => x[0] === item);
    const locations = ['Atrium 1','Atrium VIP','Cherry 1','Cherry 2','Backstock'];
    if (!row || !locations.includes(location)) return 0;
    const opening = row[2][locations.indexOf(location)];
    const sales = state.sales.filter(x => x.item === item && x.location === location).reduce((n,x) => n + x.qty, 0);
    return state.transfers.filter(x => x.item === item).reduce((n,t) => {
      if (delivered(t) && t.to === location) n += t.qty;
      if ((pending(t) || delivered(t)) && t.from === location) n -= t.qty;
      return n;
    }, opening - sales);
  }
  function initiate(menu, state, request) {
    const locations = ['Atrium 1','Atrium VIP','Cherry 1','Cherry 2','Backstock'];
    const {item, from, to, qty, id, at, moverId} = request;
    if (moverId && !moverIds.includes(moverId)) return {ok:false,error:'Select an available mover on the map.'};
    if (moverId && state.transfers.some(t => pending(t) && t.moverId === moverId)) return {ok:false,error:'This mover is already delivering another transfer. Choose an available mover.'};
    if (!menu.some(x => x[0] === item)) return {ok:false,error:'Choose a valid menu item.'};
    if (!locations.includes(from) || !locations.includes(to)) return {ok:false,error:'Choose both locations.'};
    if (from === to) return {ok:false,error:'Choose a destination different from the source.'};
    if (!Number.isSafeInteger(qty) || qty <= 0) return {ok:false,error:'Enter a whole number greater than zero.'};
    if (item === 'VIP Flight' && !['Atrium VIP','Backstock'].includes(to)) return {ok:false,error:'VIP Flight can only be stocked at Atrium VIP or central Backstock.'};
    if (!id || state.transfers.some(t => t.id === id)) return {ok:false,error:'This transfer has already been initiated.'};
    const available = stock(menu,state,item,from);
    if (qty > available) return {ok:false,error:'Only '+Math.max(0,available)+' units of '+item+' are available at '+from+'. Enter a quantity within available stock.'};
    const status = moverId ? 'in_transit' : 'looking_for_transporter';
    const transfer = {id,item,from,to,qty,at,moverId:moverId||null,status,
      events:[{status:'initiated',at},{status,at}]};
    if (moverId) transfer.assignedAt=at;
    state.transfers.push(transfer);
    return {ok:true,transfer};
  }
  function assignMover(state,id,moverId,at) {
    const transfer=state.transfers.find(t=>t.id===id);
    if (!transfer || !waiting(transfer)) return {ok:false,error:'This request is no longer looking for a transporter.'};
    if (!moverIds.includes(moverId)) return {ok:false,error:'Select an available mover.'};
    if (state.transfers.some(t=>pending(t)&&t.moverId===moverId)) return {ok:false,error:'This mover is busy. Select another mover.'};
    transfer.moverId=moverId;
    transfer.status='in_transit';
    transfer.assignedAt=at;
    transfer.events=transfer.events||[];
    transfer.events.push({status:'in_transit',at});
    return {ok:true,transfer};
  }
  function confirmDelivery(state,id,at) {
    const transfer = state.transfers.find(t => t.id === id);
    if (!transfer || !inTransit(transfer)) return {ok:false,error:'This transfer is not awaiting delivery confirmation.'};
    transfer.status = 'delivered';
    transfer.deliveredAt = at;
    transfer.events=transfer.events||[];
    transfer.events.push({status:'delivered',at});
    return {ok:true,transfer};
  }
  const api = {stock, initiate, assignMover, confirmDelivery, pending, inTransit, waiting, delivered, stockStatus, moverIds};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TransferLedger = api;
})(globalThis);
