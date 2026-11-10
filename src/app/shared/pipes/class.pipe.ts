import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'class',
  standalone: false,
})
export class ClassPipe implements PipeTransform {

  transform(condition:boolean): any {
    return condition=true;
  }

}
