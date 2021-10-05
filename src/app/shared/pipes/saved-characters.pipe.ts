import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'savedCharacters'})
export class SavedCharactersPipe implements PipeTransform {

  transform(characters: any) {
    if (!characters || characters.length <= 0) {
      return '';
    }
    let final = '';
    characters.forEach(character => {
      Object.keys(character).forEach(item1 => {
        character[item1].forEach(item => {
          final += item.catalog.split('.').pop() + ':' + item.description + ' / ';
        });
      });
    });
    return final.replace(/ \/ $/, '');
  }
}
