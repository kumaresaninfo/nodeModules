interface MemoOptions {
    dir?: string;
    name?: string;
}
export declare function getMemo(options: MemoOptions): Promise<any>;
export declare function setMemo(memo: object, options: MemoOptions): Promise<void>;
export {};
