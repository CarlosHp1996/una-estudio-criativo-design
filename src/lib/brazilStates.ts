// Mapeamento UF <-> EnumState do backend (UnaProject.Domain.Enums.EnumState).
// A ORDEM desta lista define o valor inteiro do enum (AC=0, AL=1, ... TO=26) —
// NAO reordenar sem alinhar com o enum do backend.
//
// Observacao importante sobre serializacao: o backend usa JsonStringEnumConverter,
// entao nas RESPOSTAS o campo `state` volta como string ("SP"), nao como int.
// No ENVIO, o backend aceita tanto o int quanto o nome (allowIntegerValues=true),
// entao mandamos o int a partir do dropdown de UF. Por isso os helpers abaixo
// toleram receber tanto number quanto string.

export interface BrazilState {
  uf: string; // sigla ("SP")
  label: string; // nome completo ("São Paulo")
  value: number; // valor do EnumState no backend
}

export const BRAZIL_STATES: BrazilState[] = [
  { uf: "AC", label: "Acre", value: 0 },
  { uf: "AL", label: "Alagoas", value: 1 },
  { uf: "AP", label: "Amapá", value: 2 },
  { uf: "AM", label: "Amazonas", value: 3 },
  { uf: "BA", label: "Bahia", value: 4 },
  { uf: "CE", label: "Ceará", value: 5 },
  { uf: "DF", label: "Distrito Federal", value: 6 },
  { uf: "ES", label: "Espírito Santo", value: 7 },
  { uf: "GO", label: "Goiás", value: 8 },
  { uf: "MA", label: "Maranhão", value: 9 },
  { uf: "MT", label: "Mato Grosso", value: 10 },
  { uf: "MS", label: "Mato Grosso do Sul", value: 11 },
  { uf: "MG", label: "Minas Gerais", value: 12 },
  { uf: "PA", label: "Pará", value: 13 },
  { uf: "PB", label: "Paraíba", value: 14 },
  { uf: "PR", label: "Paraná", value: 15 },
  { uf: "PE", label: "Pernambuco", value: 16 },
  { uf: "PI", label: "Piauí", value: 17 },
  { uf: "RJ", label: "Rio de Janeiro", value: 18 },
  { uf: "RN", label: "Rio Grande do Norte", value: 19 },
  { uf: "RS", label: "Rio Grande do Sul", value: 20 },
  { uf: "RO", label: "Rondônia", value: 21 },
  { uf: "RR", label: "Roraima", value: 22 },
  { uf: "SC", label: "Santa Catarina", value: 23 },
  { uf: "SP", label: "São Paulo", value: 24 },
  { uf: "SE", label: "Sergipe", value: 25 },
  { uf: "TO", label: "Tocantins", value: 26 },
];

const UF_TO_VALUE = new Map<string, number>(
  BRAZIL_STATES.map((s) => [s.uf, s.value])
);
const VALUE_TO_UF = new Map<number, string>(
  BRAZIL_STATES.map((s) => [s.value, s.uf])
);

/** Sigla da UF ("sp"/"SP") -> valor inteiro do EnumState. undefined se invalida. */
export function ufToEnumState(uf: string | null | undefined): number | undefined {
  if (!uf) return undefined;
  return UF_TO_VALUE.get(uf.trim().toUpperCase());
}

/**
 * Valor do EnumState -> sigla da UF. Tolera receber:
 *  - number (ex.: 24) -> "SP"
 *  - string numerica ("24") -> "SP"
 *  - string ja no formato UF ("SP"/"sp") -> "SP" (o backend devolve assim)
 * Retorna undefined se nao reconhecer.
 */
export function enumStateToUf(
  state: number | string | null | undefined
): string | undefined {
  if (state === null || state === undefined) return undefined;

  if (typeof state === "number") {
    return VALUE_TO_UF.get(state);
  }

  const trimmed = state.trim();
  // Ja e uma sigla conhecida?
  const upper = trimmed.toUpperCase();
  if (UF_TO_VALUE.has(upper)) return upper;

  // String numerica ("24")?
  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber)) return VALUE_TO_UF.get(asNumber);

  return undefined;
}
