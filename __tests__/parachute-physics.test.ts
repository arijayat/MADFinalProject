import {
  computeFallPhysics,
  computeGForceBounce,
  computeGForceNoBounce,
  formatPhysics,
} from '@/utils/parachute-physics';

describe('parachute physics', () => {
  it('computes fall velocity, acceleration, weight, net force, and drag', () => {
    const result = computeFallPhysics(2, 1, 200);

    expect(result?.finalVelocityMs).toBeCloseTo(2);
    expect(result?.accelerationMs2).toBeCloseTo(2);
    expect(result?.netForceN).toBeCloseTo(0.4);
    expect(result?.weightN).toBeCloseTo(1.96);
    expect(result?.dragForceN).toBeCloseTo(1.56);
    expect(result?.gForce).toBeNull();
  });

  it('returns null when fall inputs are not physically usable', () => {
    expect(computeFallPhysics(0, 1, 200)).toBeNull();
    expect(computeFallPhysics(2, 0, 200)).toBeNull();
    expect(computeFallPhysics(2, 1, 0)).toBeNull();
  });

  it('computes impact g-force for bounce and no-bounce landings', () => {
    expect(computeGForceNoBounce(4.9, 0.1)).toBeCloseTo(5);
    expect(computeGForceBounce(4.9, 0.1, 0.5)).toBeCloseTo(10);
  });

  it('formats finite values and placeholders invalid numbers', () => {
    expect(formatPhysics(1.234)).toBe('1.23');
    expect(formatPhysics(1.234, 1)).toBe('1.2');
    expect(formatPhysics(Number.NaN)).toBe('\u2014');
  });
});
