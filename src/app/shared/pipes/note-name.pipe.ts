import { Pipe, PipeTransform } from '@angular/core';
import {
  Note
} from '@interTypes/notes';
import isEqual from 'date-fns/isEqual'

@Pipe({
  name: 'noteName'
})
export class NoteNamePipe implements PipeTransform {
  transform(value: Note, ...args: any[]): string {
    if(!isEqual(new Date(value?.createdAt), new Date(value?.updatedAt))){
      return 'Changed'
    }else{
      return 'Drafted';
    }    
  }

}
