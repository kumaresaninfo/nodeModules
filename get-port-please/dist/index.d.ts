interface GetPortOptions {
    name?: string;
    random?: boolean;
    port?: number;
    ports?: number[];
    memoDir?: string;
    memoName?: string;
}
export default function getPort(options?: GetPortOptions): Promise<number>;
export {};
