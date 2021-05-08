declare const global: any, imports: any;
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
        Name: 'asusctl-gex.indicator',
        Extends: PanelMenu.Button,

        _init: function(){
            this.parent(null, 'AsusNbPanel');

            this.add_style_class_name('panel-status-button asusctl-gex-panel-button');

            this._icon = new St.Icon({
                style_class: 'system-status-icon asusctl-gex-panel-icon'
            });

            this._button = new St.Bin({
                style_class: 'panel-button',
                reactive: true,
                can_focus: true,
                track_hover: true
            });

            this._button.set_child(this._icon);

            this.add_actor(this._button);

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

    public static notify(msg:string = Title, details:string, icon: string, panelIcon: string = "", action: string = "") {
        let gIcon = Gio.icon_new_for_string(`${Me.path}/icons/128x128/${icon}.png`); // no need for system-icons
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

        if (panelIcon !== '')
            Main.panel.statusArea['asusctl-gex.panel'].style_class = 'panel-icon ' + panelIcon;
    }

    public static updateMode(selector:string, vendor:string, value:string = '') {
        Log.info(`(panel) new ${selector} mode: ${vendor}${(value?':'+value:'')}`);

        let menuItems = Main.panel.statusArea['asusctl-gex.panel'].menu._getMenuItems();
        // Log.info(menuItems);
        menuItems.forEach((mi: { label: any; style_class: string; }) => {
            if (mi.style_class.includes(selector)){
                if (mi.style_class.includes(vendor)){
                    mi.style_class = `${mi.style_class} active`;
                    mi.label.set_text(`${mi.label.text}  ✔`);
                } else if (mi.style_class.includes('active')){
                    mi.style_class = mi.style_class.split('active').join(' ');
                    mi.label.set_text(mi.label.text.substr(0, mi.label.text.length-3));
                }
            }
        });
    }
}
