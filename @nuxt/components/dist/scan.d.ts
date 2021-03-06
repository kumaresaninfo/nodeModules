export interface Component {
    pascalName: string;
    kebabName: string;
    import: string;
    asyncImport: string;
    export: string;
    filePath: string;
    shortPath: string;
    async?: boolean;
    chunkName: string;
    global: boolean;
}
export interface ScanDir {
    path: string;
    pattern?: string | string[];
    ignore?: string[];
    prefix?: string;
    global?: boolean | 'dev';
    extendComponent?: (component: Component) => Promise<Component | void> | (Component | void);
}
export declare function scanComponents(dirs: ScanDir[], srcDir: string): Promise<Component[]>;
export declare function matcher(tags: string[], components: Component[]): Component[];
