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
    profileDesc: [] = [];

    constructor() {
      this.xml = Resources.File.DBus('net.hadess.PowerProfiles');
    }

    isRunning(): boolean {
      return this.connected;
    }

    public getProfileNames() {
      if (this.isRunning()) {
          try {
              // no clue at the moment how to parse the profiles of type aa{sv}
              this.profileDesc = this.powerProfilesProxy.Profiles;
              if (this.profileDesc.length > 0){
                for (const [_key, value] of Object.entries(this.profileDesc)) {
                  Log.info(_key.toString());
                  Log.info(JSON.stringify(value));
                }
              }
              
          } catch (e) {
              Log.error(`Power Profile DBus getting power profile names failed!`, e);
          }
      }
      return this.profileDesc;
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

            this.getProfileNames();
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
