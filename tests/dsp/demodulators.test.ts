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
import {
  iqAdd,
  iqRealSineTone,
  iqSineTone,
  iqSubarray,
  modulus,
  power,
} from "../testutil.js";
import {
  AMDemodulator,
  Sideband,
  SSBDemodulator,
} from "../../src/dsp/demodulators.js";
import { FFT } from "../../src/dsp/fft.js";

test("SSBDemodulator USB", () => {
  let demod = new SSBDemodulator(Sideband.Upper);

  const powerForFreq = (freq: number) => {
    let input = iqAdd(iqSineTone(4800, 48000, freq, 1));
    let output = new Float32Array(4800);
    demod.demodulate(input[0], input[1], output);
    return power(output.subarray(2400));
  };

  // We receive strong positive frequencies but very weak negative frequencies
  assert.isAtMost(powerForFreq(-1000), 0.0005);
  assert.isAtMost(powerForFreq(-100), 0.03);
  assert.isAtLeast(powerForFreq(100), 0.3);
  assert.isAtLeast(powerForFreq(1000), 0.49);
});

test("SSBDemodulator LSB", () => {
  let demod = new SSBDemodulator(Sideband.Lower);

  const powerForFreq = (freq: number) => {
    let input = iqAdd(iqSineTone(4800, 48000, freq, 1));
    let output = new Float32Array(4800);
    demod.demodulate(input[0], input[1], output);
    return power(output.subarray(2400));
  };

  // We receive strong negative frequencies but very weak positive frequencies
  assert.isAtLeast(powerForFreq(-1000), 0.49);
  assert.isAtLeast(powerForFreq(-100), 0.3);
  assert.isAtMost(powerForFreq(100), 0.03);
  assert.isAtMost(powerForFreq(1000), 0.0005);
});

test("AMDemodulator", () => {
  const sampleRate = 4096;
  const len = sampleRate * 4;
  let demod = new AMDemodulator(sampleRate);
  const amplitude = (
    carrierFreq: number,
    carrierAmplitude: number,
    freq: number,
    amplitude: number
  ) => {
    let signal = iqRealSineTone(len, sampleRate, freq, amplitude);
    let input = iqSineTone(len, sampleRate, carrierFreq, carrierAmplitude);
    for (let c = 0; c < 2; ++c) {
      for (let i = 0; i < len; ++i) {
        input[c][i] *= (1 + signal[0][i]) / 2;
      }
    }
    let output = new Float32Array(len);
    demod.demodulate(input[0], input[1], output);
    let fft = FFT.ofLength(sampleRate);
    let transformed = fft.transform(
      output.subarray(sampleRate * 3),
      new Float32Array(sampleRate)
    );

    return modulus(transformed, freq);
  };

  // For different carrier offsets and carrier/signal amplitudes,
  // we verify that the received signal amplitude matches the sent amplitude.
  for (let cf = -1000; cf <= 1000; cf += 200) {
    for (let a = 0.1; a <= 1; a += 0.1) {
      assert.approximately(
        amplitude(cf, a, 1000, 0.25),
        0.25,
        0.005,
        `Mismatch in received amplitude for carrier amplitude ${a} and frequency ${cf}`
      );

      assert.approximately(
        amplitude(cf, 0.25, 1000, a),
        a,
        0.005,
        `Mismatch in received amplitude for signal amplitude ${a} and carrier frequency ${cf}`
      );
    }
  }
});
