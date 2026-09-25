"use client";

type Option = { id: string; name: string };

export function TagMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: Option[];
  selected: Option[];
  onChange: (next: Option[]) => void;
}) {
  function isSelected(option: Option) {
    // Legacy selections may lack an id, so fall back to matching by name.
    return selected.some((s) => (s.id ? s.id === option.id : s.name === option.name));
  }

  function toggle(option: Option) {
    onChange(
      isSelected(option)
        ? selected.filter((s) => (s.id ? s.id !== option.id : s.name !== option.name))
        : [...selected, { id: option.id, name: option.name }],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = isSelected(o);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o)}
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
