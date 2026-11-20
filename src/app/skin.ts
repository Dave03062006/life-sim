import type { Skin } from '../styles/art'

/** Switches skins instantly: transitions are off for this one update, so no colour fades half-way. */
export function applySkin(skin: Skin): void {
  const root = document.documentElement
  root.classList.add('noanim')
  root.dataset.style = skin
  void root.offsetWidth // force the reflow while transitions are off
  root.classList.remove('noanim')
}
