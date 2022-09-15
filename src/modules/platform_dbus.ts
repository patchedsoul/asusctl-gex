declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const {Gio} = imports.gi;

export class Platform implements IStoppableModule {
    asusLinuxProxy: any = null; // type: Gio.DbusProxy
    connected: boolean = false;
    lastStatePostBootSound: boolean = false;
    lastStateOverdrive: boolean = false;

    constructor() {
        // nothing for now
    }
    
    public getPostBootSound() {
        if (this.isRunning()) {
            try {
                let currentState = this.asusLinuxProxy.PostBootSoundSync();
                
                return parseInt(currentState) == 1 ? true : false;
            } catch (e) {
                Log.error(`Failed to get POST Boot Sound state!`, e);
            }
        }

        return this.lastStatePostBootSound;
    }

    public setPostBootSound(state: boolean) {
        if (this.isRunning()) {
            try {
                if (state !== this.lastStatePostBootSound) {
                    this.lastStatePostBootSound = state;
                }
                
                return this.asusLinuxProxy.SetPostBootSoundSync(state);
            } catch (e) {
                Log.error(`Platform DBus set Post Boot Sound failed!`, e);
            }
        }
    }


    public getOverdrive() {
        if (this.isRunning()) {
            try {
                let currentState = this.asusLinuxProxy.PanelOverdriveSync();
                
                return parseInt(currentState) == 1 ? true : false;
            } catch (e) {
                Log.error(`Failed to get Overdrive state!`, e);
            }
        }

        return this.lastStateOverdrive;
    }

    public setOverdrive(state: boolean) {
        if (this.isRunning()) {
            try {
                if (state !== this.lastStateOverdrive) {
                    this.lastStateOverdrive = state;
                }
                
                return this.asusLinuxProxy.SetPanelOverdriveSync(state);
            } catch (e) {
                Log.error(`Overdrive DBus set overdrive state failed!`, e);
            }
        }
    }

    isRunning(): boolean {
        return this.connected;
    }

    async start() {
        Log.debug(`Starting Platform DBus module...`);

        try {
            let xml = Resources.File.DBus('org-asuslinus-platform-4')
            this.asusLinuxProxy = new Gio.DBusProxy.makeProxyWrapper(xml)(
                Gio.DBus.system,
                'org.asuslinux.Daemon',
                '/org/asuslinux/Platform'
            );

            this.connected = true;
            
            if (ext.supported.connector.supportedAttributes.bios_toggleSound) {
                this.lastStatePostBootSound = this.getPostBootSound();
                this.asusLinuxProxy.connectSignal(
                    "NotifyPostBootSound",
                    (proxy: any = null, _name: string, data: boolean) => {
                        if(proxy){
                            Log.debug(`PostBootSound changed to ${data}`);
                            ext.Platform.switchPostBootSound.setToggleState(this.lastStatePostBootSound);
                        }
                    }
                );
            }
                
            if (ext.supported.connector.supportedAttributes.bios_overdrive) {
                this.lastStateOverdrive = this.getOverdrive();
                this.asusLinuxProxy.connectSignal(
                    "NotifyPanelOverdrive",
                    (proxy: any = null, _name: string, data: boolean) => {
                        if (proxy) {
                            Log.debug(`Overdrive has changed to ${data}.`);
                            ext.Platform.overdriveSwitch.setToggleState(this.lastStateOverdrive);
                        }
                    }
                );
            }
        } catch (e) {
            Log.error(`Overdrive DBus init failed!`, e);
        }
    }

    stop() {
        Log.debug(`Stopping Overdrive DBus module...`);

        if(this.isRunning()){
            this.connected = false;
            this.asusLinuxProxy = null;
            this.lastStatePostBootSound = false;
            this.lastStateOverdrive = false;
        }
    }
}