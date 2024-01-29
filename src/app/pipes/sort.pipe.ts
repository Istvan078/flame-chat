import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "sort"
})

export class SortPipe implements PipeTransform{
    transform(value: any) {
        
     
        return value.sort((a:any, b:any) => {
            if(a.message.timeStamp > b.message.timeStamp || a.timeStamp > b.timeStamp){
                return -1
            } else {
                return 1
            }
        })
    
}
}