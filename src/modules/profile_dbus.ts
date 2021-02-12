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
const ByteArray = imports.byteArray;

export class Profile implements IStoppableModule {
    sourceId: any = null;       // needed for dbus workaround
    enabled: boolean = false;   // needed for dbus workaround
    asusLinuxProxy: any = null;
    connected: boolean = false;
    lastState: number = -1;
    xml: string;
    lockMonitor: any;
    lock: any;

    constructor(xml: string) {
        this.xml = Resources.File.DBus(xml);
    }

    public setProfile(mode: string){
        if (this.connected){
            Log.error(mode);
            // return this.asusLinuxProxy.SetProfileRemote(mode);
            try {
                GLib.spawn_command_line_async( `asusctl profile ${mode}`, null );
            } catch ( e ) {
                Log.error(e);
            }
        }
    }

    // this is needed because of a missing signal trigger in asus-nb-ctrl-2.0.5
    poller() {
        if(this.connected){
            try {
                let curActiveProfile = this.asusLinuxProxy.ActiveProfileNameSync().toString().trim();
                let curState = ProfileBase.ProfileDescr.indexOf(`${curActiveProfile}`);

                this.updateProfile(curState);
            } catch (e){
                Log.error(e);
            } finally {
                return this.enabled ? GLib.SOURCE_CONTINUE : GLib.SOURCE_REMOVE;
            }
        } else {
            return GLib.SOURCE_REMOVE;
        }
    }

    updateProfile(curState: number){
        if (curState !== undefined && !isNaN(curState) && curState !== -1 && this.lastState !== curState) {
            let curActiveProfileName = ProfileBase.ProfileDescr[curState];
            let menuItems = Main.panel.statusArea['asus-nb-gex.panel'].menu._getMenuItems();
            menuItems.forEach((mi: { label: any; style_class: string; }) => {
                if (mi.style_class.includes('fan-mode')){
                    if (mi.style_class.includes(curActiveProfileName)){
                        mi.style_class = mi.style_class+' active';
                        mi.label.set_text(mi.label.text+'  🗸');
                    } else if (mi.style_class.includes('active')){
                        mi.style_class = mi.style_class.split('active').join(' ');
                        mi.label.set_text(mi.label.text.substr(0, mi.label.text.length-3));
                    }
                }
            });
            
            Log.info(`[updateProfile]: The Profile changed, new Profile is ${curActiveProfileName}`);
            let message = ((this.lastState === -1)?'initial':'changed') + ' profile: ' + ProfileBase.ProfileDescr[curState];

            if (this.lastState !== -1){
                Panel.Actions.notify(
                    Panel.Title, 
                    message,
                    ProfileBase.ProfileIcons[curState],
                    ProfileBase.ProfileColor[curState]
                );
            } else {
                Main.panel.statusArea['asus-nb-gex.panel'].style_class = 'panel-icon ' + ProfileBase.ProfileColor[curState];
            }

            // update state
            this.lastState = curState;
        }
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
            this.enabled = true;

            try {
                this.sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 10, this.poller.bind(this));
            } catch (e) {
                Log.error(e);
            }
        } catch (e) {
            Log.error("Profile DBus initialization failed!");
            Log.error(e);

            Log.info(`Starting Profile file watcher (workaround)...`);
            let lockFile = '/sys/devices/platform/asus-nb-wmi/throttle_thermal_policy';
            try {
                this.lockMonitor = Gio.File.new_for_path(lockFile);
                this.lock = this.lockMonitor.monitor_file(Gio.FileMonitorFlags.NONE, null);
                if (this.lockMonitor.query_exists(null)){
                    // Log.info(GLib.file_get_contents(lockFile));
                    this.updateProfile(parseInt(ByteArray.toString(GLib.file_get_contents(lockFile)[1]), 10));
                }
                this.enabled = true;
            } catch (e) {
                Log.error(e);
            }
        }
    }

    stop() {
        Log.info(`Stopping Profile DBus client...`);
        // needed for dbus workaround
        this.enabled = false;

        if (this.connected) {
            this.sourceId = null;
            this.connected = false;
            this.asusLinuxProxy = null;
            this.lastState = -1;
        }
    }
}
