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
import { rmsd } from "../testutil.js";
import { U8ToFloat32 } from "../../src/dsp/converters.js";

test("U8ToFloat32", () => {
  const frequency = 300;
  const sampleRate = 8000;
  let converter = new U8ToFloat32(sampleRate / 100);
  let input = new Uint8Array((2 * sampleRate) / 100).map((_, i) => {
    let x = (2 * Math.PI * frequency * Math.floor(i / 2)) / sampleRate;
    let v = i % 2 == 0 ? Math.cos(x) : Math.sin(x);
    return Math.round((255 * (v + 1)) / 2);
  });
  let [I, Q] = converter.convert(input.buffer);
  let expectedI = new Float32Array(sampleRate / 100).map(
    (_, i) => (255 / 256) * Math.cos((2 * Math.PI * frequency * i) / sampleRate)
  );
  let expectedQ = new Float32Array(sampleRate / 100).map(
    (_, i) => (255 / 256) * Math.sin((2 * Math.PI * frequency * i) / sampleRate)
  );
  assert.isAtMost(rmsd(I, expectedI), 1 / 256);
  assert.isAtMost(rmsd(Q, expectedQ), 1 / 256);
});
