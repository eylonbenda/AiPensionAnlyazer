import { describe, expect, it } from 'vitest';
import { getPlans, getRedFlags, getThingsToCheck } from './extractionParsing';

describe('extractionParsing guards', () => {
  it('getThingsToCheck returns [] for missing/invalid input', () => {
    expect(getThingsToCheck(null)).toEqual([]);
    expect(getThingsToCheck(undefined)).toEqual([]);
    expect(getThingsToCheck({ thingsToCheck: 'nope' })).toEqual([]);
  });

  it('getThingsToCheck extracts labels', () => {
    expect(
      getThingsToCheck({
        thingsToCheck: [{ label: 'Check fees' }, { label: 'Verify deposits' }, { label: '' }, { label: 123 }],
      }),
    ).toEqual(['Check fees', 'Verify deposits']);
  });

  it('getPlans returns [] when plans are not an array', () => {
    expect(getPlans(null)).toEqual([]);
    expect(getPlans({ plans: 'nope' })).toEqual([]);
  });

  it('getPlans returns only object entries', () => {
    expect(
      getPlans({
        plans: [{ planName: 'A' }, 'bad', { planName: 'B' }],
      }),
    ).toEqual([{ planName: 'A' }, { planName: 'B' }]);
  });

  it('getRedFlags returns [] for missing/invalid input', () => {
    expect(getRedFlags(null)).toEqual([]);
    expect(getRedFlags({ redFlags: 'nope' })).toEqual([]);
  });

  it('getRedFlags returns only object entries', () => {
    expect(
      getRedFlags([{ id: '1', severity: 'high', message: 'x' }, 'bad', { severity: 'low', message: 'y' }]),
    ).toHaveLength(2);
  });
});

