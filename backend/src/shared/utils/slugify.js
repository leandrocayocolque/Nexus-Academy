import slugifyPackage from 'slugify';

export const toSlug = (value) => slugifyPackage(value ?? '', { lower: true, strict: true, trim: true });
