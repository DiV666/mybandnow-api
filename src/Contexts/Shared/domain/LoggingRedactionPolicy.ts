export const REDACTED = '[REDACTED]';

const MASK_CHARACTER = '*';
const MAX_SANITIZATION_DEPTH = 5;

export type LoggingRedactionStrategy = 'none' | 'full' | 'email' | 'phone' | 'document' | 'text';

const SENSITIVE_VALUE_PATTERNS: readonly RegExp[] = [
  /(authorization\s*:\s*bearer\s+)([^\s,;]+)/gi,
  /(bearer\s+)([^\s,;]+)/gi,
  /((?:access|refresh)?token\s*[:=]\s*)([^\s,;]+)/gi,
  /((?:password|passwd|pwd|secret|cookie)\s*[:=]\s*)([^\s,;]+)/gi
] as const;

const EMAIL_BOUNDARY_PREFIX_PATTERN = '(^|[^a-z0-9._%+-])';
const EMAIL_LOCAL_PART_PATTERN = '[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?';
const EMAIL_DOMAIN_LABEL_PATTERN = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?';
const EMAIL_DOMAIN_SEPARATOR_PATTERN = String.raw`\.`;
const EMAIL_DOMAIN_PATTERN = `${EMAIL_DOMAIN_LABEL_PATTERN}(?:${EMAIL_DOMAIN_SEPARATOR_PATTERN}${EMAIL_DOMAIN_LABEL_PATTERN})*`;
const EMAIL_BOUNDARY_SUFFIX_PATTERN = '(?=$|[^a-z0-9.-])';
const BARE_EMAIL_PATTERN = new RegExp(
  `${EMAIL_BOUNDARY_PREFIX_PATTERN}(${EMAIL_LOCAL_PART_PATTERN}@${EMAIL_DOMAIN_PATTERN})${EMAIL_BOUNDARY_SUFFIX_PATTERN}`,
  'gi'
);
const BARE_PHONE_PATTERN = /(^|[^0-9a-z])(\+?\d(?:[\s().-]*\d){8,14})(?=$|[^0-9a-z])/gi;
const BARE_DOCUMENT_PATTERNS: readonly RegExp[] = [
  /(^|[^a-z0-9])(\d{8}[a-z])(?=$|[^a-z0-9])/gi,
  /(^|[^a-z0-9])([xyz]\d{7}[a-z])(?=$|[^a-z0-9])/gi,
  /(^|[^a-z0-9])([abcdefghjnpqrsuvw]\d{7}[\da-j])(?=$|[^a-z0-9])/gi
] as const;

const FULL_REDACTION_FIELDS_DEFAULT: readonly string[] = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'secrets',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'authorization',
  'apikey',
  'api_key',
  'privatekey',
  'private_key',
  'ssn',
  'nationalid',
  'national_id',
  'creditcard',
  'credit_card',
  'cardnumber',
  'card_number',
  'cvv',
  'pin',
  'cookie',
  'set-cookie'
] as const;

const EMAIL_FIELDS_DEFAULT: readonly string[] = ['email', 'mail'] as const;

const PHONE_FIELDS_DEFAULT: readonly string[] = [
  'phone',
  'phone_number',
  'mobile',
  'mobile_phone',
  'telephone',
  'tel'
] as const;

const DOCUMENT_FIELDS_DEFAULT: readonly string[] = [
  'dni',
  'nie',
  'cif',
  'nif',
  'document',
  'document_id',
  'document_number',
  'document_identifier',
  'identity_document',
  'identity_document_id',
  'identity_document_number',
  'national_id',
  'national_identifier'
] as const;

const TEXT_FIELDS_DEFAULT: readonly string[] = ['text', 'message', 'body', 'description', 'notes', 'comment'] as const;

const EMAIL_FIELDS = new Set(EMAIL_FIELDS_DEFAULT.map(normalizeFieldName));
const PHONE_FIELDS = new Set(PHONE_FIELDS_DEFAULT.map(normalizeFieldName));
const DOCUMENT_FIELDS = new Set(DOCUMENT_FIELDS_DEFAULT.map(normalizeFieldName));
const TEXT_FIELDS = new Set(TEXT_FIELDS_DEFAULT.map(normalizeFieldName));

