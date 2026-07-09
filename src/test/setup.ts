// Setup global para os testes (Vitest + Testing Library).
// Importa os matchers do jest-dom (toBeInTheDocument, etc.) e limpa o DOM
// entre os testes.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
