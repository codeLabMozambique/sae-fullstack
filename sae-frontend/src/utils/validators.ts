/**
 * Validadores partilhados — formatos de contacto (Moçambique) e email.
 *
 * Operadoras móveis e prefixos aceites:
 *   • Vodacom:  84, 85
 *   • Tmcel:    82, 83
 *   • Movitel:  86, 87
 *
 * Número nacional: 9 dígitos começando por 8[2-7].
 * Aceita também o prefixo internacional +258 (ou 00258).
 */

const PHONE_RE = /^(?:\+?258|00258)?(8[2-7])\d{7}$/;
const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;

export interface ValidationResult {
  ok: boolean;
  message?: string;
  normalized?: string;
}

/** Remove espaços, hífens e parênteses do número. */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.replace(/[\s\-()]/g, '');
  const m = cleaned.match(PHONE_RE);
  if (!m) return cleaned;
  // devolve sempre no formato +258XXXXXXXXX
  const localPrefix = m[1];                // 8X
  const tail = cleaned.slice(cleaned.indexOf(localPrefix) + 2);
  return `+258${localPrefix}${tail}`;
}

/** Devolve true se o telefone é um número moçambicano móvel válido. */
export function isValidMozPhone(raw: string): boolean {
  if (!raw) return false;
  const cleaned = raw.replace(/[\s\-()]/g, '');
  return PHONE_RE.test(cleaned);
}

/** Validação completa do telefone, devolve mensagem amigável quando inválido. */
export function validatePhone(raw: string, opts: { required?: boolean } = {}): ValidationResult {
  const value = (raw || '').trim();
  if (!value) {
    return opts.required
      ? { ok: false, message: 'Telefone obrigatório' }
      : { ok: true };
  }
  const cleaned = value.replace(/[\s\-()]/g, '');
  if (!/^[+\d]+$/.test(cleaned)) {
    return { ok: false, message: 'Só dígitos, espaços, "-", "(" ou "+" são permitidos' };
  }
  if (!PHONE_RE.test(cleaned)) {
    return {
      ok: false,
      message: 'Número inválido. Usa um móvel moçambicano (ex. 841234567 ou +258841234567).',
    };
  }
  return { ok: true, normalized: normalizePhone(cleaned) };
}

/** Devolve true se o email tem estrutura sintacticamente válida. */
export function isValidEmail(raw: string): boolean {
  if (!raw) return false;
  const v = raw.trim();
  if (v.length > 254) return false;
  return EMAIL_RE.test(v);
}

/** Validação completa do email, com mensagem amigável. */
export function validateEmail(raw: string, opts: { required?: boolean } = {}): ValidationResult {
  const value = (raw || '').trim();
  if (!value) {
    return opts.required
      ? { ok: false, message: 'Email obrigatório' }
      : { ok: true };
  }
  if (value.length > 254) {
    return { ok: false, message: 'Email demasiado longo (máx. 254 caracteres)' };
  }
  if (/\s/.test(value)) {
    return { ok: false, message: 'Email não pode conter espaços' };
  }
  if (!EMAIL_RE.test(value)) {
    return { ok: false, message: 'Formato inválido. Exemplo: nome@dominio.com' };
  }
  return { ok: true, normalized: value.toLowerCase() };
}

/** Operadora a partir do prefixo — útil para mostrar UI auxiliar. */
export function carrierForPhone(raw: string): 'Vodacom' | 'Tmcel' | 'Movitel' | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\s\-()]/g, '');
  const m = cleaned.match(PHONE_RE);
  if (!m) return null;
  const prefix = m[1];
  if (prefix === '84' || prefix === '85') return 'Vodacom';
  if (prefix === '82' || prefix === '83') return 'Tmcel';
  if (prefix === '86' || prefix === '87') return 'Movitel';
  return null;
}
