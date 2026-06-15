import { virtualTryOn, type FalVirtualTryOnOptions } from './fal';

export type TryOnCategory = FalVirtualTryOnOptions['category'];
export type GarmentPhotoType = FalVirtualTryOnOptions['garmentPhotoType'];

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read image file'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export async function runVirtualTryOnFromFiles(
  personFile: File,
  garmentFile: File,
  options?: Pick<FalVirtualTryOnOptions, 'category' | 'garmentPhotoType'>
): Promise<string[]> {
  const [personImage, garmentImage] = await Promise.all([
    fileToDataUrl(personFile),
    fileToDataUrl(garmentFile),
  ]);

  const result = await virtualTryOn({
    personImage,
    garmentImage,
    category: options?.category,
    garmentPhotoType: options?.garmentPhotoType,
  });

  return result.images;
}
