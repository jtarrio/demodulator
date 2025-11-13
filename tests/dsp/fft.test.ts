// Copyright 2025 Jacobo Tarrio Barreiro. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { test, assert } from "vitest";
import { add, rmsd, sineTone } from "../testutil.js";
import { FFT } from "../../src/dsp/fft.js";

test("transform", () => {
  const sampleRate = 4096;
  let fft = FFT.ofLength(4096);
  let iI = add(
    sineTone(fft.length, sampleRate, 300, 0.1, 1),
    sineTone(fft.length, sampleRate, -1300, 0.2, 1.1),
    sineTone(fft.length, sampleRate, 2300, 0.3, 1.2),
    sineTone(fft.length, sampleRate, -3300, 0.4, 1.3)
  );
  let iQ = add(
    sineTone(fft.length, sampleRate, 300, 0.1, 1 - Math.PI / 2),
    sineTone(fft.length, sampleRate, -1300, 0.2, 1.1 - Math.PI / 2),
    sineTone(fft.length, sampleRate, 2300, 0.3, 1.2 - Math.PI / 2),
    sineTone(fft.length, sampleRate, -3300, 0.4, 1.3 - Math.PI / 2)
  );
  let { real: oI, imag: oQ } = fft.transform(iI, iQ);
  assert.approximately(Math.hypot(oQ[300], oI[300]), 0.1, 1e-7);
  assert.approximately(Math.hypot(oQ[4096 - 1300], oI[4096 - 1300]), 0.2, 1e-7);
  assert.approximately(Math.hypot(oQ[2300], oI[2300]), 0.3, 1e-7);
  assert.approximately(Math.hypot(oQ[4096 - 3300], oI[4096 - 3300]), 0.4, 1e-7);
  assert.approximately(Math.atan2(oQ[300], oI[300]), 1, 1e-7);
  assert.approximately(Math.atan2(oQ[4096 - 1300], oI[4096 - 1300]), 1.1, 1e-7);
  assert.approximately(Math.atan2(oQ[2300], oI[2300]), 1.2, 1e-7);
  assert.approximately(Math.atan2(oQ[4096 - 3300], oI[4096 - 3300]), 1.3, 1e-7);
});

test("reverse", () => {
  const sampleRate = 4096;
  let fft = FFT.ofLength(4096);
  let iI = new Float32Array(fft.length);
  let iQ = new Float32Array(fft.length);
  iI[300] = 0.1 * Math.cos(1);
  iQ[300] = 0.1 * Math.sin(1);
  iI[4096 - 1300] = 0.2 * Math.cos(1.1);
  iQ[4096 - 1300] = 0.2 * Math.sin(1.1);
  iI[2300] = 0.3 * Math.cos(1.2);
  iQ[2300] = 0.3 * Math.sin(1.2);
  iI[4096 - 3300] = 0.4 * Math.cos(1.3);
  iQ[4096 - 3300] = 0.4 * Math.sin(1.3);
  let { real: oI, imag: oQ } = fft.reverse(iI, iQ);

  let eI = add(
    sineTone(fft.length, sampleRate, 300, 0.1, 1),
    sineTone(fft.length, sampleRate, -1300, 0.2, 1.1),
    sineTone(fft.length, sampleRate, 2300, 0.3, 1.2),
    sineTone(fft.length, sampleRate, -3300, 0.4, 1.3)
  );
  let eQ = add(
    sineTone(fft.length, sampleRate, 300, 0.1, 1 - Math.PI / 2),
    sineTone(fft.length, sampleRate, -1300, 0.2, 1.1 - Math.PI / 2),
    sineTone(fft.length, sampleRate, 2300, 0.3, 1.2 - Math.PI / 2),
    sineTone(fft.length, sampleRate, -3300, 0.4, 1.3 - Math.PI / 2)
  );
  assert.isAtMost(rmsd(oI, eI), 1e-7);
  assert.isAtMost(rmsd(oQ, eQ), 1e-7);
});

test("roundtrip", () => {
  const sampleRate = 4096;
  let fft = FFT.ofLength(sampleRate);
  let iI = new Float32Array(fft.length);
  let iQ = new Float32Array(fft.length);
  for (let f = 0; f < fft.length / 2; ++f) {
    for (let i = 0; i < fft.length; ++i) {
      iI[i] += Math.cos((2 * Math.PI * f * i) / sampleRate + f) / fft.length;
      iQ[i] += Math.sin((2 * Math.PI * f * i) / sampleRate + f) / fft.length;
    }
  }

  let { real: mI, imag: mQ } = fft.transform(iI, iQ);
  let { real: oI, imag: oQ } = fft.reverse(mI, mQ);

  assert.isAtMost(rmsd(oI, iI), 1e-7);
  assert.isAtMost(rmsd(oQ, iQ), 1e-7);
});
