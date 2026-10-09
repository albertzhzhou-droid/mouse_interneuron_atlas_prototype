/** Same-source annotation sampling counts. No geometry or biological error estimate. */

function integer(value, name, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`Invalid ${name}`);
  return value;
}

/** Validate a contiguous partition of every native z plane. */
export function validateSamplingStateRuns(runs, depth) {
  integer(depth, "depth", 1);
  if (!Array.isArray(runs) || runs.length === 0) throw new Error("Missing source-state runs");
  let nextZ = 0;
  const ids = new Set();
  for (const run of runs) {
    integer(run.stateIndex, "stateIndex", 1);
    integer(run.zStartInclusive, "zStartInclusive");
    integer(run.zEndInclusive, "zEndInclusive");
    if (ids.has(run.stateIndex) || run.zStartInclusive !== nextZ || run.zEndInclusive < nextZ || run.zEndInclusive >= depth) {
      throw new Error("Source-state runs must uniquely partition native z");
    }
    if (typeof run.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(run.sha256)) throw new Error("Missing source-state hash");
    ids.add(run.stateIndex);
    nextZ = run.zEndInclusive + 1;
  }
  if (nextZ !== depth) throw new Error("Source-state runs leave native planes uncovered");
  return runs;
}

export function validateSamplingIndices(indices, depth) {
  integer(depth, "depth", 1);
  if (!Array.isArray(indices) || indices.length === 0) throw new Error("Missing sampled planes");
  let previous = -1;
  for (const z of indices) {
    integer(z, "sampled z");
    if (z >= depth || z <= previous) throw new Error("Sampled planes must be unique, increasing native indices");
    previous = z;
  }
  return indices;
}

/** Keep every existing plane and add the integer midpoint of each non-adjacent pair. */
export function buildNestedMidpointSampling(indices, depth) {
  validateSamplingIndices(indices, depth);
  const result = new Set(indices);
  for (let index = 1; index < indices.length; index += 1) {
    if (indices[index] - indices[index - 1] > 1) result.add(Math.floor((indices[index] + indices[index - 1]) / 2));
  }
  return [...result].sort((left, right) => left - right);
}

/** Add one exact label's XY row RLE into a shared native annotation plane. */
export function addSamplingLabelRows(plane, rows, identifier, height, width) {
  integer(identifier, "annotation identifier", 1);
  if (identifier > 0xffffffff) throw new Error("Annotation identifier exceeds uint32");
  integer(height, "height", 1);
  integer(width, "width", 1);
  if (!(plane instanceof Uint32Array) || plane.length !== height * width || !Array.isArray(rows) || rows.length % 3 !== 0) {
    throw new Error("Invalid native row-RLE shape");
  }
  let previousY = -1;
  let previousEnd = -1;
  let count = 0;
  for (let index = 0; index < rows.length; index += 3) {
    const [y, x, length] = rows.slice(index, index + 3);
    integer(y, "row y");
    integer(x, "row x");
    integer(length, "row length", 1);
    if (y >= height || x >= width || length > width - x || y < previousY || (y === previousY && x < previousEnd)) {
      throw new Error("Invalid, unordered or overlapping native row RLE");
    }
    const offset = y * width + x;
    for (let cursor = offset; cursor < offset + length; cursor += 1) {
      if (plane[cursor] !== 0) throw new Error("Different direct annotation labels overlap");
    }
    plane.fill(identifier, offset, offset + length);
    count += length;
    previousY = y;
    previousEnd = x + length;
  }
  return count;
}

function fraction(numerator, denominator) {
  return denominator === 0 ? null : numerator / denominator;
}

/**
 * Counts distinguish sampled voxels from all repeated z planes in represented
 * states. The latter is exact source repetition, never an interpolation model.
 */
