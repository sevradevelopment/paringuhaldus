import { Decimal } from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type LineInput = {
  name: string;
  quantity: string | number;
  unitPrice: string | number;
  vatRate: string | number;
};

export type ComputedLine = {
  name: string;
  quantity: Decimal;
  unitPrice: Decimal;
  vatRate: Decimal;
  lineSubtotal: Decimal;
  lineVat: Decimal;
  lineTotal: Decimal;
};

export type QuoteTotals = {
  lines: ComputedLine[];
  subtotal: Decimal;
  vatTotal: Decimal;
  total: Decimal;
};

export function d(value: string | number | Decimal): Decimal {
  return value instanceof Decimal ? value : new Decimal(value || 0);
}

export function computeLine(input: LineInput): ComputedLine {
  const quantity = d(input.quantity);
  const unitPrice = d(input.unitPrice);
  const vatRate = d(input.vatRate);
  const lineSubtotal = quantity.mul(unitPrice).toDecimalPlaces(2);
  const lineVat = lineSubtotal.mul(vatRate).div(100).toDecimalPlaces(2);
  const lineTotal = lineSubtotal.add(lineVat).toDecimalPlaces(2);

  return {
    name: input.name.trim(),
    quantity,
    unitPrice,
    vatRate,
    lineSubtotal,
    lineVat,
    lineTotal,
  };
}

export function computeQuoteTotals(items: LineInput[]): QuoteTotals {
  const lines = items.map(computeLine);
  const subtotal = lines
    .reduce((sum, line) => sum.add(line.lineSubtotal), new Decimal(0))
    .toDecimalPlaces(2);
  const vatTotal = lines
    .reduce((sum, line) => sum.add(line.lineVat), new Decimal(0))
    .toDecimalPlaces(2);
  const total = subtotal.add(vatTotal).toDecimalPlaces(2);
  return { lines, subtotal, vatTotal, total };
}

export function formatMoney(value: string | number | Decimal): string {
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(d(value).toFixed(2)));
}

export function decimalToString(value: Decimal): string {
  return value.toFixed(2);
}
