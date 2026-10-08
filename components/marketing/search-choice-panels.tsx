import {
  BedDouble,
  BedSingle,
  Building,
  Coins,
  Gem,
  Hammer,
  House,
  LayoutGrid,
  PiggyBank,
  Sofa,
  Sparkles,
  Wallet,
} from "lucide-react";

import { TYPE_LABELS, type Operation, type PropertyType } from "@/components/marketing/properties";
import { OptionCard, PanelHeader, type LucideIcon, type Tone } from "@/components/marketing/search-option-ui";

export type Choice = {
  /** "" stands for "any". */
  value: string;
  icon: LucideIcon;
  tone: Tone;
  label: string;
  hint?: string;
};

/** A titled grid of option cards where exactly one is selected. */
export function ChoicePanel({
  title,
  hint,
  gridClassName,
  choices,
  value,
  onSelect,
}: {
  title: string;
  hint?: string;
  gridClassName: string;
  choices: Choice[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <>
      <PanelHeader title={title} hint={hint} />
      <div className={`grid gap-2 ${gridClassName}`}>
        {choices.map((choice) => (
          <OptionCard
            key={choice.value || "any"}
            icon={choice.icon}
            tone={choice.tone}
            label={choice.label}
            hint={choice.hint}
            selected={value === choice.value}
            onClick={() => onSelect(choice.value)}
          />
        ))}
      </div>
    </>
  );
}

const TYPE_STYLES: Record<PropertyType, Omit<Choice, "value" | "label">> = {
  apartamento: { icon: Building, tone: "indigo", hint: "En edificio o conjunto" },
  casa: { icon: House, tone: "emerald", hint: "Con más espacio propio" },
  apartaestudio: { icon: Sofa, tone: "amber", hint: "Compacto, un ambiente" },
  proyecto: { icon: Hammer, tone: "rose", hint: "Vivienda nueva en obra" },
};

export const TYPE_CHOICES: Choice[] = [
  { value: "", icon: LayoutGrid, tone: "slate", label: "Cualquiera", hint: "Todos los tipos" },
  ...(Object.entries(TYPE_LABELS) as [PropertyType, string][]).map(([value, label]) => ({
    value,
    label,
    ...TYPE_STYLES[value],
  })),
];

const ROOM_TONES: Tone[] = ["sky", "indigo", "violet", "teal"];

export const ROOM_CHOICES: Choice[] = [
  { value: "", icon: LayoutGrid, tone: "slate", label: "Todas" },
  ...["1", "2", "3", "4"].map((value, index) => ({
    value,
    icon: value === "1" ? BedSingle : BedDouble,
    tone: ROOM_TONES[index],
    label: `${value}+`,
    hint: value === "1" ? "habitación" : "habitaciones",
  })),
];

const BUDGET_STYLES: Pick<Choice, "icon" | "tone">[] = [
  { icon: Coins, tone: "emerald" },
  { icon: PiggyBank, tone: "sky" },
  { icon: Wallet, tone: "violet" },
  { icon: Gem, tone: "amber" },
];

export function budgetChoices(options: { value: string; label: string }[]): Choice[] {
  return [
    { value: "", icon: Sparkles, tone: "slate", label: "Cualquiera", hint: "Sin límite de precio" },
    ...options.map((option, index) => ({
      value: option.value,
      label: option.label,
      ...BUDGET_STYLES[index % BUDGET_STYLES.length],
    })),
  ];
}

export function budgetHint(operation: Operation) {
  return operation === "arrendar" ? "Canon mensual máximo" : "Precio total máximo";
}
