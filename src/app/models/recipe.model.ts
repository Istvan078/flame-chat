export class Recipe {

  constructor(
    
    public name: string,
    public ingredients: string,
    public howToMake: string,
    public timeToMake: number,
    public portion: number,
    public difficulty: string,
    public photo?: string,
    public key?: any,
    ) {}
}
