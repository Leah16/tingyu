
export async function detectBPM(buffer: AudioBuffer): Promise<number> {
  // If the buffer is too short, return default
  if (buffer.duration < 10) return 0;

  // We analyze a 30-second slice from the middle of the track to capture the core beat
  // avoiding slow intros or outros.
  const channelData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const sliceDuration = 30;
  const startSample = Math.floor((buffer.length - sampleRate * sliceDuration) / 2);
  const length = Math.min(channelData.length, sampleRate * sliceDuration);
  
  // Create a slice if possible, otherwise use what we have
  const data = startSample > 0 && length > 0 
    ? channelData.slice(startSample, startSample + length) 
    : channelData;

  // 1. Calculate Root Mean Square (RMS) amplitude for small windows (e.g. 50ms)
  // This creates a volume envelope.
  const windowSize = Math.floor(sampleRate * 0.05); // 0.05s window
  const volumeNodes: number[] = [];
  
  for (let i = 0; i < data.length; i += windowSize) {
    let sum = 0;
    // Optimization: stride to save CPU
    const stride = 4; 
    let count = 0;
    for (let j = 0; j < windowSize && i + j < data.length; j+=stride) {
      const val = data[i + j];
      sum += val * val;
      count++;
    }
    volumeNodes.push(Math.sqrt(sum / count));
  }

  // 2. Detect peaks in the volume envelope
  // A peak is defined as a local maximum significantly higher than neighbors
  const peaks: number[] = [];
  for (let i = 1; i < volumeNodes.length - 1; i++) {
    if (volumeNodes[i] > volumeNodes[i-1] && volumeNodes[i] > volumeNodes[i+1]) {
       // Simple threshold: must be somewhat loud to count as a beat
       if (volumeNodes[i] > 0.1) {
         peaks.push(i);
       }
    }
  }

  if (peaks.length < 10) return 0; // Not enough peaks to determine BPM

  // 3. Calculate intervals between peaks
  // We look for the most common distance between peaks
  const intervals: number[] = [];
  // Look ahead a few peaks to find consistent rhythms
  for (let i = 0; i < peaks.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 10, peaks.length); j++) {
      const dist = peaks[j] - peaks[i];
      intervals.push(dist);
    }
  }

  // 4. Histogram of intervals
  const histogram: Record<number, number> = {};
  intervals.forEach(int => {
    // Round to nearest integer to group slightly offset beats
    const quantized = Math.round(int);
    // Weigh smaller intervals slightly less to avoid picking up 1/16th notes excessively
    histogram[quantized] = (histogram[quantized] || 0) + 1;
  });

  // 5. Find the interval with the highest count
  let maxCount = 0;
  let bestInterval = 0;
  for (const k in histogram) {
    if (histogram[k] > maxCount) {
      maxCount = histogram[k];
      bestInterval = parseInt(k);
    }
  }

  if (bestInterval === 0) return 0;

  // 6. Convert interval to BPM
  // bestInterval is in 50ms units. 
  // seconds_per_beat = bestInterval * 0.05
  // BPM = 60 / seconds_per_beat
  let bpm = 60 / (bestInterval * 0.05);

  // 7. Normalize BPM to a standard range (70-160)
  // This handles half-time or double-time detection errors
  while (bpm < 70) bpm *= 2;
  while (bpm > 160) bpm /= 2;

  return Math.round(bpm);
}
