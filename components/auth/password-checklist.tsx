import { Check, X } from "lucide-react";

import { PASSWORD_RULES } from "@/lib/validation/profile";

/** Live list of the password rules (`PASSWORD_REGEX`), ticking each one as it's met. */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="grid gap-1 text-xs sm:grid-cols-2" aria-label="Requisitos de la contraseña">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li key={rule.id} className={`flex items-center gap-1.5 ${ok ? "text-success" : "text-muted"}`}>
            {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
