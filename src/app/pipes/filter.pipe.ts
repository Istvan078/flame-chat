import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(value:any, searchWord: any): any {

     if (!searchWord) return value
     searchWord = searchWord.toLowerCase();
    return value.filter(
       (arrayItem:any) => arrayItem.body.toLowerCase().includes(searchWord)
       )
  }

}