const RAW_STRING_FIELD_GROUPS = [
  { aliases: EMAIL_FIELDS_DEFAULT, strategy: 'email' },
  { aliases: PHONE_FIELDS_DEFAULT, strategy: 'phone' },
  { aliases: DOCUMENT_FIELDS_DEFAULT, strategy: 'document' },
  { aliases: TEXT_FIELDS_DEFAULT, strategy: 'text' }
] as const satisfies ReadonlyArray<{
  aliases: readonly string[];
  strategy: Exclude<LoggingRedactionStrategy, 'none' | 'full'>;
}>;

export function createSensitiveFieldsPolicy(extraFields: readonly string[] = []): ReadonlySet<string> {
  return new Set([...FULL_REDACTION_FIELDS_DEFAULT, ...extraFields].map(normalizeFieldName));
}

export function isSensitiveField(policy: ReadonlySet<string>, fieldName: string): boolean {
  return policy.has(normalizeFieldName(fieldName));
}

export function resolveRedactionStrategy(
  fieldName: string,
  fullRedactionPolicy: ReadonlySet<string> = createSensitiveFieldsPolicy()
): LoggingRedactionStrategy {
  const normalizedFieldName = normalizeFieldName(fieldName);

  if (fullRedactionPolicy.has(normalizedFieldName)) {
    return 'full';
  }

  if (EMAIL_FIELDS.has(normalizedFieldName)) {
    return 'email';
  }

  if (PHONE_FIELDS.has(normalizedFieldName)) {
    return 'phone';
  }

  if (DOCUMENT_FIELDS.has(normalizedFieldName)) {
    return 'document';
  }

  if (TEXT_FIELDS.has(normalizedFieldName)) {
    return 'text';
  }

  return 'none';
}

export function sanitizeFieldValue(strategy: LoggingRedactionStrategy, value: unknown): unknown {
  if (strategy === 'none') {
    return value;
  }

  if (strategy === 'full' || typeof value !== 'string') {
    return REDACTED;
  }

  switch (strategy) {
    case 'email':
      return maskEmail(value);
    case 'phone':
      return maskPhone(value);
    case 'document':
      return maskDocument(value);
    case 'text':
      return summarizeText(value);
    default:
      return REDACTED;
  }
}

