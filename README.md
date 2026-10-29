# Consumo em Casa

Calculadora web de consumo doméstico de **energia elétrica** e **água**. Sem login, sem cadastro e sem envio de dados domésticos: todos os cálculos acontecem no navegador.

## Stack

- Next.js 15 (App Router), React 19 e TypeScript
- PostgreSQL 16 + Prisma — guarda **apenas os catálogos de referência** (aparelhos e atividades)
- Docker / Docker Compose
- Vitest + Testing Library

## Como executar

### Com Docker (app + banco)

```bash
docker compose up --build
```

Acesse <http://localhost:3000>. Na inicialização, o contêiner aplica a migração e popula o catálogo.

### Localmente

```bash
npm install
cp .env.example .env
docker compose up -d db      # apenas o PostgreSQL
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Sem banco disponível, a aplicação continua funcionando com o catálogo estático em `src/catalog`.

### Testes e verificação

```bash
npm test           # fórmulas, tarifas, validação e fluxos da interface
npm run typecheck
npm run build
```

## Organização

| Pasta | Conteúdo |
| --- | --- |
| `src/domain` | Funções de cálculo puras e testáveis (energia, água, frequência, tarifas, totais, validação, formatação) |
| `src/catalog` | Catálogos de aparelhos e atividades (fonte do seed do banco) |
| `src/server` | Leitura do catálogo no PostgreSQL, com fallback estático |
| `src/state` | Estado da simulação e persistência opcional em `localStorage` |
| `src/components` | Interface: biblioteca, cards de itens, tarifas e resultados |
| `prisma` | Schema, migração e seed |
| `tests` | Testes automatizados |

## Fórmulas

Todas as frequências são convertidas para o período simulado (padrão: 30 dias):
por dia × dias; por semana × dias ÷ 7; por mês × dias ÷ 30.

**Energia (kWh)**

- Potência e tempo: `W ÷ 1000 × horas por uso × utilizações no período × quantidade × fator de utilização`
- Standby (opcional): `W standby ÷ 1000 × (24 − horas de uso por dia) × dias × quantidade`. Só as horas sem uso entram, para não contar o mesmo período duas vezes.
- Por ciclo: `kWh por ciclo × ciclos no período × quantidade`
- Diário: `kWh por dia × dias de uso no período × quantidade`
- Etiqueta mensal: `kWh/mês × dias ÷ 30 × quantidade`

**Água (L)**

- Vazão: `L/min × minutos por uso × utilizações no período × quantidade`
- Volume: `L por uso × utilizações no período × quantidade`
- Máquina: `L por ciclo × ciclos no período × quantidade`
- `m³ = L ÷ 1000`

Itens marcados como "por pessoa" (banho, descarga...) também são multiplicados pelo número de pessoas. Itens da residência inteira, não.

**Custos (opcionais)**

- Energia: `kWh × (tarifa + adicional por kWh) + valor fixo`
- Água: `m³ × (tarifa + adicional por m³) + esgoto + valor fixo`. O esgoto é calculado por R$/m³ ou como percentual sobre a água, somente se o usuário escolher a regra.

Sem tarifa, nenhum custo é exibido. A aplicação mostra só o consumo físico.

## Estados dos itens

- **Estimado**: usa ao menos um valor de referência.
- **Personalizado**: todos os dados indispensáveis foram informados pelo usuário.
- **Pendente**: falta um dado indispensável ou há um valor inválido. O item fica fora dos totais (não conta como zero) e um aviso indica que o resultado é parcial.

## Limitações

- Os valores de referência são aproximações genéricas, não medições. Potências e vazões reais variam muito.
- A estimativa por potência de geladeiras e freezers tem baixa precisão. Prefira o consumo da etiqueta.
- Os custos usam tarifa linear. A fatura real pode divergir por impostos, bandeiras, faixas de consumo, tarifa mínima e outras cobranças.
- Fora do MVP: simulador de economia, exportação PDF/CSV, histórico e comparação de cenários.
