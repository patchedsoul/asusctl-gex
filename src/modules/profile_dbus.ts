declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;

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
        'boost': 'asus-nb-gex-red',
        'normal': 'asus-nb-gex-yellow',
        'silent': 'asus-nb-gex-green'
    };
    profileColor: any = {
        'boost': 'red',
        'normal': 'yellow',
        'silent': 'green'
    }

    constructor(xml: string) {
        this.xml = Resources.File.DBus(xml);
    }

    public getProfileNames(){
        if (this.connected){
            try {
                return this.asusLinuxProxy.ProfileNamesSync();
            } catch ( e ) {
                Log.error(e);
            }
        }
    }

    public setProfile(mode: string){
        if (this.connected){
            try {
                // Log.info(mode);
                GLib.spawn_command_line_async( `asusctl profile ${mode}` );
                // DBUS Method currently does not seem to work 
                // return this.asusLinuxProxy.SetProfileSync(mode);
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

                this.updateProfile(curActiveProfile);
            } catch (e){
                Log.error(e);
            } finally {
                return this.connected ? GLib.SOURCE_CONTINUE : GLib.SOURCE_REMOVE;
            }
        } else {
            return GLib.SOURCE_REMOVE;
        }
    }

    updateProfile(curState: string){
        if (curState !== '' && this.lastState !== curState) {
            let message = ((this.lastState === '')?'initial':'changed') + ' profile: ' + curState;
            
            // updating panel popup-menulist
            Panel.Actions.updateMode('fan-mode', curState);
            
            if (this.lastState !== ''){
                Panel.Actions.notify(
                    Panel.Title, 
                    message,
                    this.profileIcons[curState],
                    this.profileColor[curState]
                );
            } else {
                Main.panel.statusArea['asus-nb-gex.panel'].style_class = 'panel-icon ' + this.profileColor[curState];
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

            try {
                this.sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, this.poller.bind(this));
            } catch (e) {
                Log.error(e);
            }
        } catch (e) {
            Log.error("Profile DBus initialization failed!");
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
