declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as DBus from './supported_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';

export class Client implements IStoppableModule {
    connector: DBus.Supported = new DBus.Supported();
    connected: boolean = false;

    constructor() {        
        try {
            this.connector = new DBus.Supported();
        } catch(e) {
            Log.error(`Supported client initialization failed!`, e);
        }
    }

    isRunning(): boolean {
        return (this.connected && this.connector && this.connector.isRunning());
    }

    start() {
        Log.debug(`Starting Supported client...`);

        try {
            this.connector.start();
            this.connected = this.connector.isRunning();
        } catch (e) {
            Log.error(`Supported start failed!`, e);
        }
    }

    stop() {
        Log.debug(`Stopping Supported client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.connector.stop();
        }
    }
}
