/** Account home for viewers: a greeting only, until they have something to manage. */
export function ViewerHome({ name }: { name: string | null }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{name ? `Hola, ${name.split(" ")[0]}` : "Inicio"}</h1>
        <p className="mt-1 text-sm text-muted">Bienvenido a tu cuenta de Delfos.</p>
      </div>
    </div>
  );
}
