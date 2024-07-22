import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
})
export class FilterPipe implements PipeTransform {
  transform(value: any, searchWord: any): any {
    if (!searchWord) return value;
    searchWord = searchWord.toLowerCase();

    return value.filter((arrayItem: any) => {
      if (arrayItem.body) {
        return arrayItem.body.toLowerCase().includes(searchWord);
      } else if (arrayItem.message) {
        return arrayItem.message.message.toLowerCase().includes(searchWord);
      } else if (arrayItem.displayName) {
        return arrayItem.displayName.toLowerCase().includes(searchWord);
      }
    });
  }
}
