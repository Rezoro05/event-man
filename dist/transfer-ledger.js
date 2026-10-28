(function (root) {
  'use strict';
  function delivered(t) { return t.status === undefined || t.status === 'delivered'; }
  function pending(t) { return t.status === 'in_transit'; }
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
    const {item, from, to, qty, id, at} = request;
    if (!menu.some(x => x[0] === item)) return {ok:false,error:'Choose a valid menu item.'};
    if (!locations.includes(from) || !locations.includes(to)) return {ok:false,error:'Choose both locations.'};
    if (from === to) return {ok:false,error:'Choose a destination different from the source.'};
    if (!Number.isSafeInteger(qty) || qty <= 0) return {ok:false,error:'Enter a whole number greater than zero.'};
    if (item === 'VIP Flight' && !['Atrium VIP','Backstock'].includes(to)) return {ok:false,error:'VIP Flight can only be stocked at Atrium VIP or central Backstock.'};
    if (!id || state.transfers.some(t => t.id === id)) return {ok:false,error:'This transfer has already been initiated.'};
    const available = stock(menu,state,item,from);
    if (qty > available) return {ok:false,error:'Only '+Math.max(0,available)+' units of '+item+' are available at '+from+'. Enter a quantity within available stock.'};
    const transfer = {id,item,from,to,qty,at,status:'in_transit'};
    state.transfers.push(transfer);
    return {ok:true,transfer};
  }
  function confirmDelivery(state,id,at) {
    const transfer = state.transfers.find(t => t.id === id);
    if (!transfer || !pending(transfer)) return {ok:false,error:'This transfer is no longer awaiting delivery confirmation.'};
    transfer.status = 'delivered';
    transfer.deliveredAt = at;
    return {ok:true,transfer};
  }
  const api = {stock, initiate, confirmDelivery, pending, delivered};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TransferLedger = api;
})(globalThis);

