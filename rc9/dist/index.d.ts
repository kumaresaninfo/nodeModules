declare type RC = Record<string, any>;
interface RCOptions {
    name?: string;
    dir?: string;
    flat?: boolean;
}
export declare const defaults: RCOptions;
export declare function parse(contents: string, options?: RCOptions): RC;
export declare function parseFile(path: string, options?: RCOptions): RC;
export declare function read(options?: RCOptions | string): RC;
export declare function readUser(options?: RCOptions | string): RC;
export declare function serialize(config: RC): string;
export declare function write(config: RC, options?: RCOptions | string): void;
export declare function writeUser(config: RC, options?: RCOptions | string): void;
export declare function update(config: RC, options?: RCOptions | string): RC;
export declare function updateUser(config: RC, options?: RCOptions | string): RC;
export {};
