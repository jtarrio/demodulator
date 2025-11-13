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
import { count } from "../testutil.js";
import {
  Float32Buffer,
  Float32RingBuffer,
  IqBuffer,
  U8Buffer,
} from "../../src/dsp/buffers.js";

test("Buffer properties", () => {
  let buffer = new Float32Buffer(3, 64);

  // Fill the 3 arrays
  let b1 = buffer.get(64);
  assert.lengthOf(b1, 64);
  b1.set(count(0, 64));
  let b2 = buffer.get(64);
  assert.lengthOf(b2, 64);
  b2.set(count(100, 164));
  let b3 = buffer.get(64);
  assert.lengthOf(b3, 64);
  b3.set(count(200, 264));

  // Now we get the same 3 arrays again
  let b4 = buffer.get(64);
  assert.strictEqual(b4, b1);
  let b5 = buffer.get(64);
  assert.strictEqual(b5, b2);
  let b6 = buffer.get(64);
  assert.strictEqual(b6, b3);

  // When we request a smaller array, we get a subarray
  let b7 = buffer.get(32);
  assert.deepEqual(b7, count(0, 32));
  assert.notStrictEqual(b7, b1);

  // When we request a larger array, we get a new array
  let b8 = buffer.get(96);
  assert.deepEqual(b8, new Float32Array(96));
  assert.notStrictEqual(b8, b2);
  b8.fill(4);

  // We still get the original array if we keep requesting the original size
  let b9 = buffer.get(64);
  assert.strictEqual(b9, b3);

  // When we request the original size, we get the original array
  let b10 = buffer.get(64);
  assert.strictEqual(b10, b1);

  // For this one, we get a subarray of the larger array
  let b11 = buffer.get(64);
  assert.notStrictEqual(b11, b2);

  // Still the original array
  let b12 = buffer.get(64);
  assert.strictEqual(b12, b3);
});

test("U8Buffer", () => {
  let buffer = new U8Buffer(1, 64);
  assert.typeOf(buffer.get(64), "Uint8Array");
});

test("Float32Buffer", () => {
  let buffer = new Float32Buffer(1, 64);
  assert.typeOf(buffer.get(64), "Float32Array");
});

test("IqBuffer", () => {
  let buffer = new IqBuffer(1, 64);
  let [I, Q] = buffer.get(64);
  assert.typeOf(I, "Float32Array");
  assert.lengthOf(I, 64);
  assert.typeOf(Q, "Float32Array");
  assert.lengthOf(Q, 64);
});

test("Float32RingBuffer copyTo", () => {
  let buffer = new Float32RingBuffer(64);
  const get = (length: number) => {
    let a = new Float32Array(length);
    buffer.copyTo(a);
    return a;
  };

  // Empty buffer
  assert.equal(buffer.capacity, 64);
  assert.equal(buffer.available, 0);
  assert.deepEqual(get(64), new Float32Array(64));

  // Store 48 items
  buffer.store(count(48));
  assert.equal(buffer.capacity, 64);
  assert.equal(buffer.available, 48);

  // copyTo into a small array returns the latest elements,
  // holding the latest element in the last position.
  assert.deepEqual(get(1), count(47, 48));
  assert.deepEqual(get(47), count(1, 48));
  assert.deepEqual(get(48), count(0, 48));
  assert.deepEqual(
    get(49),
    count(-1, 48).map((v) => (v >= 0 ? v : 0))
  );

  // copyTo into a full-size array returns all the elements
  assert.deepEqual(
    get(64),
    count(-16, 48).map((v) => (v >= 0 ? v : 0))
  );

  // Finish filling the buffer, now copyTo returns the full buffer.
  buffer.store(count(48, 64));
  assert.equal(buffer.available, 64);
  assert.deepEqual(get(64), count(64));

  // Small destination still returns the latest elements.
  assert.deepEqual(get(32), count(32, 64));

  // Add one element to the buffer, causing it to roll over.
  buffer.store(count(64, 65));
  assert.equal(buffer.available, 64);
  assert.deepEqual(get(32), count(33, 65));
  assert.deepEqual(get(64), count(1, 65));

  // Add a lot of elements to the buffer, causing it to roll over multiple times.
  buffer.store(count(65, 2000));
  assert.equal(buffer.available, 64);
  assert.deepEqual(get(64), count(1936, 2000));

  // Cannot get more items than fit in the ring buffer.
  assert.deepEqual(
    get(100),
    count(1936, 2036).map((v) => (v >= 2000 ? 0 : v))
  );
});

test("Float32RingBuffer moveTo", () => {
  let buffer = new Float32RingBuffer(64);
  const get = (length: number) => {
    let a = new Float32Array(length);
    buffer.moveTo(a);
    return a;
  };

  // Empty buffer
  assert.equal(buffer.capacity, 64);
  assert.equal(buffer.available, 0);
  assert.deepEqual(get(64), new Float32Array(64));

  // Store 48 items
  buffer.store(count(48));
  assert.equal(buffer.capacity, 64);
  assert.equal(buffer.available, 48);

  // moveTo returns the first unconsumed elements.
  assert.deepEqual(get(1), count(0, 1));
  assert.equal(buffer.available, 47);
  assert.deepEqual(get(10), count(1, 11));
  assert.equal(buffer.available, 37);
  assert.deepEqual(get(20), count(11, 31));
  assert.equal(buffer.available, 17);
  assert.deepEqual(
    get(40),
    count(31, 71).map((v) => (v < 48 ? v : 0))
  );
  assert.equal(buffer.available, 0);
  assert.deepEqual(get(10), new Float32Array(10));
  assert.equal(buffer.available, 0);

  // Add more elements, moveTo returns them
  buffer.store(count(48, 64));
  assert.equal(buffer.available, 16);
  assert.deepEqual(get(16), count(48, 64));

  // You can add and consume elements alternatively
  buffer.store(count(64, 96));
  assert.equal(buffer.available, 32);
  assert.deepEqual(get(16), count(64, 80));
  assert.equal(buffer.available, 16);
  buffer.store(count(96, 104));
  assert.equal(buffer.available, 24);
  assert.deepEqual(get(16), count(80, 96));
  assert.equal(buffer.available, 8);
  buffer.store(count(104, 112));
  assert.equal(buffer.available, 16);
  assert.deepEqual(get(16), count(96, 112));
  assert.equal(buffer.available, 0);

  // Add a ton of elements, moveTo will only return the latest ones
  buffer.store(count(112, 2000));
  assert.equal(buffer.available, 64);
  assert.deepEqual(get(64), count(1936, 2000));

  // moveTo returns the number of elements consumed.
  buffer.store(count(10));
  let t = new Float32Array(6);
  assert.equal(buffer.moveTo(t), 6);
  assert.equal(buffer.moveTo(t), 4);
  assert.equal(buffer.moveTo(t), 0);
});
