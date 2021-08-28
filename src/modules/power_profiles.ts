declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as DBus from './power_profiles_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';

export class Client implements IStoppableModule {
    connector: DBus.PowerProfiles = new DBus.PowerProfiles();
    connected: boolean = false;

    constructor() {        
        try {
            this.connector = new DBus.PowerProfiles();
        } catch(e) {
            Log.error(`Power Profile client initialization failed!`, e);
        }
    }

    isRunning(): boolean {
        return (this.connected && this.connector && this.connector.isRunning());
    }

    start() {
        Log.info(`Starting Power Profile client...`);

        try {
            this.connector.start();
            this.connected = this.connector.isRunning();
        } catch (e) {
            Log.error(`Power Profile start failed!`, e);
        }
    }

    stop() {
        Log.info(`Stopping Power Profile client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.connector.stop();
        }
    }
}
