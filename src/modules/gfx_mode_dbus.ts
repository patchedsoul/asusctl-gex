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
    public gfxLabels: Record<number, string> = {
        0: 'nvidia',
        1: 'integrated',
        2: 'compute',
        3: 'vfio',
        4: 'hybrid',
    };
    public powerLabel: Record<number, string> = {
        0: 'active',
        1: 'suspended',
        2: 'off',
        3: 'unknown'
    };
    public userAction: Record<number, string> = {
        0: 'logout',
        1: 'reboot',
        2: 'integrated',
        3: 'none'
    };
    timeoutPollerGpuPower: any = null;

    constructor(xml: string) {
        this.xml = Resources.File.DBus(xml);
    }

    public getGfxMode() {
        if (this.connected) {
            try {
                let currentMode = parseInt(this.asusLinuxProxy.VendorSync());
                this.lastState = currentMode;
                return currentMode;
            } catch(e) {
                Log.error('Graphics Mode DBus: get current mode failed!');
                Log.error(e);
            }
        }
    }

    public setGfxMode(mode: number) {
        if (this.connected){
            try {
                // the proxy will return the required user action. Since it is also
                // given in the notification we can ignore it here
                this.asusLinuxProxy.SetVendorSync(mode);
            } catch(e) {
                Log.error('Graphics Mode DBus switching failed!');
                Log.error(e);
                // TODO: match on 'Can not switch to vfio mode if disabled in config file'
                //  and show a warning notification
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
            let vendor = parseInt(this.asusLinuxProxy.VendorSync());
            let power = parseInt(this.asusLinuxProxy.PowerSync());
            
            Log.info(`Initial Graphics Mode is ${this.gfxLabels[vendor]}. Power State at the moment is ${this.powerLabel[power]}${(power == 0 ? " (this can change on hybrid and compute mode)" : "")}`);

            Panel.Actions.updateMode('gfx-mode', this.gfxLabels[vendor]);
            this.lastState = vendor;

            // connect NotifyAction
            this.asusLinuxProxy.connectSignal(
                "NotifyAction",
                (proxy_: any = null, name_: string, value: number) => {
                    if (proxy_) {
                        Log.info(`[dbus${name_}]: Graphics Mode has changed.`);

                        let newMode = this.asusLinuxProxy.VendorSync();
                        let msg = `Graphics Mode has changed.`;

                        if (this.userAction[value] === 'integrated'){
                            msg = `You must switch to Integrated mode before switching to Compute or VFIO.`;
                            newMode = this.lastState;
                        } else if (this.userAction[value] !== 'none'){
                            msg = `Graphics Mode changed to ${this.gfxLabels[newMode]}. Please save your work and ${this.userAction[value]} to apply the changes.`;
                            // do state update only if not none or integrated
                            if (newMode !== this.lastState) this.lastState = newMode;
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
