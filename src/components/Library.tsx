import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogEntry } from "@/domain/items";
import type { Domain } from "@/domain/types";

interface Props {
  domain: Domain;
  entries: CatalogEntry[];
  categories: string[];
  onAdd: (entry: CatalogEntry) => void;
  onClose: () => void;
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function Library({ domain, entries, categories, onAdd, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const title = domain === "energy" ? "Adicionar aparelho" : "Adicionar atividade";

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return entries.filter(
      (entry) =>
        entry.domain === domain &&
        (category === null || entry.category === category) &&
        (q === "" || normalize(entry.name).includes(q)),
    );
  }, [entries, domain, category, query]);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className={`library library--${domain}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="library__header">
          <h2 id="library-title">{title}</h2>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Fechar
          </button>
        </header>
        <input
          ref={searchRef}
          type="search"
          className="library__search"
          placeholder={domain === "energy" ? "Pesquisar aparelho…" : "Pesquisar atividade…"}
          aria-label="Pesquisar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="chips" role="group" aria-label="Filtrar por categoria">
          <button type="button" className="chip" aria-pressed={category === null} onClick={() => setCategory(null)}>
            Todas
          </button>
          {categories.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <ul className="library__grid">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="library__item" onClick={() => onAdd(entry)}>
                <span className="library__icon" aria-hidden="true">
                  {entry.icon}
                </span>
                <span className="library__name">{entry.name}</span>
                <span className="library__category">{entry.category}</span>
              </button>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <p className="muted">Nada encontrado. Use o item “personalizado” em Outros para cadastrar qualquer outro.</p>
        )}
      </div>
    </div>
  );
}
