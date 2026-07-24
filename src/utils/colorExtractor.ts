/**
 * Utility to extract prominent colors from an image file or Data URL using HTML Canvas
 */

export interface ExtractedPalette {
  dominantHex: string;
  paletteHex: string[];
}

export async function extractColorsFromImage(imageSrc: string): Promise<ExtractedPalette> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dominantHex: '#8B5CF6', paletteHex: ['#8B5CF6', '#7C3AED', '#3B82F6', '#10B981'] });
          return;
        }

        // Scale down image to 64x64 for fast pixel sampling
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const imgData = ctx.getImageData(0, 0, 64, 64).data;
        const colorCounts: Record<string, number> = {};
        const colorBuckets: { r: number; g: number; b: number; count: number }[] = [];

        // Sample pixels with step 4 for performance
        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip almost transparent or pure black/white pixels for accent extraction
          if (a < 128) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const diff = max - min;
          // Skip dull grayscale unless no choice
          if (diff < 15 && (max < 30 || max > 220)) continue;

          // Bucket to nearest multiple of 16
          const nr = Math.round(r / 16) * 16;
          const ng = Math.round(g / 16) * 16;
          const nb = Math.round(b / 16) * 16;
          const key = `${nr},${ng},${nb}`;

          colorCounts[key] = (colorCounts[key] || 0) + 1;
        }

        // Sort colors by frequency
        const sorted = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);

        if (sorted.length === 0) {
          resolve({ dominantHex: '#8B5CF6', paletteHex: ['#8B5CF6', '#7C3AED', '#3B82F6', '#10B981'] });
          return;
        }

        const toHex = (r: number, g: number, b: number) =>
          '#' + [r, g, b].map(x => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0')).join('');

        const hexList: string[] = sorted.map(([key]) => {
          const [r, g, b] = key.split(',').map(Number);
          return toHex(r, g, b);
        });

        const dominant = hexList[0] || '#8B5CF6';
        
        // Take up to 5 distinct colors
        const palette = Array.from(new Set(hexList)).slice(0, 5);

        resolve({
          dominantHex: dominant,
          paletteHex: palette.length >= 2 ? palette : [dominant, '#7C3AED', '#3B82F6', '#10B981'],
        });
      } catch (err) {
        resolve({ dominantHex: '#8B5CF6', paletteHex: ['#8B5CF6', '#7C3AED', '#3B82F6', '#10B981'] });
      }
    };

    img.onerror = () => {
      resolve({ dominantHex: '#8B5CF6', paletteHex: ['#8B5CF6', '#7C3AED', '#3B82F6', '#10B981'] });
    };

    img.src = imageSrc;
  });
}
