import { de } from '../i18n/de';
import { fullDate } from '../lib/format';
import { renderImage } from './image';
import { renderSheet } from './sheet';
import type { SheetContext } from './types';

const fileName = (ctx: SheetContext) =>
  `${ctx.match.home} - ${ctx.match.away} ${fullDate(ctx.date)}.png`.replace(/[\\/:*?"<>|]/g, '');

export async function openSheet(ctx: SheetContext): Promise<void> {
  // Open the window synchronously (inside the click) so pop-up blockers allow it; fill it once the logos are loaded.
  const w = window.open('', '_blank');
  if (!w) {
    alert(de.sheet.popup);
    return;
  }
  const html = renderSheet(ctx, (await renderImage(ctx)).toDataURL('image/png'));
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/**
 * Opens the result image in a new tab so it can be saved to the photo album, shared or copied
 * (long press on a phone). Falls back to a download when pop-ups are blocked.
 */
export async function openImage(ctx: SheetContext): Promise<void> {
  // Open the tab synchronously (inside the click) so pop-up blockers allow it, then point it at the image.
  const w = window.open('', '_blank');
  const canvas = await renderImage(ctx);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) {
    w?.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  if (w) {
    w.location.href = url;
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName(ctx);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000);
}
