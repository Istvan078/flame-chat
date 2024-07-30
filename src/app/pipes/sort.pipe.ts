import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort',
})
export class SortPipe implements PipeTransform {
  transform(value: any, pipeRefresh?: boolean) {
    if (pipeRefresh) console.log('PIPE FRISSÍTVE');
    return value.sort((a: any, b: any) => {
      if (a?.id) {
        if (a.newestTimeStamp > b.newestTimeStamp) return -1;
        else return 1;
      } else {
        if (
          a.message.timeStamp > b.message.timeStamp ||
          a.timeStamp > b.timeStamp
        ) {
          return -1;
        } else {
          return 1;
        }
      }
    });
  }
}
