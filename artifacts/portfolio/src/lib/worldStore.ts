import { useSyncExternalStore } from "react";

/** Scroll-driven state shared between the fixed 3D world and the HTML sections. */
export interface SectionRect {
  id: string;
  top: number;
  height: number;
}

export interface WorldState {
  scrollY: number;
  viewportH: number;
  viewportW: number;
  sections: SectionRect[];
  /** 0..1 inside the hero's tall section */
  heroProgress: number;
  /** id of the section whose beat the camera is on */
  section: string;
  ready: boolean;
}

type Listener = () => void;

const state: WorldState = {
  scrollY: 0,
  viewportH: 800,
  viewportW: 1280,
  sections: [],
  heroProgress: 0,
  section: "hero",
  ready: false,
};
const listeners = new Set<Listener>();

export const worldStore = {
  get(): WorldState {
    return state;
  },
  set(patch: Partial<WorldState>) {
    let changed = false;
    for (const k of Object.keys(patch) as (keyof WorldState)[]) {
      if (state[k] !== patch[k]) {
        (state as unknown as Record<string, unknown>)[k] = patch[k];
        changed = true;
      }
    }
    if (changed) listeners.forEach((l) => l());
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useWorldState<T>(selector: (s: WorldState) => T): T {
  return useSyncExternalStore(
    worldStore.subscribe,
    () => selector(state),
    () => selector(state),
  );
}

/** Section ids in page order; the world has a camera beat for each. */
export const WORLD_SECTIONS = [
  "hero",
  "numbers",
  "work",
  "open-source",
  "projects",
  "skills",
  "about",
  "writing",
  "contact",
] as const;
export type WorldSectionId = (typeof WORLD_SECTIONS)[number];

/** Short names painted on the river buoys. */
export const SECTION_TITLES: Record<string, string> = {
  numbers: "Numbers",
  work: "Jaeger build",
  "open-source": "Open source",
  projects: "CodeSight",
  skills: "Skills",
  about: "About",
  writing: "Writing",
  contact: "Contact",
};
