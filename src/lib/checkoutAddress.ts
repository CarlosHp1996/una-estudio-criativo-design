// Helpers puros da etapa de endereco do checkout.
//
// Contexto do backend (UnaProject.Infra.Repositories.UserRepository.UpdateUser):
//  - UpdateUser SINCRONIZA os enderecos: qualquer endereco existente no banco que
//    NAO venha no request e REMOVIDO. Por isso, para cadastrar um endereco novo sem
//    perder os antigos, precisamos reenviar TODOS os existentes (com seus Ids) mais
//    o novo.
//  - Um endereco novo so e CRIADO quando `Id == Guid.Empty`. Se o Id vier null/omitido,
//    o backend cai no ramo de "atualizar existente", nao encontra nada e nao cria nada.
//    Logo, o endereco novo precisa ir com o Guid vazio explicitamente.
//  - A resposta do UpdateUser devolve todos os enderecos com seus Ids, entao o Id do
//    endereco recem-criado e aquele que nao existia antes.

import type { AddressDto } from "@/types/api";
import { enumStateToUf } from "@/lib/brazilStates";

export const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

/** Formata um endereco salvo para exibicao no seletor (uma linha legivel). */
export function formatAddressLine(a: AddressDto): string {
  // `state` vem como string ("SP") nas respostas do backend, mas o tipo diz number;
  // enumStateToUf tolera ambos.
  const uf = enumStateToUf(a.state as unknown as number | string);
  const streetLine = [a.street, a.number].filter(Boolean).join(", ");
  const cityLine = [a.city, uf].filter(Boolean).join(" - ");
  const parts = [
    streetLine,
    a.neighborhood,
    a.complement,
    cityLine,
    a.zipCode ? `CEP ${a.zipCode}` : undefined,
  ].filter((p) => p && String(p).trim().length > 0);
  return parts.join(" · ");
}

/**
 * Monta o payload de `addresses` para o PUT /Auth/update ao adicionar um endereco novo:
 * reenvia os existentes (preservando seus Ids) e anexa o novo com Id = Guid.Empty.
 */
export function buildAddressesPayload(
  existing: AddressDto[],
  newAddress: AddressDto
): AddressDto[] {
  const existingKept = existing
    .filter((a) => a.id && a.id !== EMPTY_GUID)
    .map((a) => ({ ...a }));

  return [...existingKept, { ...newAddress, id: EMPTY_GUID }];
}

/**
 * Dado o conjunto de Ids que ja existiam antes do update e a lista de enderecos
 * retornada pela resposta, descobre o Id do endereco recem-criado (o que nao
 * estava no conjunto anterior). Retorna undefined se nao conseguir identificar.
 */
export function resolveNewAddressId(
  previousIds: Array<string | undefined>,
  returnedAddresses: Array<{ id?: string }>
): string | undefined {
  const prev = new Set(previousIds.filter(Boolean) as string[]);
  const found = returnedAddresses.find(
    (a) => a.id && a.id !== EMPTY_GUID && !prev.has(a.id)
  );
  return found?.id;
}
