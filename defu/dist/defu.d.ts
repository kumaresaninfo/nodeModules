declare type Merger = (obj: any, key: string, value: any) => any;
declare type DefuFn = <T>(...args: T | any) => T;
interface Defu {
    <T>(...args: T | any): T;
    fn: DefuFn;
    arrayFn: DefuFn;
    extend(merger?: Merger): DefuFn;
}
declare const defu: Defu;
export default defu;
