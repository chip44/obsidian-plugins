import { random } from '@shared/utils';
import confetti from 'canvas-confetti';

/* source: official Trello code >:) */

interface ConfettiOptions {
  x: number;
  y: number;
  angle?: number;
  spread?: number;
  particleCount?: number;
}

export function fireConfetti({
  x,
  y,
  angle,
  spread,
  particleCount,
}: ConfettiOptions): Promise<undefined> | null {
  return confetti({
    angle: angle ?? random(55, 125),
    spread: spread ?? random(50, 70),
    particleCount: particleCount ?? random(40, 75),
    origin: { x, y },
  });
}
