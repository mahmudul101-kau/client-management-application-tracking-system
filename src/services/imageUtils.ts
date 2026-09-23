/**
 * Utility functions for optimizing and compressing logo and branding images
 * to ensure fast synchronization and compliance with Google Sheets cell storage limits (50,000 chars max).
 */

const MAX_LOGO_DIMENSION = 160;
const MAX_SAFE_CHAR_LENGTH = 45000;

/**
 * Optimizes an uploaded File into a compact, high-DPI Base64 Data URL.
 * Fits within Google Sheets cell limit while preserving crisp display at 40px-64px.
 */
export async function optimizeLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG and already small enough, read as data URL directly
    if (file.type === 'image/svg+xml' && file.size < 30000) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result as string;
        if (res && res.length <= MAX_SAFE_CHAR_LENGTH) {
          resolve(res);
        } else {
          processBitmapImage(file, resolve, reject);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read SVG file'));
      reader.readAsDataURL(file);
      return;
    }

    processBitmapImage(file, resolve, reject);
  });
}

function processBitmapImage(
  file: File,
  resolve: (value: string) => void,
  reject: (reason?: any) => void
) {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Failed to read file'));
  reader.onload = (e) => {
    const rawDataUrl = e.target?.result as string;
    if (!rawDataUrl) {
      resolve('');
      return;
    }

    const img = new Image();
    img.onerror = () => {
      // If image loading fails, return raw if small, else error
      if (rawDataUrl.length <= MAX_SAFE_CHAR_LENGTH) {
        resolve(rawDataUrl);
      } else {
        reject(new Error('Could not parse image format'));
      }
    };

    img.onload = () => {
      try {
        const optimized = renderScaledCanvas(img, MAX_LOGO_DIMENSION);
        resolve(optimized);
      } catch (err) {
        if (rawDataUrl.length <= MAX_SAFE_CHAR_LENGTH) {
          resolve(rawDataUrl);
        } else {
          reject(err);
        }
      }
    };

    img.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

/**
 * Compresses an existing Data URL if it exceeds safe transmission size
 */
export async function compressLogoDataUrl(dataUrl: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length <= MAX_SAFE_CHAR_LENGTH) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const compressed = renderScaledCanvas(img, MAX_LOGO_DIMENSION);
        resolve(compressed);
      } catch {
        // Truncate safely if compression fails
        resolve(dataUrl.substring(0, MAX_SAFE_CHAR_LENGTH));
      }
    };
    img.onerror = () => {
      resolve(dataUrl.substring(0, MAX_SAFE_CHAR_LENGTH));
    };
    img.src = dataUrl;
  });
}

function renderScaledCanvas(img: HTMLImageElement, maxDim: number): string {
  let width = img.naturalWidth || img.width || maxDim;
  let height = img.naturalHeight || img.height || maxDim;

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.max(1, Math.round((height * maxDim) / width));
      width = maxDim;
    } else {
      width = Math.max(1, Math.round((width * maxDim) / height));
      height = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Try PNG first (preserves alpha transparency)
  let result = canvas.toDataURL('image/png');
  if (result.length > MAX_SAFE_CHAR_LENGTH) {
    // If PNG is too large, fallback to high-quality JPEG
    result = canvas.toDataURL('image/jpeg', 0.85);
  }
  if (result.length > MAX_SAFE_CHAR_LENGTH) {
    // Further reduce quality if still over limit
    result = canvas.toDataURL('image/jpeg', 0.70);
  }

  return result;
}
