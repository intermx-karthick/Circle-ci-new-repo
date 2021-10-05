import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'normalizeSavedAudience'})
export class NormalizeSavedAudiencePipe implements PipeTransform {

  transform(characters: any) {
    if (!characters || characters.length <= 0) {
      return [];
    }
    const final = [];
    characters.forEach(character => {
      Object.keys(character).forEach(item1 => {
        character[item1].forEach(item => {
          final.push({
            category: item.catalog.split('.').pop(),
            description: item.description,
          });
        });
      });
    });
    return final;
  }
}
