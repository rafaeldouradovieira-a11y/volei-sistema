export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Strip Brazil country code prefix if present (55 + 10 or 11 digits = 12 or 13 total)
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits.slice(2);
  }
  return digits;
}

export function formatPhone(phone: string): string {
  const d = normalizePhone(phone);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}
