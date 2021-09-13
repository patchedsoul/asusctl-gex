declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;

export class ChargingLimit implements IStoppableModule {
    asusLinuxProxy: any = null; // type: Gio.DbusProxy (donno how to add)
    connected: boolean = false;
    lastState: number = 100;
    xml: string | null = null;

    constructor(xml: string | null = null) {
        if (xml)
            this.xml = Resources.File.DBus(xml);
    }

    public getChargingLimit() {
        if (this.isRunning()) {
            try {
                this.lastState = this.asusLinuxProxy.LimitSync().toString().trim();
                Log.info(`New Charging Limit: ${this.lastState} %`);
            } catch (e) {
                Log.error(`Failed to fetch Charging Limit!`, e);
            }
        }

        return this.lastState;
    }

    public setChargingLimit(limit: number) {
        if (this.isRunning()) {
            try {
                if (limit > 0 && this.lastState !== limit) {
                    ext.chargingLimit.chargingLimitSlider.value = limit/100;
                    ext.chargingLimit.chargeLimitLabel.set_text(`${limit}%`);
        
                    // update state
                    this.lastState = limit;
                }
                return this.asusLinuxProxy.SetLimitSync(limit);
            } catch (e) {
                Log.error(`Profile DBus set power profile failed!`, e);
            }
        }
    }

    updateChargingLimit(curState: number) {
        if (curState > 0 && this.lastState !== curState) {
            ext.chargingLimit.chargingLimitSlider.value = curState/100;
            ext.chargingLimit.chargeLimitLabel.set_text(`${curState}%`);

            // update state
            this.lastState = curState;
        }
    }

    isRunning(): boolean {
        return this.connected;
    }

    async start() {
        Log.info(`Starting Charging Limit DBus client...`);
        if (this.xml == null) {
            Log.error('Starting Charging Limit DBus initialization failed, no xml given!');
            return;
        }

        try {
            // creating the proxy
            this.asusLinuxProxy = new Gio.DBusProxy.makeProxyWrapper(this.xml)(
                Gio.DBus.system,
                'org.asuslinux.Daemon',
                '/org/asuslinux/Charge'
            );

            this.connected = true;
            this.getChargingLimit();            

            // connecting to EP signal (and do parsing on callback)
            this.asusLinuxProxy.connectSignal(
                "NotifyCharge",
                (proxy: any = null, name: string, data: string) => {
                    if (proxy) {
                        Log.info(`Charging Limit has changed to ${data}% (${name}).`);
                        this.updateChargingLimit(parseInt(data));
                    }
                }
            );
        } catch (e) {
            Log.error(`Charging Limit DBus initialization failed!`, e);
        }
    }

    stop() {
        Log.info(`Stopping Charging Limit DBus client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.asusLinuxProxy = null;
            this.lastState = 100;
        }
    }
}