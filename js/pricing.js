/*
 * Pakien pricing rules. Pure functions with no DOM access, so the same file
 * runs in the browser (window.Pricing) and in Node unit tests (require()).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Pricing = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DELIVERY = 250;            // standard delivery, per order
  const PRO_DELIVERY = 99;         // delivery for PakienPro members
  const SERVICE_FEE = 99;          // per order
  const FREE_DELIVERY_MIN = 6000;  // subtotal at which delivery is free
  const PRO_DISCOUNT = 0.10;       // PakienPro discount on subtotal
  const PRO_MONTHLY = 299;
  const ADDON_QTY = 2;             // units added by the bundle offer / add-on

  // Buy 2 Get 1 Free: every third unit of the same item is free.
  function linePrice(price, qty) {
    return (qty - Math.floor(qty / 3)) * price;
  }

  // lines: [{ price, qty, ... }]. Returns every figure shown in the order summary.
  function computeTotals(lines, opts) {
    const pro = Boolean(opts && opts.pro);
    const count = lines.reduce((a, l) => a + l.qty, 0);
    const gross = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const subtotal = lines.reduce((a, l) => a + linePrice(l.price, l.qty), 0);
    const bundle = gross - subtotal;
    const proDiscount = pro ? Math.round(subtotal * PRO_DISCOUNT) : 0;
    const delivery = subtotal >= FREE_DELIVERY_MIN ? 0 : (pro ? PRO_DELIVERY : DELIVERY);
    const fee = lines.length ? SERVICE_FEE : 0;
    return { lines, count, gross, bundle, subtotal, proDiscount, delivery, fee, total: subtotal - proDiscount + delivery + fee };
  }

  function formatPKR(n) {
    return 'PKR ' + Math.round(n).toLocaleString('en-US');
  }

  return { DELIVERY, PRO_DELIVERY, SERVICE_FEE, FREE_DELIVERY_MIN, PRO_DISCOUNT, PRO_MONTHLY, ADDON_QTY, linePrice, computeTotals, formatPKR };
});
