export class ImageStorageProvider {
  async upload(_file) {
    throw new Error('Image upload is not implemented yet.');
  }

  async remove(_publicId) {
    throw new Error('Image removal is not implemented yet.');
  }
}
