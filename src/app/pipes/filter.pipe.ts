import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(array:any[], searchWord: any): any {
    if (!searchWord) return array
    searchWord = searchWord.toLowerCase();
    return array.filter(
      (arrayItem:any) => arrayItem.body.toLowerCase().includes(searchWord)
      )
  }

}
