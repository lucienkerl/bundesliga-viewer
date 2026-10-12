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

export async function downloadImage(ctx: SheetContext): Promise<void> {
  const canvas = await renderImage(ctx);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName(ctx);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}
