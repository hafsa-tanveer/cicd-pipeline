const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../js/pricing.js');

test('Buy 2 Get 1 Free: every third unit is free', () => {
  assert.equal(P.linePrice(1000, 1), 1000);
  assert.equal(P.linePrice(1000, 2), 2000);
  assert.equal(P.linePrice(1000, 3), 2000);
  assert.equal(P.linePrice(1000, 6), 4000);
});

test('small order pays standard delivery and service fee', () => {
  const t = P.computeTotals([{ price: 1250, qty: 1 }]);
  assert.equal(t.subtotal, 1250);
  assert.equal(t.delivery, P.DELIVERY);
  assert.equal(t.fee, P.SERVICE_FEE);
  assert.equal(t.total, 1250 + 250 + 99);
});

test('delivery is free once the subtotal reaches the threshold', () => {
  const t = P.computeTotals([{ price: 3000, qty: 2 }]);
  assert.equal(t.subtotal, 6000);
  assert.equal(t.delivery, 0);
  assert.equal(t.total, 6000 + 99);
});

test('bundle saving is shown separately from the subtotal', () => {
  const t = P.computeTotals([{ price: 900, qty: 3 }]);
  assert.equal(t.gross, 2700);
  assert.equal(t.subtotal, 1800);
  assert.equal(t.bundle, 900);
});

test('PakienPro gets 10% off and reduced delivery', () => {
  const t = P.computeTotals([{ price: 2000, qty: 1 }], { pro: true });
  assert.equal(t.proDiscount, 200);
  assert.equal(t.delivery, P.PRO_DELIVERY);
  assert.equal(t.total, 2000 - 200 + 99 + 99);
});

test("empty cart has no items and no service fee", () => {
  const t = P.computeTotals([]);
  assert.equal(t.count, 0);
  assert.equal(t.fee, 0);
});

test('prices are formatted as PKR with thousands separators', () => {
  assert.equal(P.formatPKR(12345.4), 'PKR 12,345');
});
