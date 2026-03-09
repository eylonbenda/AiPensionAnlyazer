import OpenAI from 'openai';

const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_TEXT_LENGTH = 120_000;

function getConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const temperature = Number(process.env.AI_TEMPERATURE);
  const maxTokens = Number(process.env.AI_MAX_TOKENS);
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 60_000;
  return {
    apiKey,
    model: model || DEFAULT_MODEL,
    temperature: Number.isFinite(temperature) ? temperature : 0,
    maxTokens: Number.isFinite(maxTokens) && maxTokens > 0 ? maxTokens : 2048,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 60_000,
  };
}

/**
 * Strips optional markdown code fence (e.g. ```json ... ```) and parses JSON.
 * @throws Error if content is not valid JSON after stripping fences.
 */
export function parseJsonFromContent(content: string): unknown {
  let trimmed = content.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/;
  const match = trimmed.match(fence);
  if (match) {
    trimmed = match[1].trim();
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new Error('Failed to parse model output as JSON.');
  }
}

/**
 * Call OpenAI Chat Completions with system + user message, optionally followed by a repair user message.
 * Does not log message or response content (PII/safety).
 */
export async function callOpenAI(
  system: string,
  userMessage: string,
  repairMessage?: string,
): Promise<string> {
  const { apiKey, model, temperature, maxTokens, timeoutMs } = getConfig();
  if (!apiKey || apiKey.length === 0) {
    throw new Error('OPENAI_API_KEY is not set.');
  }

  const client = new OpenAI({ apiKey });
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: system },
    { role: 'user', content: userMessage },
  ];
  if (repairMessage) {
    messages.push({ role: 'user', content: repairMessage });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const completion = await client.chat.completions.create(
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      },
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);
    const content = completion.choices[0]?.message?.content;
    if (content == null || content === '') {
      throw new Error('OpenAI returned empty content.');
    }
    return content;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        throw new Error(`OpenAI request timed out after ${timeoutMs}ms.`);
      }
      if (err.message?.includes('OPENAI_API_KEY')) throw err;
      throw new Error(`OpenAI API error: ${err.message}`);
    }
    throw new Error('OpenAI API error: unknown error.');
  }
}

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.length > 0);
}

export function getOpenAIModel(): string {
  return process.env.AI_MODEL || DEFAULT_MODEL;
}

/**
 * Truncate text to a safe max length to avoid token limits.
 */
export function truncateTextForPrompt(text: string, maxLength: number = MAX_TEXT_LENGTH): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '\n\n[... text truncated ...]';
}
