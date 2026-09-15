const STATS = [
  { value: "12.000+", label: "hogares publicados" },
  { value: "38", label: "proyectos nuevos en Medellín" },
  { value: "4,9 / 5", label: "calificación de los usuarios" },
  { value: "72 h", label: "para arrendar en promedio" },
];

export function StatsSection() {
  return (
    <section className="border-y border-separator bg-surface-secondary">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center sm:text-left">
            <div className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {stat.value}
            </div>
            <div className="mt-1 text-sm text-muted">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
