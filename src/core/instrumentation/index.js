export function createRuntimeInstrumentationSink() {
  const samples = [];
  return {
    record(metric, value, meta = {}) { samples.push({ metric, value, meta, ts: Date.now() }); },
    flush() { return samples.splice(0, samples.length); },
    snapshot() { return samples.slice(); },
  };
}
