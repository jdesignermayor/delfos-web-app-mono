import { createClient } from "@/supabase/server";

export type DeveloperOption = { id: number; name: string; isEnabled: boolean };

/** Every constructora for the user form's select, disabled ones included (and labelled). */
export async function getDeveloperOptions(): Promise<DeveloperOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("developers").select("id, name, is_enabled").order("name");
  return (data ?? []).map((d) => ({ id: d.id, name: d.name, isEnabled: d.is_enabled }));
}
