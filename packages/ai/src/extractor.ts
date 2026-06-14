import {
  callOpenAI,
  getOpenAIModel,
  isOpenAIConfigured,
  parseJsonFromContent,
  truncateTextForPrompt,
} from './providers/openai';
import { pensionExtractionPromptV1 } from './prompts/v1';
import { PensionExtraction, PensionExtractionSchema } from './schema';

export interface ExtractionInput {
  text: string;
  meta?: Record<string, unknown>;
}

export interface ExtractionResult {
  json: PensionExtraction;
  rawModelOutput?: unknown;
  meta: {
    provider: string;
    model: string;
  };
}

type ExtractStructuredOk = {
  ok: true;
  result: ExtractionResult;
};

type ExtractStructuredError = {
  ok: false;
  error: string;
  rawModelOutput?: unknown;
};

export type ExtractStructuredResult = ExtractStructuredOk | ExtractStructuredError;

const STUB_PAYLOAD: PensionExtraction = {
  pensionProviderName: 'Example Pension Provider',
  planType: 'Defined Contribution',
  country: 'Unknown',
  currency: 'USD',
  statementDate: '',
  reportDate: '',
  vestingDate: '',
  currentBalance: null,
  employeeContributionRate: null,
  employerContributionRate: null,
  managementFeePercent: null,
  funds: [],
  thingsToCheck: [],
};

function sumDefined(values: Array<number | null | undefined>): number | null {
  const nums = values.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : null;
}

/**
 * Derive document-level totals from the authoritative per-plan data.
 * The model reliably extracts each plan's currentBalance/projected values, but is
 * error-prone (and generation-unstable) when asked to pick the right document-level
 * "סה"כ" cell — it commonly maps a projection total into totalCurrentSavings.
 * When plans are present, prefer the per-plan sums as the source of truth.
 */
function deriveDocumentTotals(data: PensionExtraction): PensionExtraction {
  const plans = Array.isArray(data.plans) ? data.plans : [];
  if (plans.length === 0) return data;

  const currentFromPlans = sumDefined(plans.map((p) => p.currentBalance));
  const projectedFromPlans = sumDefined(
    plans.map((p) => p.projectedBalanceWithDeposits),
  );

  return {
    ...data,
    totalCurrentSavings: currentFromPlans ?? data.totalCurrentSavings,
    totalProjectedSavings: projectedFromPlans ?? data.totalProjectedSavings,
  };
}

function useStub(): boolean {
  const provider = process.env.AI_PROVIDER;
  return provider === 'stub' || !isOpenAIConfigured();
}

async function runModelOnce(
  input: ExtractionInput,
  repairMessage?: string,
): Promise<unknown> {
  if (useStub()) {
    return { ...STUB_PAYLOAD };
  }

  const userMessage = pensionExtractionPromptV1.userTemplate.replace(
    '{TEXT}',
    truncateTextForPrompt(input.text),
  );
  const content = await callOpenAI(
    pensionExtractionPromptV1.system,
    userMessage,
    repairMessage,
  );
  return parseJsonFromContent(content);
}

export async function extractStructured(
  input: ExtractionInput,
): Promise<ExtractStructuredResult> {
  const provider = useStub() ? 'stub' : 'openai';
  const model = useStub() ? 'stub-pension-extractor-v1' : getOpenAIModel();

  let candidate1: unknown;
  try {
    candidate1 = await runModelOnce(input);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: `OpenAI API error: ${message}` };
  }

  const parsed1 = PensionExtractionSchema.safeParse(candidate1);
  if (parsed1.success) {
    return {
      ok: true,
      result: {
        json: deriveDocumentTotals(parsed1.data),
        rawModelOutput: candidate1,
        meta: { provider, model },
      },
    };
  }

  const repairMessage =
    pensionExtractionPromptV1.repairPromptTemplate.replace(
      '{ERRORS}',
      parsed1.error.message,
    );
  let candidate2: unknown;
  try {
    candidate2 = await runModelOnce(input, repairMessage);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      ok: false,
      error: `OpenAI API error on repair: ${message}`,
      rawModelOutput: candidate1,
    };
  }

  const parsed2 = PensionExtractionSchema.safeParse(candidate2);
  if (parsed2.success) {
    return {
      ok: true,
      result: {
        json: deriveDocumentTotals(parsed2.data),
        rawModelOutput: candidate2,
        meta: { provider, model },
      },
    };
  }

  const validationErrors = parsed2.error.message;
  return {
    ok: false,
    error: `Structured extraction failed schema validation. ${validationErrors}`,
    rawModelOutput: candidate2,
  };
}

