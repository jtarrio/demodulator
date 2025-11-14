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

// Type for I/Q signals.
export type IQ = [Float32Array, Float32Array];

export function iq(length: number): IQ {
  return [new Float32Array(length), new Float32Array(length)];
}

// Computes the root-mean-square difference of two arrays
export function rmsd(a: Float32Array, b: Float32Array): number {
  const num = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < num; ++i) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum / num);
}

// Computes the root-mean-square difference of two I/Q signals.
export function iqRmsd(a: IQ, b: IQ): number {
  const num = Math.min(a.length, b.length);
  let sum = 0;
  for (let c = 0; c < 2; ++c) {
    for (let i = 0; i < num; ++i) {
      const d = a[c][i] - b[c][i];
      sum += d * d;
    }
  }
  return Math.sqrt(sum / num);
}

// Returns an array that counts `length` elements starting from 0.
export function count(length: number): Float32Array;
// Returns an array that counts from `start` to `end` (the `end` is excluded.)
export function count(start: number, end: number): Float32Array;
export function count(startOrLength: number, end?: number): Float32Array {
  if (end === undefined) {
    return new Float32Array(startOrLength).map((_, i) => i);
  }
  return new Float32Array(end - startOrLength).map((_, i) => i + startOrLength);
}

// Returns a signal's average power.
export function power(s: Float32Array): number {
  const num = s.length;
  let sum = 0;
  for (let i = 0; i < num; ++i) {
    sum += s[i] * s[i];
  }
  return sum / num;
}

// Returns a signal's average power.
export function iqPower(s: IQ): number {
  const num = s.length;
  let sum = 0;
  for (let c = 0; c < 2; ++c) {
    for (let i = 0; i < num; ++i) {
      sum += s[c][i] * s[c][i];
    }
  }
  return sum / num;
}

// Returns a sine tone
export function sineTone(
  length: number,
  sampleRate: number,
  frequency: number,
  amplitude: number,
  phase?: number
): Float32Array {
  phase = phase || 0;
  let out = new Float32Array(length);
  for (let i = 0; i < length; ++i) {
    out[i] =
      amplitude * Math.cos((2 * Math.PI * frequency * i) / sampleRate + phase);
  }
  return out;
}

// Returns an I/Q sine tone
export function iqSineTone(
  length: number,
  sampleRate: number,
  frequency: number,
  amplitude: number,
  phase?: number
): IQ {
  phase = phase || 0;
  let outI = new Float32Array(length);
  let outQ = new Float32Array(length);
  for (let i = 0; i < length; ++i) {
    outI[i] =
      amplitude * Math.cos((2 * Math.PI * frequency * i) / sampleRate + phase);
    outQ[i] =
      amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate + phase);
  }
  return [outI, outQ];
}

// Returns an I/Q real sine tone
export function iqRealSineTone(
  length: number,
  sampleRate: number,
  frequency: number,
  amplitude: number,
  phase?: number
): IQ {
  return [
    sineTone(length, sampleRate, frequency, amplitude, phase),
    new Float32Array(length),
  ];
}

// Adds some DC to a signal
export function addDc(signal: Float32Array, value: number): Float32Array {
  for (let i = 0; i < signal.length; ++i) {
    signal[i] += value;
  }
  return signal;
}

// Adds several signals
export function add(a: Float32Array, ...rest: Float32Array[]): Float32Array {
  for (let i = 0; i < rest.length; ++i) {
    const r = rest[i];
    for (let j = 0; j < r.length && j < a.length; ++j) {
      a[j] += r[j];
    }
  }
  return a;
}

// Adds several I/Q signals
export function iqAdd(a: IQ, ...rest: IQ[]): IQ {
  for (let i = 0; i < rest.length; ++i) {
    const r = rest[i];
    for (let c = 0; c < 2; ++c) {
      for (let j = 0; j < r[c].length && j < a[c].length; ++j) {
        a[c][j] += r[c][j];
      }
    }
  }
  return a;
}

// Returns a piece of an I/Q signal
export function iqSubarray(a: IQ, start: number, end?: number): IQ {
  return [a[0].subarray(start, end), a[1].subarray(start, end)];
}

// Returns the modulus of an element in an I/Q signal
export function modulus(a: IQ, i: number): number {
  return Math.hypot(a[0][i], a[1][i]);
}

// Returns the argument of an element in an I/Q signal
export function argument(a: IQ, i: number): number {
  return Math.atan2(a[1][i], a[0][i]);
}
