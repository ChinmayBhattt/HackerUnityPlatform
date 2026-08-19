/**
 * Utility to crop an image given a pixel crop area.
 * Returns a high-quality base64 Data URL.
 */
export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Crops the image given a pixel crop area, optional rotation, and optional maxWidth/maxHeight.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  maxWidth = 1200,
  maxHeight = 600
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // Calculate target dimensions
  let targetWidth = Math.max(1, Math.round(pixelCrop.width));
  let targetHeight = Math.max(1, Math.round(pixelCrop.height));

  // Scale down if exceeding max bounds
  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.max(1, Math.round(targetWidth * ratio));
    targetHeight = Math.max(1, Math.round(targetHeight * ratio));
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.save();
  if (rotation !== 0) {
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate(getRadianAngle(rotation));
    ctx.translate(-targetWidth / 2, -targetHeight / 2);
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Reads a File object and returns a base64 data URL string.
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}
