import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(value:any, searchWord: any): any {

     if (!searchWord) return value
     searchWord = searchWord.toLowerCase();
     
    return value.filter(
      
       (arrayItem:any) => {
        if(arrayItem.body){
       return arrayItem.body.toLowerCase().includes(searchWord)
       } else{
       return arrayItem.message.toLowerCase().includes(searchWord)
       }
      }
       )
  }

}
