/**
 * Lazy Phosphor icon rendering.
 *
 * The full @phosphor-icons/react module (1,500+ icons) would bloat the main
 * bundle, so it is loaded as a single code-split chunk on first use and
 * cached (CLAUDE.md: dynamic import for icon previews). Until it resolves,
 * a neutral placeholder square keeps layout stable.
 */

import { useEffect, useState, type FC } from "react";
import type { Icon } from "@phosphor-icons/react";
import type { IconRef } from "../types/spec";

type PhosphorModule = Record<string, unknown>;

let modulePromise: Promise<PhosphorModule> | null = null;
let loadedModule: PhosphorModule | null = null;

export function loadPhosphorModule(): Promise<PhosphorModule> {
  if (!modulePromise) {
    modulePromise = import("@phosphor-icons/react").then((mod) => {
      loadedModule = mod as PhosphorModule;
      return loadedModule;
    });
  }
  return modulePromise;
}

/** "address-book" -> "AddressBook" (matches icons.json pascalName). */
export function toPascalName(kebabName: string): string {
  return kebabName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function resolveIcon(name: string): Icon | null {
  if (!loadedModule) return null;
  const candidate = loadedModule[toPascalName(name)];
  return typeof candidate === "function" || typeof candidate === "object"
    ? (candidate as Icon)
    : null;
}

/** Re-renders once the phosphor chunk arrives; null while loading. */
export function usePhosphorIcon(name: string): Icon | null {
  const [, setReady] = useState(loadedModule !== null);

  useEffect(() => {
    if (loadedModule) return;
    let cancelled = false;
    loadPhosphorModule()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        // Icon chunk failed to load (offline etc.) — placeholder stays.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return resolveIcon(name);
}

interface LazyIconProps {
  icon: IconRef;
  size?: number;
  className?: string;
}

export const LazyIcon: FC<LazyIconProps> = ({ icon, size = 20, className }) => {
  const IconComponent = usePhosphorIcon(icon.name);

  if (!IconComponent) {
    return (
      <span
        aria-hidden
        className={`inline-block shrink-0 rounded bg-slate-200 ${className ?? ""}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <IconComponent
      size={size}
      weight={icon.weight}
      className={`shrink-0 ${className ?? ""}`}
      aria-hidden
    />
  );
};
