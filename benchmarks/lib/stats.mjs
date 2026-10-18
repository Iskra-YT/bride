// Statistics over raw measured samples. Percentiles use the nearest-rank
// method on the sorted samples; every field is derived from measured samples
// only — nothing here estimates or smooths.

/**
 * @param {number[]} samples raw per-iteration measurements
 * @returns {object} spread and central-tendency statistics
 */
export function computeStats(samples) {
    if (!Array.isArray(samples) || samples.length === 0) {
        throw new Error("computeStats() needs at least one sample.");
    }

    const sorted = [...samples].sort((first, second) => first - second);
    const count = sorted.length;
    const mean = sorted.reduce((total, value) => total + value, 0) / count;
    const variance =
        count > 1
            ? sorted.reduce(
                  (total, value) => total + (value - mean) ** 2,
                  0,
              ) / (count - 1)
            : 0;

    const p25 = percentile(sorted, 25);
    const p75 = percentile(sorted, 75);

    return {
        count,
        min: sorted[0],
        max: sorted[count - 1],
        mean,
        stddev: Math.sqrt(variance),
        median: percentile(sorted, 50),
        p25,
        p75,
        iqr: p75 - p25,
    };
}

/** Nearest-rank percentile of an ascending-sorted sample array. */
export function percentile(sortedSamples, fraction) {
    const rank = Math.ceil((fraction / 100) * sortedSamples.length);
    const index = Math.min(Math.max(rank, 1), sortedSamples.length) - 1;

    return sortedSamples[index];
}
