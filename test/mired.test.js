import test from "node:test";
import assert from "node:assert/strict";

import {
  getMiredShift,
  kelvinToMired,
  miredToKelvin,
  solveForCamera,
  solveForLight
} from "../src/lib/calculators/mired.js";

test("kelvin converts to mired", () => {
  assert.ok(Math.abs(kelvinToMired(4300) - 232.5581395348837) < 1e-9);
});

test("mired converts to kelvin", () => {
  assert.ok(Math.abs(miredToKelvin(178.57142857142858) - 5600) < 1e-9);
});

test("kelvin and mired round trip", () => {
  const original = 6600;
  const roundTrip = miredToKelvin(kelvinToMired(original));
  assert.ok(Math.abs(roundTrip - original) < 1e-9);
});

test("known solve-for-light example", () => {
  const result = solveForLight(4300, 5600, 3200);
  assert.ok(Math.abs(result.shift - 53.986710963455145) < 1e-9);
  assert.ok(Math.abs(result.resultKelvin - 2728.611898016997) < 1e-9);
});

test("known solve-for-camera example", () => {
  const result = solveForCamera(4300, 5600, 6600);
  assert.ok(Math.abs(result.resultKelvin - 10253.419354838708) < 1e-9);
});

test("extreme but valid inputs remain deterministic", () => {
  const result = solveForLight(1800, 20000, 40000);
  assert.ok(Number.isFinite(result.resultKelvin));
  assert.ok(result.resultKelvin > 0);
});

test("invalid inputs throw", () => {
  assert.throws(() => kelvinToMired(0), /positive finite number/);
  assert.throws(() => solveForCamera(-1, 5600, 6600), /positive finite number/);
});

test("shift sign is preserved", () => {
  assert.ok(getMiredShift(5600, 4300) < 0);
});