export function analyzeSourceSampling({ depth, runs, labels, strategies }) {
  validateSamplingStateRuns(runs, depth);
  if (!Array.isArray(labels) || labels.length === 0 || !Array.isArray(strategies) || strategies.length === 0) {
    throw new Error("Missing direct labels or strategies");
  }
  const labelIds = new Set();
  for (const label of labels) {
    integer(label.identifier, "label identifier", 1);
    if (labelIds.has(label.identifier) || !Array.isArray(label.planeVoxelCounts) || label.planeVoxelCounts.length !== runs.length) {
      throw new Error("Duplicate label or incomplete per-state voxel counts");
    }
    labelIds.add(label.identifier);
    label.planeVoxelCounts.forEach((count) => integer(count, "plane label voxel count"));
    const fullCount = label.planeVoxelCounts.reduce((sum, count, index) => sum + count * (runs[index].zEndInclusive - runs[index].zStartInclusive + 1), 0);
    if (!Number.isSafeInteger(fullCount) || fullCount === 0 || fullCount !== label.fullSourceVoxelCount) {
      throw new Error("Direct label full-volume count disagrees with source-state counts");
    }
  }
  const fullSourceVoxelCount = labels.reduce((sum, label) => sum + label.fullSourceVoxelCount, 0);
  integer(fullSourceVoxelCount, "full source voxel count", 1);
  const strategyIds = new Set();
  return strategies.map((strategy) => {
    if (typeof strategy.id !== "string" || !strategy.id || strategyIds.has(strategy.id)) throw new Error("Invalid or duplicate strategy identity");
    strategyIds.add(strategy.id);
    validateSamplingIndices(strategy.sampledZIndices, depth);
    const sampleCountByState = runs.map((run) => strategy.sampledZIndices.filter((z) => z >= run.zStartInclusive && z <= run.zEndInclusive).length);
    const coveredStateIndices = runs.filter((_, index) => sampleCountByState[index] > 0).map((run) => run.stateIndex);
    const missedStateIndices = runs.filter((_, index) => sampleCountByState[index] === 0).map((run) => run.stateIndex);
    const representedNativePlaneCount = runs.reduce((sum, run, index) => sum + (sampleCountByState[index] > 0 ? run.zEndInclusive - run.zStartInclusive + 1 : 0), 0);
    const labelResults = labels.map((label) => {
      const present = label.planeVoxelCounts.map((count, index) => count > 0 ? index : -1).filter((index) => index >= 0);
      const sampledVoxelCount = label.planeVoxelCounts.reduce((sum, count, index) => sum + count * sampleCountByState[index], 0);
      const representedStateVoxelCount = label.planeVoxelCounts.reduce((sum, count, index) => sum + (sampleCountByState[index] > 0 ? count * (runs[index].zEndInclusive - runs[index].zStartInclusive + 1) : 0), 0);
      const sampledPresenceStateCount = present.filter((index) => sampleCountByState[index] > 0).length;
      return {
        identifier: label.identifier, name: label.name, semanticLaneId: label.semanticLaneId,
        fullSourceVoxelCount: label.fullSourceVoxelCount,
        sampledVoxelCount, sampledVoxelFraction: fraction(sampledVoxelCount, label.fullSourceVoxelCount),
        representedStateVoxelCount, representedStateVoxelFraction: fraction(representedStateVoxelCount, label.fullSourceVoxelCount),
        sourcePresenceStateCount: present.length, sampledPresenceStateCount,
        presenceStatus: sampledVoxelCount > 0 ? "source_present_and_sampled" : "source_present_but_not_sampled",
        missedPresenceStateIndices: present.filter((index) => sampleCountByState[index] === 0).map((index) => runs[index].stateIndex),
      };
    });
    const summarize = (group) => {
      const full = group.reduce((sum, label) => sum + label.fullSourceVoxelCount, 0);
      const sampled = group.reduce((sum, label) => sum + label.sampledVoxelCount, 0);
      const represented = group.reduce((sum, label) => sum + label.representedStateVoxelCount, 0);
      return {
        directLabelCount: group.length, sampledLabelCount: group.filter((label) => label.sampledVoxelCount > 0).length,
        fullSourceVoxelCount: full, sampledVoxelCount: sampled, sampledVoxelFraction: fraction(sampled, full),
        representedStateVoxelCount: represented, representedStateVoxelFraction: fraction(represented, full),
      };
    };
    const laneIds = [...new Set(labels.map((label) => label.semanticLaneId))].sort();
    return {
      ...strategy,
      sampledPlaneCount: strategy.sampledZIndices.length, nativePlaneCount: depth,
      sampledNativePlaneFraction: strategy.sampledZIndices.length / depth,
      sourceStateCount: runs.length, coveredStateCount: coveredStateIndices.length,
      coveredStateFraction: coveredStateIndices.length / runs.length, coveredStateIndices, missedStateIndices,
      representedNativePlaneCount, representedNativePlaneFraction: representedNativePlaneCount / depth,
      totals: summarize(labelResults),
      semanticLanes: laneIds.map((semanticLaneId) => ({ semanticLaneId, ...summarize(labelResults.filter((label) => label.semanticLaneId === semanticLaneId)) })),
      labels: labelResults,
    };
  });
}
