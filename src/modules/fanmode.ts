declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as DBus from './fanmode_dbus';
import * as Poller from './fanmode_poller';
import { IStoppableModule } from '../interfaces/iStoppableModule';


export const FanModeColor = ['blue', 'red', 'green', 'yellow', 'orange', 'white'];
export const FanModeDescr = ['normal', 'boost', 'silent', 'undfined-1', 'undefined-2', 'undefined-3'];
export const FanModeIcons = ['face-smile', 'face-devilish', 'face-tired', 'undfined-1', 'undefined-2', 'undefined-3'];

export class Client implements IStoppableModule {
    connector: any = null
    connected: boolean = false;

    constructor() {
        try {
            this.connector = new DBus.FanMode("asus-nb-ctrl-1.0.2");
        } catch {
            Log.error(`FanMode client initialization failed!`);
        }
    }

    start() {
        Log.info(`Starting FanMode client...`);

        try {
            // trying fallback
            try {
                this.connector.start();
                this.connected = true;
            } catch {
                Log.warn(`FanMode client start(DBus) failed!`);
                this.connector = new Poller.FanMode();
            }

            if (!this.connected)
                this.connector.start();

            this.connected = true;
        } catch {
            Log.error(`FanMode client start failed!`);
        }
    }

    stop() {
        Log.info(`Stopping FanMode client...`);

        if (this.connected) {
            this.connected = false;
            this.connector.stop();
        }
    }
}
