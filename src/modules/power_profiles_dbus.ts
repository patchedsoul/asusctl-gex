declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;
// const GLib = imports.gi.GLib;

export class PowerProfiles implements IStoppableModule {
    powerProfilesProxy: any = null; // strict-type: Gio.DBusProxy
    connected: boolean = false;
    lastState: string = '';
    xml: string | null = null;

    constructor() {
      this.xml = Resources.File.DBus('net.hadess.PowerProfiles');
    }

    isRunning(): boolean {
      return this.connected;
    }

    start() {
        Log.info(`Starting Power Profiles DBus client...`);

        try {
            // creating the proxy
            let _powerProfilesProxy = Gio.DBusProxy.makeProxyWrapper(this.xml);
            this.powerProfilesProxy = new _powerProfilesProxy(
                Gio.DBus.system,
                'net.hadess.PowerProfiles',
                '/net/hadess/PowerProfiles'
            );
            this.connected = true;
        } catch(e) {
            Log.error('Power Profiles DBus initialization failed!', e);
        }
    }

    stop() {
        Log.info(`Stopping Power Profiles DBus client...`);

        if (this.connected) {
            this.connected = false;
            this.powerProfilesProxy = null;
        }
    }
}
