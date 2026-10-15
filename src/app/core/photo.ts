import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/** Ouvre la caméra (native ou web via @ionic/pwa-elements) et renvoie une photo compressée en Data URL. */
export async function takePhoto(): Promise<string> {
  const photo = await Camera.getPhoto({
    source: CameraSource.Camera,
    resultType: CameraResultType.DataUrl,
    quality: 70,
    width: 600,
    allowEditing: false,
  });
  if (!photo.dataUrl) {
    throw new Error('Aucune photo récupérée');
  }
  return compress(photo.dataUrl);
}

/** Redimensionne l'image (max 320 px) pour qu'elle tienne largement dans un document Firestore. */
function compress(dataUrl: string, max = 320, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
