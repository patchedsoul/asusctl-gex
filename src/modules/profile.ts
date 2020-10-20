declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as DBus from './profile_dbus';
import * as Poller from './profile_poller';
import { IStoppableModule } from '../interfaces/iStoppableModule';


export const ProfileColor = ['blue', 'red', 'green', 'yellow', 'orange', 'white'];
export const ProfileDescr = ['normal', 'boost', 'silent', 'undfined-1', 'undefined-2', 'undefined-3'];
export const ProfileIcons = ['face-smile', 'face-devilish', 'face-tired', 'undfined-1', 'undefined-2', 'undefined-3'];

export class Client implements IStoppableModule {
    connector: any = null
    connected: boolean = false;

    constructor() {
        try {
            this.connector = new DBus.Profile("org-asuslinux-profile-2.0.5");
        } catch {
            Log.error(`Profile client initialization failed!`);
        }
    }

    start() {
        Log.info(`Starting Profile client...`);

        try {
            // trying fallback
            try {
                this.connector.start();
                this.connected = true;
            } catch {
                Log.warn(`Profile client start(DBus) failed!`);
                this.connector = new Poller.Profile();
            }

            if (!this.connected)
                this.connector.start();

            this.connected = true;
        } catch {
            Log.error(`Profile client start failed!`);
        }
    }

    stop() {
        Log.info(`Stopping Profile client...`);

        if (this.connected) {
            this.connected = false;
            this.connector.stop();
        }
    }
}
