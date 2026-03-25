export interface ReliabilityInput {
  hasLocation: boolean;
  hasMedia: boolean;
  isRegistered: boolean;
  isFirstSubmission: boolean;
  textLength: number;
}

export function calculateReliability(input: ReliabilityInput): number {
  let score = 0;
  if (input.hasLocation) score += 30;
  if (input.hasMedia) score += 20;
  if (input.isRegistered) score += 20;
  if (input.isFirstSubmission) score += 20;
  if (input.textLength < 30) score -= 10;
  return Math.max(0, Math.min(100, score));
}
