import { loader as WebpackLoader } from 'webpack';
export default function loader(this: WebpackLoader.LoaderContext, content: string): Promise<void>;
