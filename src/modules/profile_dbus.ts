declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;

export class Profile implements IStoppableModule {
    powerProfilesProxy: any = null; // type: Gio.DbusProxy (donno how to add)
    powerProfilesSignalProxy: any = null; // type: Gio.DbusProxy (donno how to add)
    connectedPPD: boolean = false;
    lastState: string | null = null;
    profiles: any[number] = [];

    constructor() {
        // nothing for now
    }

    public getProfileNames() {
        if (this.isRunning()) {
            try {
                let _profiles = this.powerProfilesProxy.Profiles;
                if (_profiles.length > 0){
                    for (const [_key, value] of Object.entries(_profiles)) {
                        this.profiles[parseInt(_key)] = {
                            //@ts-ignore
                            'Profile': value.Profile.unpack(),
                            //@ts-ignore
                            'Driver':  value.Driver.unpack()
                        }

                        //@ts-ignore
                        Log.debug(`Fetched Power Profile: ${value.Profile.unpack()}`);
                    }
                }
            } catch (e) {
                Log.error(`Power Profiles: failed to fetch profile names!`, e);
            }
        }

        return this.profiles;
    }

    public setProfile(mode: string) {
        if (this.isRunning()) {
            try {
                this.powerProfilesProxy.ActiveProfile = mode;

                // when the signals work again, this has to be removed
                this.updateProfile(mode);

                return true;
            } catch (e) {
                Log.error(`Profile DBus set power profile failed!`, e);

                return false;
            }
        }
    }

    //@ts-ignore
    public setProfileFromSignal(name: string = '', variant: any, profile: String[] = []){
        if (this.isRunning()) {
            try {
                if (profile.length > 0){
                    for (const [_key, value] of Object.entries(profile)) {
                        if (typeof value == 'object'){
                            for (const [_keyInner, valueInner] of Object.entries(value)) {
                                if (_keyInner == 'ActiveProfile'){
                                    // Glib.variant here, see https://gjs.guide/guides/glib/gvariant.html#basic-usage
                                    //@ts-ignore
                                    let currentProfile = valueInner.print(true);
                                    currentProfile = currentProfile.replaceAll("'", '');
                                    
                                    this.updateProfile(currentProfile);

                                    return true;
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                Log.error(`Power Profiles: failed to fetch profile names!`, e);

                return false;
            }
        }
    }

    updateProfile(curState: string | null = null) {
        //@ts-ignore
        Log.debug(curState);

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
        return this.connectedPPD;
    }

    async start() {
        try {
            // creating the proxy
            let xmlProfiles = Resources.File.DBus('net.hadess.PowerProfiles-0.10.1');
            this.powerProfilesProxy = new Gio.DBusProxy.makeProxyWrapper(xmlProfiles)(
                Gio.DBus.system,
                'net.hadess.PowerProfiles',
                '/net/hadess/PowerProfiles'
            );

            let xmlSignals = Resources.File.DBus('net.hadess.PowerProfilesSignals-0.10.1');
            this.powerProfilesSignalProxy = new Gio.DBusProxy.makeProxyWrapper(xmlSignals)(
                Gio.DBus.system,
                'org.freedesktop.DBus.Properties',
                '/net/hadess/PowerProfiles'
            );

            this.connectedPPD = true;   

            this.getProfileNames(); 

            this.updateProfile(await this.powerProfilesProxy.ActiveProfile);

            // connecting to EP signal (and do parsing on callback)
            this.powerProfilesSignalProxy.connectSignal(
                "PropertiesChanged",
                (name: string = '', variant: any, profile: String[]) => {
                    // if (proxy) {
                    //     this.setProfileFromSignal(name, variant, profile);
                    // }
                    this.setProfileFromSignal(name, variant, profile);
                }
            );

            Log.debug(`Power Profiles Daemon client started successfully.`);
        } catch (e) {
            Log.error(`Power Profile DBus initialization failed!`, e);
        }
    }

    stop() {
        Log.debug(`Stopping Profile DBus client...`);

        if (this.isRunning()) {
            this.connectedPPD = false;
            this.powerProfilesProxy = null;
            this.powerProfilesSignalProxy = null;
            this.lastState = null;
        }
    }
}