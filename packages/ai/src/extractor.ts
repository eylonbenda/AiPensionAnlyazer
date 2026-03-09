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
        json: parsed1.data,
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
        json: parsed2.data,
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

