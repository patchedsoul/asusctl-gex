declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const {Gio, GLib} = imports.gi;

export class GfxMode implements IStoppableModule {
    asusLinuxProxy: any = null; // strict-type: Gio.DBusProxy
    connected: boolean = false;
    lastState: number = 5;
    lastStatePower: number = 3;
    pollerDelayTicks: number = 0;
    timeoutPollerGpuPower: number | null = null;

    // no need to use Record<number, string> (as this are string arrays)
    public gfxLabels: string[]  = ['hybrid', 'dedicated', 'integrated', 'compute', 'vfio', 'egpu', 'unknown'];
    public powerLabel: string[] = ['active', 'suspended', 'off', 'unknown'];
    public userAction: string[] = ['logout', 'reboot', 'integrated', 'none'];

    // new feature of "access" lists.. (everytuple represents the accesslevel to a gfxLabel based on it's index)
    public acls: boolean[][] = [
        // access branches:
        // [hybrid, dedicated, integrated, compute, vfio, egpu]
        [true, true, true, false, false, true],   // hybrid
        [true, true, true, false, false, true],   // dedicated
        [true, true, true, true, true, true],     // integrated
        [true, false, true, true, true, false],   // compute
        [true, false, true, true, true, false],   // vfio
        [true, true, true, true, true, true],   // egpu
    ];

    constructor() {
        // nothing for now
    }

    public getGfxMode(): number | null {
        if (this.isRunning()) {
            try {
                this.lastState = parseInt(this.asusLinuxProxy.VendorSync());
                return this.lastState;
            } catch(e) {
                Log.error('Graphics Mode DBus: get current mode failed!', e);
            }
        }
        return null;
    }

    public setGfxMode(mode: number) {
        if (this.isRunning()){
            try {
                // the proxy will return the required user action. Since it is also
                // given in the notification we can ignore it here
                this.asusLinuxProxy.SetVendorSync(mode);
            } catch(e) {
                Log.error('Graphics Mode DBus switching failed!', e);
                // TODO: match on 'Can not switch to vfio mode if disabled in config file'
                //  and show a warning notification
            }
        }
    }

    public getGpuPower(){
        let modePower = 9;
        if (this.connected){
            try {
                modePower = parseInt(this.asusLinuxProxy.PowerSync().toString().trim());
            } catch(e) {
                Log.error('Graphics Mode DBus getting power mode failed!', e);
            }
        }

        return modePower;
    }

    public getAcl(ven: number, idx: number) {
        try {
            return this.acls[ven][idx]; // current acl (vendor:index)
        } catch {
            return false;
        }
    }

    updatePanelPower(gpuPowerLocal: number) {
        if (gpuPowerLocal !== this.lastStatePower) {
            this.lastStatePower = gpuPowerLocal;
            Log.debug(`Graphics Mode DBus power mode changed: ${this.powerLabel[gpuPowerLocal]}/${gpuPowerLocal}`);

            Panel.Actions.updateMode('gpupower', this.powerLabel[gpuPowerLocal]);

            // if integrated and active show notification
            if (gpuPowerLocal == 0 && this.lastState == 1) {
                // let's check the vendor
                try {
                    let vendor = parseInt(this.asusLinuxProxy.VendorSync());
                    if(vendor == 1)
                        Panel.Actions.notify(
                            Panel.Title,
                            `Your dedicated GPU turned on while you are on the integrated mode. This should not happen. It could be that another application rescanned your PCI bus. Rebooting is advised.`,
                            'gif/fire.gif',
                            'reboot'
                        );
                    else if (this.lastState !== vendor)
                        this.lastState = vendor;
                } catch (e) {
                    Log.error('Graphics Mode DBus getting vendor failed!', e);
                }
            }
        }
    }

    pollerGpuPower() {
        if(this.isRunning() && this.pollerDelayTicks <= 0){
            try {
                this.updatePanelPower(this.getGpuPower());
            } catch (e) {
                Log.error(`Graphics Mode DBus power mode poller init failed!`, e);
            } finally {
                return this.isRunning() ? GLib.SOURCE_CONTINUE : GLib.SOURCE_REMOVE;
            }
        } else if (this.isRunning() && this.pollerDelayTicks > 0) {
            this.pollerDelayTicks--;
            return GLib.SOURCE_CONTINUE;
        } else {
            return GLib.SOURCE_REMOVE;
        }
    }

    isRunning(): boolean {
        return this.connected;
    }

    start() {
        Log.debug(`Starting Graphics Mode DBus client...`);

        try {
            let xml = Resources.File.DBus('org-supergfxctl-gfx');
            this.asusLinuxProxy = new Gio.DBusProxy.makeProxyWrapper(xml)(
                Gio.DBus.system,
                'org.supergfxctl.Daemon',
                '/org/supergfxctl/Gfx'
            );
            this.lastState = this.asusLinuxProxy.VendorSync();
            this.connected = true;
            Log.debug('Graphics Mode DBus initialization successful (using supergfxctl!');
        } catch (e) {
            Log.error('Graphics Mode DBus initialization using supergfxctl failed!', e);
        }

        if (this.connected) {
            let power = parseInt(this.asusLinuxProxy.PowerSync());
            
            Log.debug(`Initial Graphics Mode is ${this.gfxLabels[this.lastState]}. Power State at the moment is ${this.powerLabel[power]}${(power == 0 ? " (this can change on hybrid and compute mode)" : "")}`);

            Panel.Actions.updateMode('gfx-mode', this.gfxLabels[this.lastState]);

            // connect NotifyAction
            this.asusLinuxProxy.connectSignal(
                "NotifyAction",
                (proxy: any = null, name: string, value: number) => {
                    if (proxy) {
                        Log.info(`[dbus${name}]: Graphics Mode has changed.`);

                        let newMode = parseInt(this.asusLinuxProxy.VendorSync());

                        let msg = `Graphics Mode has changed.`;

                        if (this.userAction[value] === 'integrated'){
                            msg = `You must switch to Integrated mode before switching to Compute or VFIO.`;
                            newMode = this.lastState;
                        } else if (this.userAction[value] !== 'none'){
                            msg = `Graphics Mode changed. Please save your work and ${this.userAction[value]} to apply the changes.`;
                            if (newMode !== this.lastState) this.lastState = newMode;
                        } else {
                            if (newMode !== this.lastState){
                                msg = `Graphics Mode changed to ${this.gfxLabels[newMode]}`;
                                this.lastState = newMode;
                            }
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
                Log.error(`Graphics Mode DBus power mode Poller initialization failed!`, e);
            }

            return true;
        }

        return false;
    }

    stop() {
        Log.debug(`Stopping GfxMode DBus client...`);

        if (this.connected) {
            this.connected = false;
            this.asusLinuxProxy = null;
            GLib.Source.remove(this.timeoutPollerGpuPower);
            this.timeoutPollerGpuPower = null;
        }
    }
}
