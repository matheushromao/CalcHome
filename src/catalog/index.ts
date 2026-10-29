import { ACTIVITIES } from "./activities.seed";
import { EQUIPMENT } from "./equipment.seed";

/** Catálogo estático: fonte do seed do banco e alternativa quando o banco está indisponível. */
export const STATIC_CATALOG = [...EQUIPMENT, ...ACTIVITIES];

export const ENERGY_CATEGORIES = [
  "Cozinha",
  "Climatização",
  "Entretenimento e informática",
  "Lavanderia e limpeza",
  "Banheiro",
  "Iluminação",
  "Outros",
];

export const WATER_CATEGORIES = ["Banheiro", "Cozinha", "Lavanderia", "Limpeza", "Jardim", "Outros"];
