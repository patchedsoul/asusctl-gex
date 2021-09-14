declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;

export class Profile implements IStoppableModule {
    asusLinuxProxy: any = null; // type: Gio.DbusProxy (donno how to add)
    powerProfilesProxy: any = null; // type: Gio.DbusProxy (donno how to add)
    connectedPPD: boolean = false;
    connectedASUSD: boolean = false;
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
                        Log.info(`Fetched Power Profile: ${value.Profile.unpack()}`);
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
        return this.connectedPPD;
    }

    async start() {
        try {
            // creating the proxy
            let xml = Resources.File.DBus('net.hadess.PowerProfiles-0.9.0');
            this.powerProfilesProxy = new Gio.DBusProxy.makeProxyWrapper(xml)(
                Gio.DBus.system,
                'net.hadess.PowerProfiles',
                '/net/hadess/PowerProfiles'
            );

            this.connectedPPD = true;
            this.getProfileNames(); 

            this.updateProfile(await this.powerProfilesProxy.ActiveProfile);

            // connecting to EP signal (and do parsing on callback)
            this.powerProfilesProxy.connectSignal(
                "ProfileReleased",
                (proxy: any = null, profile: number) => {
                    if (proxy) {
                        Log.info('Signal NotifyProfile triggered.');
                        Log.info(profile.toString());
                    }
                }
            );

            Log.info(`Power Profiles Daemon client started successfully.`);
        } catch (e) {
            Log.error(`Power Profile DBus initialization failed!`, e);
        }

        // TO HAVE A LOOK
        // haven't been able to react on profile switching from power profiles DBUS
        // trying to register the signal from asusd but it does not seem to fire either
        try {
            let xml = Resources.File.DBus('org-asuslinux-profile-4');
            this.asusLinuxProxy = new Gio.DBusProxy.makeProxyWrapper(xml)(
                Gio.DBus.system,
                'org.asuslinux.Daemon',
                '/org/asuslinux/Profile'
            );

            this.connectedASUSD = true;

            // connecting to EP signal (and do parsing on callback)
            this.asusLinuxProxy.connectSignal(
                "NotifyProfile",
                (proxy: any = null, name: string, data: object) => {
                    if (proxy) {
                        Log.info('Signal NotifyProfile triggered.');
                        Log.info(name.toString());
                        Log.info(data.toString());
                    }
                }
            );

            Log.info(`asusctl Profiles Daemon client started successfully.`);
        } catch (e) {
            Log.error(`asusctl Profile DBus initialization failed!`, e);
        }
    }

    stop() {
        Log.info(`Stopping Profile DBus client...`);

        if (this.isRunning()) {
            this.connectedPPD = false;
            this.connectedASUSD = false;
            this.powerProfilesProxy = null;
            this.asusLinuxProxy = null;
            this.lastState = null;
        }
    }
}