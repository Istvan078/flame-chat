import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'class'
})
export class ClassPipe implements PipeTransform {

  transform(condition:boolean): any {
    return condition=true;
  }

}
