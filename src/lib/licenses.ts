import crypto from "crypto";

const GROUPS = 3;
const GROUP_LENGTH = 4;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 to avoid confusion

function randomGroup(): string {
  let out = "";
  const bytes = crypto.randomBytes(GROUP_LENGTH);
  for (let i = 0; i < GROUP_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function generateLicenseCode(): string {
  const groups = Array.from({ length: GROUPS }, () => randomGroup());
  return `LEXO-${groups.join("-")}`;
}
