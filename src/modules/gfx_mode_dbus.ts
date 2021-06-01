declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

export class GfxMode implements IStoppableModule {
    asusLinuxProxy: any = null;
    connected: boolean = false;
    lastState: number = 4;
    lastStatePower: number = 3;
    xml: string;
    public gfxLabels: any = {
        0: 'nvidia',
        1: 'integrated',
        2: 'compute',
        3: 'vfio',
        4: 'hybrid',
    };
    public powerLabel: any = {
        0: 'active',
        1: 'suspended',
        2: 'off',
        3: 'unknown'
    };
    public userAction: any = {
        0: 'logout',
        1: 'reboot',
        2: 'none'
    };
    timeoutPollerGpuPower: any = null;

    constructor(xml: string) {
        this.xml = Resources.File.DBus(xml);
    }

    public getGfxMode() {
        let currentMode:any = false;

        if (this.connected) {
            try {
                currentMode = this.asusLinuxProxy.VendorSync();
            } catch(e) {
                Log.error('Graphics Mode DBus: get current mode failed!');
                Log.error(e);
            }
        }

        if (currentMode !== this.lastState) this.lastState = currentMode;

        return currentMode;
    }

    public setGfxMode(mode: number) {
        let newMode:any = false;

        if (this.connected){
            try {
                newMode = this.asusLinuxProxy.SetVendorSync(mode);

                if (newMode !== this.lastState) this.lastState = newMode;

                return newMode;
            } catch(e) {
                Log.error('Graphics Mode DBus switching failed!');
                Log.error(e);
                return false;
            }
        }
    }

    public getGpuPower(){
        let modePower:number = 9;

        if (this.connected){
            try {
                modePower = this.asusLinuxProxy.PowerSync().toString().trim();
            } catch(e) {
                Log.error('Graphics Mode DBus getting power mode failed!');
                Log.error(e);
            }
        }

        return modePower;
    }

    updatePanelPower(gpuPowerLocal: number){
        if (gpuPowerLocal !== this.lastStatePower) {

            Log.info(`Graphics Mode DBus power mode changed: ${this.powerLabel[gpuPowerLocal]}/${gpuPowerLocal}`);

            this.lastStatePower = gpuPowerLocal;

            Panel.Actions.updateMode('gpupower', this.powerLabel[gpuPowerLocal]);

            // if integrated and active show notification
            if (gpuPowerLocal == 0 && this.lastState == 1){
                Panel.Actions.notify(
                    Panel.Title,
                    `Your dedicated GPU turned on while you are on the integrated mode. This should not happen. It could be that another application rescanned your PCI bus. Rebooting is advised.`,
                    'gif/fire.gif',
                    'reboot'
                );
            }
        }
    }

    pollerGpuPower() {
        if(this.connected){
            try {
                let gpuPowerLocal = this.getGpuPower();

                if (gpuPowerLocal !== this.lastStatePower){
                    this.updatePanelPower(gpuPowerLocal);
                }
            } catch (e){
                Log.error(`Graphics Mode DBus power mode poller init failed!`);
                Log.error(e);
            } finally {
                return this.connected ? GLib.SOURCE_CONTINUE : GLib.SOURCE_REMOVE;
            }
        } else {
            return GLib.SOURCE_REMOVE;
        }
    }

    start() {
        Log.info(`Starting Graphics Mode DBus client...`);

        try {
            // creating the proxy
            let _asusLinuxProxy = Gio.DBusProxy.makeProxyWrapper(this.xml);
            this.asusLinuxProxy = new _asusLinuxProxy(
                Gio.DBus.system,
                'org.asuslinux.Daemon',
                '/org/asuslinux/Gfx'
            );
            this.connected = true;
        } catch(e) {
            Log.error('Graphics Mode DBus initialization failed!');
            Log.error(e);
        }

        if (this.connected) {
            let vendor = this.asusLinuxProxy.VendorSync().toString().trim();
            let power = this.asusLinuxProxy.PowerSync().toString().trim();
            
            Log.info(`Initial Graphics Mode is ${this.gfxLabels[vendor]}. Power State at the moment is ${this.powerLabel[power]}${(power == 0 ? " (this can change on hybrid and compute mode)" : "")}`);

            Panel.Actions.updateMode('gfx-mode', vendor);

            // connect NotifyAction
            this.asusLinuxProxy.connectSignal(
                "NotifyAction",
                (proxy_: any = null, name_: string, value: number) => {
                    if (proxy_) {

                        Log.info(`[dbus${name_}]: Graphics Mode has changed.`);

                        let newMode = this.asusLinuxProxy.VendorSync();

                        if (newMode !== this.lastState) this.lastState = newMode;

                        let msg = `Graphics Mode has changed.`;

                        if (this.userAction[value] !== 'none'){
                            msg = `Graphics Mode changed to ${this.gfxLabels[newMode]}. Please save your work and ${this.userAction[value]} to apply the changes.`;
                        }

                        Panel.Actions.updateMode('gfx-mode', this.gfxLabels[newMode]);

                        Panel.Actions.notify(
                            Panel.Title,
                            msg,
                            `scalable/notification-${this.userAction[value]}.svg`,
                            this.userAction[value]
                        );
                    }
                }
            );

            try {
                this.timeoutPollerGpuPower = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, this.pollerGpuPower.bind(this));
            } catch (e) {
                Log.error(`Graphics Mode DBus power mode Poller initialization failed!`);
                Log.error(e);
            }
        }
    }

    stop() {
        Log.info(`Stopping GfxMode DBus client...`);

        if (this.connected) {
            this.connected = false;
            this.asusLinuxProxy = null;
            this.timeoutPollerGpuPower = null;
        }
    }
}
