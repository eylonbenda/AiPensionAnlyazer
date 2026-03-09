import { PensionExtraction } from '../schema';
import { RedFlag } from './types';
import {
  evaluateContributionFlags,
  evaluateCoverageFlags,
  evaluateDataQualityFlags,
  evaluateFeeFlags,
} from './rules';

export function computeRedFlags(extraction: PensionExtraction): RedFlag[] {
  const flags: RedFlag[] = [];

  flags.push(...evaluateFeeFlags(extraction));
  flags.push(...evaluateContributionFlags(extraction));
  flags.push(...evaluateCoverageFlags(extraction));
  flags.push(...evaluateDataQualityFlags(extraction));

  return flags;
}

