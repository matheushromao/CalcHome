import { Calculator } from "@/components/Calculator";
import { getCatalog } from "@/server/catalog";

// O catálogo é lido do PostgreSQL a cada requisição; os cálculos acontecem no navegador.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { entries } = await getCatalog();
  return (
    <main>
      <Calculator catalog={entries} />
    </main>
  );
}
