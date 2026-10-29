import "server-only";
import { PrismaClient } from "@prisma/client";
import { STATIC_CATALOG } from "@/catalog";
import type { CatalogEntry } from "@/domain/items";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function client() {
  globalForPrisma.prisma ??= new PrismaClient();
  return globalForPrisma.prisma;
}

export interface CatalogResult {
  entries: CatalogEntry[];
  source: "database" | "static";
}

/** Lê o catálogo do PostgreSQL; sem banco disponível, usa o catálogo estático do código. */
export async function getCatalog(): Promise<CatalogResult> {
  if (!process.env.DATABASE_URL) return { entries: STATIC_CATALOG, source: "static" };
  try {
    const rows = await client().catalogEntry.findMany({ orderBy: { sortOrder: "asc" } });
    if (rows.length === 0) return { entries: STATIC_CATALOG, source: "static" };
    return { entries: rows.map((row) => row.data as unknown as CatalogEntry), source: "database" };
  } catch (error) {
    console.warn("Catálogo do banco indisponível; usando catálogo estático.", (error as Error).message);
    return { entries: STATIC_CATALOG, source: "static" };
  }
}
