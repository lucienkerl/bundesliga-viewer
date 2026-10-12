// Renders public/favicon.svg to the PNG icons used by browsers and phones.
import sharp from 'sharp';

for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  await sharp('public/favicon.svg', { density: 384 }).resize(size, size).png().toFile(`public/${name}`);
  console.log(`public/${name}`);
}
