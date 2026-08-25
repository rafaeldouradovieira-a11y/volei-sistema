// Valor por pessoa: divide o total e arredonda PRA CIMA em centavos,
// garantindo que a soma das cotas nunca fique abaixo do total.
// Retorna formatado no padrão brasileiro (ex.: "33,34").
export function pricePerPerson(total: number | null, count: number): string | null {
  if (!total || count <= 0) return null;
  const totalCents = Math.round(total * 100);
  const perPersonCents = Math.ceil(totalCents / count);
  return (perPersonCents / 100).toFixed(2).replace(".", ",");
}
