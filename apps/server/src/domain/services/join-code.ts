/**
 * 参加コード（join_code）生成。
 *
 * - Crockford Base32（紛らわしい文字 I/L/O/U を除外した 32 文字）で 8 文字。
 * - グローバル `crypto` のみ使用（外部パッケージ非依存：dependency-cruiser domain-no-external-packages）。
 * - 32 = 256/8 のため `byte % 32` はモジュロバイアスなく一様（8 文字 = 40bit のエントロピー）。
 * - 一意性（衝突回避）は use-case 側で DB 確認しつつ担保する。
 */

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 8;

export function generateJoinCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  let code = "";
  for (const byte of bytes) {
    code += ALPHABET.charAt(byte % 32);
  }
  return code;
}
