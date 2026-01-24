function bnFromNumber(value) {
  if (!value || value <= 0) return { m: 0, e: 0 };
  const e = Math.floor(Math.log10(Math.abs(value)));
  const m = value / Math.pow(10, e);
  return bnNormalize({ m, e });
}
function bnNormalize(bn) {
  if (!bn.m || bn.m === 0) return { m: 0, e: 0 };
  let m = bn.m;
  let e = bn.e;
  while (m >= 10) { m /= 10; e += 1; }
  while (m < 1) { m *= 10; e -= 1; }
  return { m, e };
}
function bnClone(bn) { return { m: bn.m, e: bn.e }; }
function bnCmp(a, b) {
  if (a.e !== b.e) return a.e > b.e ? 1 : -1;
  if (a.m === b.m) return 0;
  return a.m > b.m ? 1 : -1;
}
function bnAdd(a, b) {
  if (a.m === 0) return bnClone(b);
  if (b.m === 0) return bnClone(a);
  const diff = a.e - b.e;
  if (diff > 15) return bnClone(a);
  if (diff < -15) return bnClone(b);
  if (diff >= 0) {
    return bnNormalize({ m: a.m + b.m * Math.pow(10, -diff), e: a.e });
  }
  return bnNormalize({ m: b.m + a.m * Math.pow(10, diff), e: b.e });
}
function bnSub(a, b) {
  if (bnCmp(a, b) <= 0) return { m: 0, e: 0 };
  const diff = a.e - b.e;
  if (diff > 15) return bnClone(a);
  return bnNormalize({ m: a.m - b.m * Math.pow(10, -diff), e: a.e });
}
function bnMul(a, b) {
  if (a.m === 0 || b.m === 0) return { m: 0, e: 0 };
  return bnNormalize({ m: a.m * b.m, e: a.e + b.e });
}
function bnMulNum(a, n) {
  if (a.m === 0 || n === 0) return { m: 0, e: 0 };
  return bnNormalize({ m: a.m * n, e: a.e });
}
function bnDivNum(a, n) {
  if (a.m === 0) return { m: 0, e: 0 };
  return bnNormalize({ m: a.m / n, e: a.e });
}
function bnToNumber(a) {
  if (a.m === 0) return 0;
  return a.m * Math.pow(10, a.e);
}
function bnToString(a) {
  if (a.m === 0) return "0";
  if (a.e < 6 && a.e > -3) {
    const n = a.m * Math.pow(10, a.e);
    return a.e < 0 ? n.toFixed(2) : n.toFixed(0);
  }
  return `${a.m.toFixed(2)}e${a.e}`;
}
function bnAddInPlace(target, add) {
  const result = bnAdd(target, add);
  target.m = result.m; target.e = result.e;
}
function bnSubInPlace(target, sub) {
  const result = bnSub(target, sub);
  target.m = result.m; target.e = result.e;
}