export function sanitizeValueForLogging(
  value: unknown,
  fullRedactionPolicy: ReadonlySet<string> = createSensitiveFieldsPolicy(),
  depth = 0,
  seen = new WeakSet<object>(),
  sanitizeError?: (error: Error) => unknown
): unknown {
  if (depth > MAX_SANITIZATION_DEPTH) {
    return '[Truncated]';
  }

  const directlySanitizedValue = sanitizeDirectValue(value, sanitizeError);

  if (directlySanitizedValue.handled) {
    return directlySanitizedValue.value;
  }

  if (Array.isArray(value)) {
    return sanitizeArrayForLogging(value, fullRedactionPolicy, depth, seen, sanitizeError);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  return sanitizeObjectForLogging(value, fullRedactionPolicy, depth, seen, sanitizeError);
}

export function maskPhone(phone: string): string {
  const leadingPrefix = phone.trim().startsWith('+') ? '+' : '';
  const digitsOnlyPhone = phone.replaceAll(/\D/g, '');

  if (digitsOnlyPhone.length <= 4) {
    return `${leadingPrefix}${MASK_CHARACTER.repeat(4)}`;
  }

  return `${leadingPrefix}${MASK_CHARACTER.repeat(digitsOnlyPhone.length - 4)}${digitsOnlyPhone.slice(-4)}`;
}

export function maskEmail(email: string): string {
  const [localPart, domainPart] = email.trim().split('@');

  if (!localPart || !domainPart) {
    return `${MASK_CHARACTER.repeat(4)}@${MASK_CHARACTER.repeat(4)}`;
  }

  const domainSegments = domainPart.split('.').filter((segment) => segment.length > 0);
  const domainName = domainSegments[0] ?? '';
  const topLevelDomain = domainSegments.length > 1 ? domainSegments.at(-1) : undefined;

  const maskedLocalPart = `${localPart[0] ?? MASK_CHARACTER}${MASK_CHARACTER.repeat(3)}`;
  const maskedDomainName = `${domainName[0] ?? MASK_CHARACTER}${MASK_CHARACTER.repeat(3)}`;
  const domainSuffix = topLevelDomain ? `.${topLevelDomain}` : '';

  return `${maskedLocalPart}@${maskedDomainName}${domainSuffix}`;
}

export function maskDocument(document: string): string {
  const normalizedDocument = document.trim();

  if (normalizedDocument.length <= 3) {
    return MASK_CHARACTER.repeat(Math.max(normalizedDocument.length, 4));
  }

  const visiblePrefix = normalizedDocument[0] ?? '';
  const visibleSuffix = normalizedDocument.slice(-2);
  const maskedLength = Math.max(normalizedDocument.length - 3, 4);

  return `${visiblePrefix}${MASK_CHARACTER.repeat(maskedLength)}${visibleSuffix}`;
}

export function summarizeText(text: string): string {
  return `[TRUNCATED_TEXT len=${text.length}]`;
}

export function sanitizeStringForLogging(value: string): string {
  const secretsSanitized = SENSITIVE_VALUE_PATTERNS.reduce<string>((sanitizedValue, pattern) => {
    return sanitizedValue.replace(pattern, (...replacementArgs: string[]) => {
      const prefix = replacementArgs[1] ?? '';

      return `${prefix}${REDACTED}`;
    });
  }, value);

  return sanitizeBarePiiValues(sanitizeCommonPiiPatterns(secretsSanitized));
}

function sanitizeCommonPiiPatterns(value: string): string {
  return RAW_STRING_FIELD_GROUPS.reduce<string>((sanitizedValue, { aliases, strategy }) => {
    return aliases.reduce<string>(
      (currentValue, alias) => sanitizeRawStringField(currentValue, alias, strategy),
      sanitizedValue
    );
  }, value);
}

function sanitizeBarePiiValues(value: string): string {
  const emailsSanitized = value.replaceAll(BARE_EMAIL_PATTERN, (_match, prefix: string, email: string) => {
    return `${prefix}${maskEmail(email)}`;
  });

  const phonesSanitized = emailsSanitized.replaceAll(BARE_PHONE_PATTERN, (match, prefix: string, phone: string) => {
    if (!looksLikePhone(phone)) {
      return match;
    }

    return `${prefix}${maskPhone(phone)}`;
  });

  return BARE_DOCUMENT_PATTERNS.reduce<string>((sanitizedValue, pattern) => {
    return sanitizedValue.replaceAll(pattern, (_match, prefix: string, document: string) => {
      return `${prefix}${maskDocument(document.toUpperCase())}`;
    });
  }, phonesSanitized);
}

function sanitizeRawStringField(
  value: string,
  alias: string,
  strategy: Exclude<LoggingRedactionStrategy, 'none' | 'full'>
): string {
  const escapedAlias = escapeRegExp(alias);
  const quotedValuePattern = `"[^"]*"|'[^']*'`;
  const scalarValuePattern = String.raw`[^\s,;)}\]]+`;
  const rawValuePattern = `(${quotedValuePattern}|${scalarValuePattern})`;

  const rawKeyValuePattern = new RegExp(String.raw`(^|[\s,;([{])(${escapedAlias})\s*([:=])\s*${rawValuePattern}`, 'gi');
  const jsonLikePattern = new RegExp(
    String.raw`(^|[\s,;([{])(["'])(${escapedAlias})\2\s*(:)\s*${rawValuePattern}`,
    'gi'
  );

  const sanitizeMatch = (rawMatch: string, rawFieldValue: string): string => {
    const { quote, value: unwrappedValue } = unwrapQuotedValue(rawFieldValue);
    const sanitizedValue = sanitizeFieldValue(strategy, unwrappedValue);
    const sanitizedFieldValue = typeof sanitizedValue === 'string' ? sanitizedValue : REDACTED;

    return rawMatch.replace(rawFieldValue, wrapQuotedValue(sanitizedFieldValue, quote));
  };

  const rawKeySanitized = value.replace(
    rawKeyValuePattern,
    (match, _prefix: string, _key: string, _separator: string, rawFieldValue: string) => {
      return sanitizeMatch(match, rawFieldValue);
    }
  );

  return rawKeySanitized.replace(
    jsonLikePattern,
    (match, _prefix: string, _quote: string, _key: string, _separator: string, rawFieldValue: string) => {
      return sanitizeMatch(match, rawFieldValue);
    }
  );
}

function unwrapQuotedValue(value: string): { quote: '' | '"' | "'"; value: string } {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    const quote = value[0] as '"' | "'";

    return {
      quote,
      value: value.slice(1, -1)
    };
  }

  return {
    quote: '',
    value
  };
}

