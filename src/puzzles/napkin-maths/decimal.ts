/** Canonical form of a decimal string, so equal numbers compare equal as text: no float is involved. */
export function normaliseDecimal(value: string) {
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  const integer = whole.replace(/^0+(?=\d)/, "");
  const decimals = fraction.replace(/0+$/, "");
  const text = decimals ? `${integer}.${decimals}` : integer;
  return negative && text !== "0" ? `-${text}` : text;
}
