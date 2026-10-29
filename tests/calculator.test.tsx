import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STATIC_CATALOG } from "@/catalog";
import { Calculator } from "@/components/Calculator";
import { PENDING_WARNING } from "@/components/ResultsPanel";

function setup() {
  const user = userEvent.setup();
  render(<Calculator catalog={STATIC_CATALOG} storage={false} />);
  return user;
}

async function addFromLibrary(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name: /\+ Adicionar/ }));
  const dialog = screen.getByRole("dialog");
  await user.type(within(dialog).getByRole("searchbox"), name);
  await user.click(within(dialog).getByRole("button", { name: new RegExp(name) }));
  return screen.getByRole("article", { name });
}

/** Valor mensal exibido no cabeçalho do card. */
function cardValue(card: HTMLElement) {
  return within(card.querySelector<HTMLElement>(".item-card__value")!);
}

async function setNumber(user: ReturnType<typeof userEvent.setup>, input: HTMLElement, value: string) {
  await user.clear(input);
  await user.type(input, value);
}

describe("Calculadora", () => {
  it("mostra instruções em vez de gráficos vazios", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Como começar" })).toBeInTheDocument();
  });

  it("modo simples: adiciona aparelho com referência, mostra estimativa e permite editar", async () => {
    const user = setup();
    const card = await addFromLibrary(user, "Chuveiro elétrico");
    expect(within(card).getByText("Estimado")).toBeInTheDocument();
    expect(cardValue(card).getByText("27,5 kWh")).toBeInTheDocument();
    expect(within(card).getAllByText("referência").length).toBeGreaterThan(0);

    await setNumber(user, within(card).getByLabelText(/Tempo por uso/), "20");
    expect(cardValue(card).getByText("55 kWh")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modo simples" })).toHaveAttribute("aria-pressed", "true");

    // Totais refletem a alteração
    const results = screen.getByRole("region", { name: "Resultado de energia" });
    expect(within(results).getAllByText("55 kWh").length).toBeGreaterThan(0);
  });

  it("calcula custo apenas com tarifa informada", async () => {
    const user = setup();
    const card = await addFromLibrary(user, "Chuveiro elétrico");
    await setNumber(user, within(card).getByLabelText(/Tempo por uso/), "20");
    const results = screen.getByRole("region", { name: "Resultado de energia" });
    expect(within(results).getByText(/Informe a tarifa/)).toBeInTheDocument();
    expect(within(results).queryByText(/R\$\s?\d/)).toBeNull();

    await user.type(screen.getByLabelText(/^Tarifa/), "0.9");
    expect(within(results).getByText(/R\$\s?49,50/)).toBeInTheDocument();
  });

  it("item pendente não entra no total e exibe aviso", async () => {
    const user = setup();
    const shower = await addFromLibrary(user, "Chuveiro elétrico");
    await setNumber(user, within(shower).getByLabelText(/Tempo por uso/), "20");
    const custom = await addFromLibrary(user, "Equipamento personalizado");
    expect(within(custom).getByText("Pendente")).toBeInTheDocument();
    expect(within(custom).getAllByText(/Falta potência/).length).toBeGreaterThan(0);
    const results = screen.getByRole("region", { name: "Resultado de energia" });
    expect(within(results).getByText(PENDING_WARNING)).toBeInTheDocument();
    expect(within(results).getByText(/1 item calculado · 1 pendente/)).toBeInTheDocument();
    expect(within(results).getAllByText("55 kWh").length).toBeGreaterThan(0);
  });

  it("mesmos parâmetros geram o mesmo resultado nos dois modos e alternar preserva valores", async () => {
    const user = setup();
    const card = await addFromLibrary(user, "Chuveiro elétrico");
    await setNumber(user, within(card).getByLabelText(/Potência/), "7500");
    expect(cardValue(card).getByText("37,5 kWh")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Modo detalhado" }));
    expect(cardValue(card).getByText("37,5 kWh")).toBeInTheDocument();
    expect(within(card).getByLabelText(/Potência/)).toHaveValue(7500);
    expect(within(card).getByLabelText(/Fator de utilização/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Modo simples" }));
    expect(within(card).getByLabelText(/Potência/)).toHaveValue(7500);
    expect(cardValue(card).getByText("37,5 kWh")).toBeInTheDocument();
  });

  it("valida valores negativos", async () => {
    const user = setup();
    const card = await addFromLibrary(user, "Chuveiro elétrico");
    await setNumber(user, within(card).getByLabelText(/Potência/), "-100");
    expect(within(card).getByText("Pendente")).toBeInTheDocument();
    expect(within(card).getAllByText(/não pode ser negativo/).length).toBeGreaterThan(0);
  });

  it("água: calcula litros e m³", async () => {
    const user = setup();
    await user.click(screen.getByRole("tab", { name: /Água/ }));
    const card = await addFromLibrary(user, "Banho");
    await setNumber(user, within(card).getByLabelText(/Vazão/), "9");
    await setNumber(user, within(card).getByLabelText(/Tempo por uso/), "20");
    const results = screen.getByRole("region", { name: "Resultado de água" });
    expect(within(results).getByText("180 L")).toBeInTheDocument();
    expect(within(results).getAllByText("5.400 L").length).toBeGreaterThan(0);
    expect(within(results).getByText("5,4 m³")).toBeInTheDocument();
  });
});