function wrapQuotedValue(value: string, quote: '' | '"' | "'"): string {
  return quote ? `${quote}${value}${quote}` : value;
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function looksLikePhone(value: string): boolean {
  const digitsOnlyValue = value.replaceAll(/\D/g, '');

  if (digitsOnlyValue.length < 9 || digitsOnlyValue.length > 15) {
    return false;
  }

  return value.startsWith('+') || /[\s().-]/.test(value) || /^\d+$/.test(value);
}

function normalizeFieldName(fieldName: string): string {
  return fieldName
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/g, '');
}

function sanitizeDirectValue(
  value: unknown,
  sanitizeError?: (error: Error) => unknown
): { handled: true; value: unknown } | { handled: false } {
  if (value instanceof Error) {
    return {
      handled: true,
      value: sanitizeError ? sanitizeError(value) : { name: value.name || value.constructor.name || 'Error' }
    };
  }

  switch (typeof value) {
    case 'bigint':
      return { handled: true, value: value.toString() };
    case 'string':
      return { handled: true, value: sanitizeStringForLogging(value) };
    case 'function':
      return { handled: true, value: `[Function:${value.name || 'anonymous'}]` };
    case 'symbol':
      return { handled: true, value: String(value) };
    case 'undefined':
      return { handled: true, value: '[Undefined]' };
    default:
      return { handled: false };
  }
}

function sanitizeArrayForLogging(
  value: readonly unknown[],
  fullRedactionPolicy: ReadonlySet<string>,
  depth: number,
  seen: WeakSet<object>,
  sanitizeError?: (error: Error) => unknown
): unknown {
  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);
  const sanitizedArray = value.map((item) =>
    sanitizeValueForLogging(item, fullRedactionPolicy, depth + 1, seen, sanitizeError)
  );
  seen.delete(value);

  return sanitizedArray;
}

function sanitizeObjectForLogging(
  value: object,
  fullRedactionPolicy: ReadonlySet<string>,
  depth: number,
  seen: WeakSet<object>,
  sanitizeError?: (error: Error) => unknown
): Record<string, unknown> {
  seen.add(value);

  const sanitizedRecord: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    sanitizedRecord[key] = sanitizeNestedValue(key, nestedValue, fullRedactionPolicy, depth, seen, sanitizeError);
  }

  seen.delete(value);

  return sanitizedRecord;
}

function sanitizeNestedValue(
  key: string,
  nestedValue: unknown,
  fullRedactionPolicy: ReadonlySet<string>,
  depth: number,
  seen: WeakSet<object>,
  sanitizeError?: (error: Error) => unknown
): unknown {
  const strategy = resolveRedactionStrategy(key, fullRedactionPolicy);

  if (strategy !== 'none') {
    return sanitizeFieldValue(strategy, nestedValue);
  }

  return sanitizeValueForLogging(nestedValue, fullRedactionPolicy, depth + 1, seen, sanitizeError);
}
