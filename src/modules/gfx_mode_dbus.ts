declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;

export class GfxMode implements IStoppableModule {
    asusLinuxProxy: any = null;
    connected: boolean = false;
    lastState: string = '';
    xml: string;
    userAction: any = {
        0: 'logout',
        1: 'reboot',
        2: 'none'
    };

    constructor(xml: string) {
        this.xml = Resources.File.DBus(xml);
    }

    public getGfxMode() {
        if (this.connected)
            return `${this.asusLinuxProxy.VendorSync()}`;
    }

    public setGfxMode(mode: string) {
        if (this.connected)
            Log.info('setting '+mode);
            return this.asusLinuxProxy.SetVendorSync(mode);
    }

    start() {
        Log.info(`Starting Graphics Mode DBus client...`);

        try {
            // creating the proxy
            let _asusLinuxProxy = Gio.DBusProxy.makeProxyWrapper(this.xml);
            this.asusLinuxProxy = new _asusLinuxProxy(
                Gio.DBus.system,
                "org.asuslinux.Daemon",
                "/org/asuslinux/Gfx"
            );
            this.connected = true;
        } catch(e) {
            Log.error("Graphics Mode DBus initialization failed!");
            Log.error(e);
        }

        if (this.connected) {
            let vendor = this.asusLinuxProxy.VendorSync().toString().trim();
            let power = this.asusLinuxProxy.PowerSync().toString().trim();
            
            Log.info(`Initial Graphics Mode is ${vendor} ${power}`);
            try {
                Panel.Actions.updateMode('gfx-mode', vendor, power);
            } catch (e) {
                Log.error(e);
            }

            // connect to Gfx
            this.asusLinuxProxy.connectSignal(
                "NotifyAction",
                (proxy_: any = null, name_: string, value: number) => {
                    if (proxy_) {

                        Log.info(`[dbus${name_}]: The Graphics Mode has changed.`);
                        // Log.info(`${value}`);

                        let msg = `The Graphics Mode has changed.`;
                        if (value !== 2){
                            msg = `The Graphics Mode has changed. Please ${this.userAction[value]} to apply the changes.`;
                        }

                        Panel.Actions.notify(
                            Panel.Title,
                            msg,
                            'system-reboot-symbolic',
                            this.userAction[value],
                            this.userAction[value]
                        );
                    }
                }
            );
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
