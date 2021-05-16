declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as DBus from './profile_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';

export class Client implements IStoppableModule {
    connector: any = null
    connected: boolean = false;

    constructor() {        
        try {
            this.connector = new DBus.Profile("org-asuslinux-profile-3.0.0");
        } catch(e) {
            Log.error(`Profile client initialization failed!`);
            Log.error(e);
        }
    }

    start() {
        Log.info(`Starting Profile client...`);

        try {
            this.connector.start();

            let profileNames: string = this.connector.getProfileNames();
            this.connector.profileDesc = profileNames.toString().split(',');

            this.connected = true;
        } catch (e) {
            Log.error(`Profile start failed!`);
            Log.error(e);
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
