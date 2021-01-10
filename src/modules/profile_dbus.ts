declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as ProfileBase from './profile';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;

export class Profile implements IStoppableModule {
    sourceId: any = null;       // needed for dbus workaround
    enabled: boolean = false;   // needed for dbus workaround
    asusLinuxProxy: any = null;
    connected: boolean = false;
    lastState: number = -1;
    xml: string;

    constructor(xml: string) {
        this.xml = Resources.File.DBus(xml);
    }

    // this is needed because of a missing signal trigger in asus-nb-ctrl-2.0.5
    poller() {
        if(this.connected)
            try {
                // TODO: replace with gshema
                let curActiveProfile = this.asusLinuxProxy.ActiveProfileNameSync().toString().trim();
                let curState = ProfileBase.ProfileDescr.indexOf(`${curActiveProfile}`);

                if (curState !== undefined && !isNaN(curState) && curState !== -1 && this.lastState !== curState) {
                    Log.info(`[dbus_profile_poller]: The Profile changed, new Profile is ${curActiveProfile}`);
                    let message = ((this.lastState === -1)?'initial':'changed') + ' profile: ' + ProfileBase.ProfileDescr[curState];

                    // update state
                    this.lastState = curState;

                    Panel.Actions.notify(
                        Panel.Title, 
                        message,
                        ProfileBase.ProfileIcons[curState],
                        ProfileBase.ProfileColor[curState]
                    );

                    this.updateProfile(curActiveProfile);
                }
            } finally {
                return this.enabled ? GLib.SOURCE_CONTINUE : false;
            }
    }

    updateProfile(curActiveProfile: string){
        let menuItems = Main.panel.statusArea['asus-nb-gex.panel'].menu._getMenuItems();
        menuItems.forEach((mi: { label: any; style_class: string; }) => {
            if (mi.style_class.includes('fan-mode')){
                if (mi.style_class.includes(curActiveProfile)){
                    mi.style_class = mi.style_class+' active';
                    mi.label.set_text(mi.label.text+'  🗸');
                } else if (mi.style_class.includes('active')){
                    mi.style_class = mi.style_class.split('active').join(' ');
                    mi.label.set_text(mi.label.text.substr(0, mi.label.text.length-3));
                }
            }
        });
    }

    start() {
        Log.info(`Starting Profile DBus client...`);

        try {
            // creating the proxy
            let _asusLinuxProxy = Gio.DBusProxy.makeProxyWrapper(this.xml);
            this.asusLinuxProxy = new _asusLinuxProxy(
                Gio.DBus.system,
                "org.asuslinux.Daemon",
                "/org/asuslinux/Profile"
            );
            this.connected = true;
        } catch {
            Log.error("Profile DBus initialization failed!");
        }


        if (this.connected) {
            // getting initial profile
            let curActiveProfile = this.asusLinuxProxy.ActiveProfileNameSync().toString().trim();
            this.lastState = ProfileBase.ProfileDescr.indexOf(`${curActiveProfile}`);
            Log.info(`Initial Profile is ${this.lastState} (${curActiveProfile})`);
            try {
                Panel.Actions.notify(
                    Panel.Title,
                    `initial profile: ${ProfileBase.ProfileDescr[this.lastState]}`,
                    ProfileBase.ProfileIcons[this.lastState],
                    ProfileBase.ProfileColor[this.lastState]
                );

                this.updateProfile(curActiveProfile);
            } catch (e) {
                Log.error(e);
            }

            // connect to Profile
            /* TODO: must be fixed in asus-nb-ctrl (notification was removed!)
            this.asusLinuxProxy.connectSignal(
                "NotifyProfile",
                (proxy_: any = null, name_: string, profile: string) => {
                    if (proxy_) {
                        Log.info(`[dbus${name_}]: The Profile changed, new Profile is ${profile}`);

                        // update state
                        this.lastState = ProfileBase.ProfileDescr.indexOf(`${value}`);

                        // notify and change icon
                        Panel.Actions.notify(
                            Panel.Title,
                            `changed profile: ${ProfileBase.ProfileDescr[this.lastState]}`,
                            ProfileBase.ProfileIcons[this.lastState],
                            ProfileBase.ProfileColor[this.lastState]
                        );
                    }
                });
            */

            // needed for dbus workaround
            Log.info(`Starting Profile Poller client (workaround)...`);
            try {
                this.sourceId = GLib.timeout_add(
                    GLib.PRIORITY_DEFAULT,
                    250,
                    this.poller.bind(this)
                );
                this.enabled = true;
            } catch {
                Log.error(`Poller client start() failed!`);
            }
        }
    }

    stop() {
        Log.info(`Stopping Profile DBus client...`);
        // needed for dbus workaround
        this.enabled = false;
        if(this.sourceId !== null) {
            // remove the callback loop

            // g_source_remove is not a function? I get this error after suspend and the extension grashes
            // GLib.g_source_remove(this.sourceId);
        }

        if (this.connected) {
            this.connected = false;
            this.asusLinuxProxy = null;
        }
    }
}
