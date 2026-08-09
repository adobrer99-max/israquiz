/* ============================================================
   Item ordering — spec §8.9
   Randomise within each block, never across blocks. Within-block
   randomisation controls for order effects; shuffling topics
   together raises abandonment sharply on an instrument this long.

   The order is seeded and the seed is persisted, so going back,
   closing the tab and resuming all show the same sequence.
   ============================================================ */

import { BLOCK_IDS, ITEMS_BY_BLOCK, type Item } from "../data/items";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function orderedItems(seed: number): Item[] {
  const rand = mulberry32(seed);
  const out: Item[] = [];
  for (const b of BLOCK_IDS) {
    const block = [...ITEMS_BY_BLOCK[b]];
    for (let i = block.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [block[i], block[j]] = [block[j], block[i]];
    }
    out.push(...block);
  }
  return out;
}
