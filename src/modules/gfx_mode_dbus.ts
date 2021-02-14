declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;
const Main = imports.ui.main;

export class GfxMode implements IStoppableModule {
    asusLinuxProxy: any = null;
    connected: boolean = false;
    lastState: string = '';
    xml: string;

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
            return `${this.asusLinuxProxy.SetVendorSync(mode)}`;
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
            
            Log.info(`Initial GfxMode is ${vendor} ${power}`);
            try {
                Panel.Actions.updateMode('gfx-mode', vendor, power);
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
                        this.lastState = value;

                        // notify and change icon
                        // todo: implement me
                        let msg = `The GfxMode changed, new GfxMode is ${value}`;
                        if (value == 'reboot'){
                            msg = 'The GfxMode changed, please reboot to apply the changes.';
                        } else if (value == 'restartx') {
                            msg = 'The GfxMode changed, please restart your display manager to apply the changes.';
                        }

                        Panel.Actions.notify(
                            Panel.Title,
                            msg,
                            'system-reboot-symbolic',
                            value
                        );

                        Main.panel.statusArea['asus-nb-gex.panel'].style_class = 'panel-icon '+value;
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
