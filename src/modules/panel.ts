declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Popup from './popup';
import {IDestroyableModule} from '../interfaces/iDestroyableModule';


const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const PanelMenu = imports.ui.panelMenu;
const St = imports.gi.St;

export const Title = 'AsusNB Control';

export class Button implements IDestroyableModule {
    public indicator: any;

    AsusNb_Indicator = new Lang.Class({
        Name: 'asusctl-gex-indicator',
        Extends: PanelMenu.Button,

        _init: function(){
            this.parent(null, 'AsusNbPanel');

            this._defaultClasses = 'panel-status-button asusctl-gex-panel-button';

            this.style_class = this._defaultClasses;

            let indicatorLayout = new St.BoxLayout({
                vertical: false,
                style_class: 'asusctl-gex-panel-layout system-status-icon panel-button',
                reactive: true,
                can_focus: true,
                track_hover: true
            });

            this._binProfile = new St.Bin({ 
                style_class: ' panel-bin-profile',
                reactive: true,
                can_focus: true,
                track_hover: true
            });

            this._binGpu = new St.Bin({ 
                style_class: 'panel-bin-gpu',
                reactive: true,
                can_focus: true,
                track_hover: true
            });

            this._binGpuPower = new St.Bin({ 
                style_class: 'panel-bin-gpupower',
                reactive: true,
                can_focus: true,
                track_hover: true
            });

            this._iconProfile = new St.Icon({
                style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-profile'
            });
            this._iconGpu = new St.Icon({
                style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-gpu'
            });
            this._iconGpuPower = new St.Icon({
                style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-gpupower'
            });

            this._binProfile.add_actor(this._iconProfile);
            this._binGpu.add_actor(this._iconGpu);
            this._binGpuPower.add_actor(this._iconGpuPower);

            indicatorLayout.add_child(this._binProfile);
            indicatorLayout.add_child(this._binGpu);
            indicatorLayout.add_child(this._binGpuPower);

		    this.add_child(indicatorLayout);

            // populating panelMenu (extend)
            this.popupMenu = new Popup.Menu(this.menu);
        }
    });

    public create(): void {
        this.indicator = new this.AsusNb_Indicator();

        Main.panel.addToStatusArea('asusctl-gex.panel', this.indicator);
    }

    public destroy(): void {
        if (this.indicator !== null) {
            this.indicator.destroy();
            this.indicator = null;
        }
    }
}

export class Actions {
    public static spawnCommandLine(command: string) {
        try {
            GLib.spawn_command_line_async(command);
        } catch (e) {
            Log.error(`Spawning command failed: ${command}`);
            Log.error(e);
        }
    }

    public static notify(msg:string = Title, details:string, icon: string, action: string = "") {
        let gIcon = Gio.icon_new_for_string(`${Me.path}/icons/scalable/${icon}.svg`); // no need for system-icons
        // unsure, "gicon" might be needed on both, notif needs it in any case
        let source = new MessageTray.Source(msg, icon, {gicon: gIcon});
        let notification = new MessageTray.Notification(source, msg, details, {gicon: gIcon});
        
        Main.messageTray.add(source);
        notification.setTransient(true);

        if (action == 'reboot'){
            notification.addAction('Reboot Now!', () => {this.spawnCommandLine('systemctl reboot')});
        } else if (action == 'logout'){
            notification.addAction('Log Out Now!', () => {this.spawnCommandLine('gnome-session-quit')});
        }

        source.showNotification(notification);
    }

    public static updateMode(selector:string, vendor:string) {
        let menuItems = Main.panel.statusArea['asusctl-gex.panel'].menu._getMenuItems();
        menuItems.forEach((mi: { label: any; style_class: string; }) => {
            if (mi.style_class.includes(selector)){
                if (selector == 'gpupower'){
                    mi.style_class = `${selector} ${vendor}`;
                    mi.label.set_text(`dedicated GPU: ${vendor}`);
                } else {
                    if (mi.style_class.includes(vendor) && !mi.style_class.includes('active')){
                        mi.style_class = `${mi.style_class} active`;
                        mi.label.set_text(`${mi.label.text}  ✔`);
                    } else if (mi.style_class.includes('active')){
                        mi.style_class = mi.style_class.split('active').join(' ');
                        Log.info(mi.style_class);
                        mi.label.set_text(mi.label.text.substr(0, mi.label.text.length-3));
                    }
                }
            }
        });
    }
}
