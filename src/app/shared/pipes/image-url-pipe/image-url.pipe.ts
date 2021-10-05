import { Pipe, PipeTransform } from '@angular/core';
import { InventoryImageType } from '@interTypes/enums';

@Pipe({
    name: 'getImageUrl'
})
export class ImageUrlPipe implements PipeTransform {
    transform(photos: string[], imageType: InventoryImageType ): string {
        let imageUrl = '';
        if (photos && photos.length > 0) {
          switch(imageType) {
            case InventoryImageType.WIDTH_100:
              imageUrl = this.findImage(photos, imageType);
              if (typeof imageUrl === 'undefined') {
                imageUrl = this.findImage(photos, InventoryImageType.HEIGHT_180);
                if (typeof imageUrl === 'undefined') {
                  imageUrl = photos[0];
                }
              }
              break;
            case InventoryImageType.HEIGHT_180:
              imageUrl = this.findImage(photos, imageType);
              if (typeof imageUrl === 'undefined') {
                imageUrl = photos[0];
              }
              break;
            case InventoryImageType.FULL_IMAGE:
              imageUrl = photos[0];
              break;
          }
        }
        return imageUrl || '';
      }
    findImage(photos, imageType) {
      return photos.find((url) => url.includes(imageType));
    }
}
