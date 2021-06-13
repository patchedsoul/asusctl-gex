declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;

// this type should be used as ProfileData (strictly typed)
export type ProfileData = {
    name: string | null,        // String
    min: number,                // u8
    max: number,                // u8
    turbo: boolean,             // bool
    fan: number,                // FanLevel
    curve: string | null        // String
};

export class Profile implements IStoppableModule {
    asusLinuxProxy: any = null; // type: Gio.DbusProxy (donno how to add)
    connected: boolean = false;
    lastState: string | null = null;
    xml: string | null = null;
    profileDesc: string[] = [];

    constructor(xml: string | null = null) {
        if (xml)
            this.xml = Resources.File.DBus(xml);
    }

    public getProfileNames() {
        if (this.isRunning()) {
            try {
                this.profileDesc = this.asusLinuxProxy.ProfileNamesSync().toString().trim().split(',');
                Log.info(`Profile DBus got power profiles: ${this.profileDesc.join(', ')}`);
            } catch (e) {
                Log.error(`Profile DBus getting power profile names failed!`, e);
            }
        }
        return this.profileDesc;
    }

    public setProfile(mode: string) {
        if (this.isRunning()) {
            try {
                return this.asusLinuxProxy.SetProfileSync(mode);
            } catch (e) {
                Log.error(`Profile DBus set power profile failed!`, e);
            }
        }
    }

    updateProfile(curState: string | null = null) {
        if (curState && curState !== '' && this.lastState !== curState) {
            let message = `Power profile has changed to ${curState}`;

            if (this.lastState !== null) {
                Panel.Actions.notify(
                    Panel.Title,
                    message,
                    `scalable/notification-${curState}.svg`
                );
            }

            // update state
            this.lastState = curState;

            // updating panel popup-menulist
            Panel.Actions.updateMode('fan-mode', curState);
        }
    }

    isRunning(): boolean {
        return this.connected;
    }

    async start() {
        Log.info(`Starting Profile DBus client...`);
        if (this.xml == null) {
            Log.error('Starting Profile DBus initialization failed, no xml given!');
            return;
        }

        try {
            // creating the proxy
            this.asusLinuxProxy = new Gio.DBusProxy.makeProxyWrapper(this.xml)(
                Gio.DBus.system,
                'org.asuslinux.Daemon',
                '/org/asuslinux/Profile'
            );

            this.connected = true;
            this.getProfileNames();            

            // connecting to EP signal (and do parsing on callback)
            this.asusLinuxProxy.connectSignal(
                "NotifyProfile",
                (proxy: any = null, name: string, data: object) => {
                    if (proxy) {
                        let profile: ProfileData = { name: null, min: 0, max: 100, turbo: true, fan: 1, curve: null };
                        
                        for (const [_key, value] of Object.entries(data)) {
                            value.forEach((element:any, index:number) => {
                                switch(index) {
                                    case 0: // name
                                        profile.name = element.toString().trim(); break;
                                    case 1: // min
                                        profile.min = parseInt(element); break;
                                    case 2: // max
                                        profile.max = parseInt(element); break;
                                    case 3: // turbo
                                        profile.turbo = (/true/i).test(element.toString().toLowerCase().trim()); break;
                                    case 4: // fan
                                        profile.fan = parseInt(element); break;
                                    case 5: // curve
                                        profile.curve = element.toString().trim(); break;
                                }
                            });
                        }
                        
                        // TODO: check if that is correct, might need comparsion to last profilename
                        if (profile.name && profile.name !== '') {
                            this.updateProfile(profile.name);
                            Log.info(`[dbus${name}]: The profile has changed to ${profile.name}`);
                        } else {
                            Log.error(`[dbus${name}]: The profile has not been changed: no profile name given.`);
                        }
                    }
                }
            );
            this.updateProfile(await this.asusLinuxProxy.ActiveNameSync().toString().trim());
        } catch (e) {
            Log.error(`Profile DBus initialization failed!`, e);
        }
    }

    stop() {
        Log.info(`Stopping Profile DBus client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.asusLinuxProxy = null;
            this.lastState = null;
        }
    }
}