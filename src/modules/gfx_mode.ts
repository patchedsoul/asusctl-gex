declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as DBus from './gfx_mode_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';

export class Client implements IStoppableModule {
    connector: any = null
    connected: boolean = false;

    constructor() {
        try {
            this.connector = new DBus.GfxMode("org-asuslinux-gfx-2.0.5");
        } catch {
            Log.error(`GfxMode client initialization failed!`);
        }
    }

    start() {
        Log.info(`Starting GfxMode client...`);

        try {
            this.connector.start();
            this.connected = true;
        } catch {
            Log.error(`GfxMode client start failed!`);
        }
    }

    stop() {
        Log.info(`Stopping GfxMode client...`);

        if (this.connected) {
            this.connected = false;
            this.connector.stop();
        }
    }
}
