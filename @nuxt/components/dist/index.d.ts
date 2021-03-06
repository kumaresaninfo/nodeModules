import { Module } from '@nuxt/types';
import { ScanDir } from './scan';
export interface ComponentsDir extends ScanDir {
    watch?: boolean;
    extensions?: string[];
    transpile?: 'auto' | boolean;
}
declare type componentsDirHook = (dirs: ComponentsDir[]) => void | Promise<void>;
declare type componentsExtendHook = (components: (ComponentsDir | ScanDir)[]) => void | Promise<void>;
declare module '@nuxt/types/config/hooks' {
    interface NuxtOptionsHooks {
        'components:dirs'?: componentsDirHook;
        'components:extend'?: componentsExtendHook;
        components?: {
            dirs?: componentsDirHook;
            extend?: componentsExtendHook;
        };
    }
}
export interface Options {
    dirs: (string | ComponentsDir)[];
}
declare module '@nuxt/types/config/index' {
    interface NuxtOptions {
        components: boolean | Options | Options['dirs'];
    }
}
declare const componentsModule: Module<any>;
export default componentsModule;
