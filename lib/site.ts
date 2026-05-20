const RAW = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kowshikkuri.com/tailshift";

function normalize(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!trimmed) return "https://kowshikkuri.com/tailshift";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const SITE_URL = normalize(RAW);
