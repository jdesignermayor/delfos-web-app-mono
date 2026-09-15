"use client";

import { Button } from "@heroui/react";
import { useTheme } from "@heroui/react";

import { MoonIcon, SunIcon } from "@/components/icons";

/**
 * Toggles between the HeroUI light and dark themes. `resolvedTheme` is
 * `undefined` during SSR / the first paint, so we render a stable placeholder
 * until the client knows which theme is active.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme("system");
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onPress={() => setTheme(isDark ? "light" : "dark")}
    >
      {resolvedTheme ? (
        isDark ? (
          <SunIcon />
        ) : (
          <MoonIcon />
        )
      ) : (
        <span className="size-5" />
      )}
    </Button>
  );
}
