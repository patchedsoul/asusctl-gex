declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
// todo: implement me
import * as Panel from './panel';
//import * as GfxModeBase from './gfx_mode';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;

export class GfxMode implements IStoppableModule {
    asusLinuxProxy: any = null;
    connected: boolean = false;
    lastState: number = -1;
    xml: string;

    constructor(xml: string) {
        this.xml = Resources.File.DBus(xml);
    }

    public getCurrentMode() {
        if (this.connected)
            return `${this.asusLinuxProxy.VendorSync()}`;
    }

    start() {
        Log.info(`Starting GfxMode DBus client...`);

        try {
            // creating the proxy
            let _asusLinuxProxy = Gio.DBusProxy.makeProxyWrapper(this.xml);
            this.asusLinuxProxy = new _asusLinuxProxy(
                Gio.DBus.system,
                "org.asuslinux.Daemon",
                "/org/asuslinux/Gfx"
            );
            this.connected = true;
        } catch {
            Log.error("GfxMode DBus initialization failed!");
        }


        if (this.connected) {
            let vendor = this.asusLinuxProxy.VendorSync().toString().trim();
            let power = this.asusLinuxProxy.PowerSync().toString().trim();
            // getting initial fan-mode
            //this.lastState = this.asusLinuxProxy.PowerSync();
            Log.info(`Initial GfxMode is ${vendor} ${power}`);
            try {
                // todo: implement me
                // Panel.Actions.notify();
                Panel.Actions.updateGfxMode(vendor, power);
            } catch (e) {
                Log.error(e);
            }

            // connect to Gfx
            this.asusLinuxProxy.connectSignal(
                "NotifyAction",
                (proxy_: any = null, name_: string, value: any) => {
                    if (proxy_) {
                        Log.info(`[dbus${name_}]: The GfxMode changed, new GfxMode is ${value}`);

                        // update state
                        //this.lastState = value;

                        // notify and change icon
                        // todo: implement me
                        // Panel.Actions.notify();
                    }
                });
        }
    }

    stop() {
        Log.info(`Stopping GfxMode DBus client...`);

        if (this.connected) {
            this.connected = false;
            this.asusLinuxProxy = null;
        }
    }
}
