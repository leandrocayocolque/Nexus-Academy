import { ImageStorageProvider } from './imageStorage.provider.js';

export class CloudinaryAdapter extends ImageStorageProvider {}

export const imageStorageProvider = new CloudinaryAdapter();
