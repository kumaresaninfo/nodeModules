/// <reference types="node" />
import { IncomingMessage } from 'http';
export default function isHTTPS(req: IncomingMessage, trustProxy?: Boolean): Boolean | undefined;
