import { ImageUrlPipe } from './image-url.pipe';
import { InventoryImageType } from '@interTypes/enums';
describe('ImageUrlPipe', () => {
    let pipe: ImageUrlPipe;
    const photos = ["https://assets.geopath.io/inventory/images/photo_31003615_0.jpg","https://assets.geopath.io/inventory/images/photo_31003615_0_h180p.jpeg","https://assets.geopath.io/inventory/images/photo_31003615_0_w100p.jpeg"]; // Test Id
    beforeEach(() => {
        pipe = new ImageUrlPipe();
    });
    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });
    it('when no size mentioned it should return big image', () => {
        expect(pipe.transform(photos, InventoryImageType.FULL_IMAGE)).toBe(
            'https://assets.geopath.io/inventory/images/photo_31003615_0.jpg'
        );
    });
    it('when size mentioned it should return image url based on size', () => {
        expect(pipe.transform(photos, InventoryImageType.HEIGHT_180)).toBe(
            'https://assets.geopath.io/inventory/images/photo_31003615_0_h180p.jpeg'
        );
    });
});
