declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as FanModeBase from './fanmode';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;

export class FanMode implements IStoppableModule {
    asusLinuxProxy: any = null;
    connected: boolean = false;
    lastState: number = -1;
    xml: string;

    constructor(xml: string) {
        this.xml = Resources.File.DBus(xml);
    }

    start() {
        Log.info(`Starting DBus client...`);

        try {
            // creating the proxy
            let _asusLinuxProxy = Gio.DBusProxy.makeProxyWrapper(this.xml);
            this.asusLinuxProxy = new _asusLinuxProxy(
                Gio.DBus.system,
                "org.asuslinux.Daemon",
                "/org/asuslinux/Daemon"
            );
            this.connected = true;
        } catch {
            Log.error("DBus initialization failed!");
        }


        if (this.connected) {
            // getting initial fan-mode
            this.lastState = this.asusLinuxProxy.GetFanModeSync();
            Log.info("Initial FanMode is " + this.lastState);
            try {
                Panel.Actions.notify(
                    Panel.Title,
                    `initial fan-mode: ${FanModeBase.FanModeDescr[this.lastState]}`,
                    FanModeBase.FanModeIcons[this.lastState],
                    FanModeBase.FanModeColor[this.lastState]
                );
            } catch (e) {
                Log.error(e);
            }

            // connect to fanmode
            this.asusLinuxProxy.connectSignal(
                "FanModeChanged",
                (proxy_: any = null, name_: string, value: any) => {
                    if (proxy_) {
                        Log.info(`[dbus${name_}]: The FanMode changed, new FanMode is ${value}`);

                        // update state
                        this.lastState = value;

                        // notify and change icon
                        Panel.Actions.notify(
                            Panel.Title,
                            `changed fan-mode: ${FanModeBase.FanModeDescr[value]}`,
                            FanModeBase.FanModeIcons[value],
                            FanModeBase.FanModeColor[value]
                        );
                    }
                });
        }
    }

    stop() {
        Log.info(`Stopping DBus client...`);

        if (this.connected) {
            this.connected = false;
            this.asusLinuxProxy = null;
        }
    }
}
