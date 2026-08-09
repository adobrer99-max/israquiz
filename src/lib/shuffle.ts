/* ============================================================
   Item ordering — spec §8.9, extended after tester feedback

   §8.9 says to randomise within each block and never across them:
   interleaving topics raises abandonment sharply on an instrument
   this long. That rule leaves a hole it did not anticipate — the
   blocks themselves ran in a fixed order, so every respondent met
   twelve security questions before anything else, and the primacy
   effect from that lands squarely on the axis the grid is built on.

   So: shuffle the order of the blocks, and shuffle items within
   each block, but never interleave. Topic coherence is preserved,
   which is what §8.9 was protecting; the fixed opening is not,
   which is what it missed.

   Both shuffles come from one persisted seed, so going back,
   closing the tab and resuming all show the same sequence.
   ============================================================ */

import { BLOCK_IDS, ITEMS_BY_BLOCK, type BlockId, type Item } from "../data/items";

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

function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The order the topics are presented in for a given seed. */
export function orderedBlocks(seed: number): BlockId[] {
  return shuffled(BLOCK_IDS, mulberry32(seed));
}

export function orderedItems(seed: number): Item[] {
  // One generator, drawn in a fixed sequence: blocks first, then each block's
  // items. Same seed always reproduces the same run.
  const rand = mulberry32(seed);
  const blocks = shuffled(BLOCK_IDS, rand);
  return blocks.flatMap((b) => shuffled(ITEMS_BY_BLOCK[b], rand));
}
