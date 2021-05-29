declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;
//const GLib = imports.gi.GLib;

export class Profile implements IStoppableModule {
    sourceId: any = null;       // needed for dbus workaround
    asusLinuxProxy: any = null;
    connected: boolean = false;
    lastState: string = '';
    xml: string;
    lockMonitor: any;
    lock: any;
    profileDesc = new Array();
    profileIcons: any = {
        'boost': 'rog-red',
        'normal': 'rog-yellow',
        'silent': 'rog-green'
    };
    profileColor: any = {
        'boost': 'red',
        'normal': 'yellow',
        'silent': 'green'
    }

    constructor(xml: string) {
        this.xml = Resources.File.DBus(xml);
    }

    public getProfileNames() {
        if (this.connected) {
            try {
                return this.asusLinuxProxy.ProfileNamesSync();
            } catch (e) {
                Log.error(`Profile DBus getting power profile names failed!`);
                Log.error(e);
            }
        }
    }

    public setProfile(mode: string) {
        if (this.connected) {
            try {
                return this.asusLinuxProxy.SetProfileSync(mode);
            } catch (e) {
                Log.error(`Profile DBus set power profile failed!`);
                Log.error(e);
            }
        }
    }

    updateProfile(curState: string) {
        if (curState !== '' && this.lastState !== curState) {
            let message = `${((this.lastState === '') ? 'initial' : 'changed')} profile: ${curState}`;

            // updating panel popup-menulist
            Panel.Actions.updateMode('fan-mode', curState);

            if (this.lastState !== '') {
                Panel.Actions.notify(
                    Panel.Title,
                    message,
                    curState
                );
            }

            ext.panelButton.indicator.style_class = `${ext.panelButton.indicator._defaultClasses} ${curState} ${ext.gfxMode.connector.gfxLabels[ext.gfxMode.connector.lastState]} ${ext.gfxMode.connector.powerLabel[ext.gfxMode.connector.lastStatePower]} ${ext.gfxMode.igpu}`;

            // Log.info(ext.panelButton.indicator.style_class);

            // update state
            this.lastState = curState;
        }
    }

    async start() {
        Log.info(`Starting Profile DBus client...`);

        try {
            // creating the proxy
            let _asusLinuxProxy = Gio.DBusProxy.makeProxyWrapper(this.xml);
            this.asusLinuxProxy = new _asusLinuxProxy(
                Gio.DBus.system,
                'org.asuslinux.Daemon',
                '/org/asuslinux/Profile'
            );

            this.connected = true;

            // This is the _data
            // string, byte, byte, bool, uint32, string
            // pub struct Profile {
            //     pub name: String,
            //     pub min_percentage: u8,
            //     pub max_percentage: u8,
            //     pub turbo: bool,
            //     pub fan_preset: FanLevel,
            //     pub fan_curve: String,
            // }
            // {name: string, _min: number, _max: number, _turbo: boolean, _fan: number, _curve: string}
            //
            // example return of data_: [["silent",0,100,false,2,""]]
            this.asusLinuxProxy.connectSignal(
                "NotifyProfile",
                (proxy_: any = null, name_: string, data_: object) => {
                    if (proxy_) {
                        let profileValues = {
                            name: '',
                            min: 0,
                            max: 100,
                            turbo: true,
                            fan: 1,
                            curve: null
                        };
                        
                        if (typeof data_ === 'object'){
                            //@ts-ignore
                            for (const [key, value] of Object.entries(data_)) {
                                value.forEach((element:any, index:number) => {
                                    if (index == 0){
                                        profileValues.name = element;
                                    }
                                    if (index == 1){
                                        profileValues.min = element;
                                    }
                                    if (index == 2){
                                        profileValues.max = element;
                                    }
                                    if (index == 3){
                                        profileValues.turbo = element;
                                    }
                                    if (index == 4){
                                        profileValues.fan = element;
                                    }
                                    if (index == 5){
                                        profileValues.curve = element;
                                    }
                                });
                            }
                        }
                        
                        if (profileValues.name !== ''){
                            this.updateProfile(profileValues.name);
                            Log.info(`[dbus${name_}]: The profile has changed to ${profileValues.name}`);
                        } else {
                            Log.error(`[dbus${name_}]: The profile has not been changed: no profile name given.`);
                        }
                    }
                }
            );

            this.updateProfile(await this.asusLinuxProxy.ActiveNameSync().toString().trim());
        } catch (e) {
            Log.error(`Profile DBus initialization failed!`);
            Log.error(e);
        }
    }

    stop() {
        Log.info(`Stopping Profile DBus client...`);

        if (this.connected) {
            this.sourceId = null;
            this.connected = false;
            this.asusLinuxProxy = null;
            this.lastState = '';
        }
    }
}

export type ProfileData = { name: string, _min: number, _max: number, _turbo: boolean, _fan: number, _curve: string };