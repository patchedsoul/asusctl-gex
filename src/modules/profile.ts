declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as DBus from './profile_dbus';
// import * as Poller from './profile_poller';
import { IStoppableModule } from '../interfaces/iStoppableModule';


export const ProfileColor = ['yellow', 'red', 'green', 'blue', 'orange', 'white'];
export const ProfileDescr = ['normal', 'boost', 'silent', '_1', '_2', '_3'];
export const ProfileIcons = ['asus_notif_yellow', 'asus_notif_red', 'asus_notif_green', '_1', '_2', '_3'];

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
