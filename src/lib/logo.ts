import type { LeagueData } from '../../shared/types';
import { esc } from './format';

/** Absolute URL of a logo path like "logos/ABC.jpg", so it also works in windows opened with document.write. */
export const logoHref = (path: string | null | undefined): string | null =>
  path ? new URL(`${import.meta.env.BASE_URL}data/${path}`, document.baseURI).href : null;

export const teamLogo = (data: LeagueData, team: string): string | null =>
  logoHref(data.teams.find((t) => t.name === team)?.club?.logo);

export const logoImg = (href: string | null, cls = 'logo'): string =>
  href ? `<img class="${cls}" src="${esc(href)}" alt="" loading="lazy" decoding="async">` : '';

/** Loads an image for canvas drawing; resolves to null when it cannot be loaded. */
export const loadImage = (href: string | null): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    if (!href) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = href;
  });
