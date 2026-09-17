"use client";

type Option = { id: string; name: string };

export function TagMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(name: string) {
    onChange(
      selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o.name);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.name)}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-accent bg-accent text-white"
                : "border-separator bg-surface text-foreground hover:border-accent/50"
            }`}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}
