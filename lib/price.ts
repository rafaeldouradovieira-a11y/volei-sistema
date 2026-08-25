// Valor por pessoa: divide o total e arredonda PRA CIMA (em reais inteiros),
// garantindo que a soma das cotas nunca fique abaixo do total.
export function pricePerPerson(total: number | null, count: number): number | null {
  if (!total || count <= 0) return null;
  return Math.ceil(total / count);
}
