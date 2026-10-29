import { PrismaClient } from "@prisma/client";
import { STATIC_CATALOG } from "../src/catalog";

const prisma = new PrismaClient();

async function main() {
  for (const [sortOrder, entry] of STATIC_CATALOG.entries()) {
    const { id, domain, name, icon, category } = entry;
    const row = { domain, name, icon, category, sortOrder, data: entry as object };
    await prisma.catalogEntry.upsert({ where: { id }, create: { id, ...row }, update: row });
  }
  const ids = STATIC_CATALOG.map((e) => e.id);
  await prisma.catalogEntry.deleteMany({ where: { id: { notIn: ids } } });
  console.log(`Catálogo populado: ${STATIC_CATALOG.length} itens.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
