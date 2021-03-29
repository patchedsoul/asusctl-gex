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
        Name: 'asus-nb-gex.indicator',
        Extends: PanelMenu.Button,

        _init: function(){
            this.parent(null, 'AsusNbPanel');

            // setting icon (placeholder - contains nothing then dimensions)
            this.add_actor(new St.Icon({style_class: 'panel-icon'}));

            // populating panelMenu (extend)
            this.popupMenu = new Popup.Menu(this.menu);
        }
    });

    public create(): void {
        this.indicator = new this.AsusNb_Indicator();

        Main.panel.addToStatusArea('asus-nb-gex.panel', this.indicator, 1, Main.panel._rightBox);
        Main.panel.statusArea['asus-nb-gex.panel'].style_class = 'panel-icon white';
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
            Log.error(e);
        }
    }

    public static notify(msg:string = Title, details:string, icon: string, panelIcon: string = "", action: string = "") {
        // no need for system-icons
        let gIcon = Gio.icon_new_for_string(`${Me.path}/icons/128x128/${icon}.png`);
        let source = new MessageTray.Source(msg, {gicon: gIcon});

        Main.messageTray.add(source);
        let notification = new MessageTray.Notification(source, msg, details);
        notification.setTransient(true);

        if (action == 'reboot'){
            notification.addAction('Reboot Now!', () => {this.spawnCommandLine('systemctl reboot')});
        } else if (action == 'logout'){
            notification.addAction('Log Out Now!', () => {this.spawnCommandLine('gnome-session-quit')});
        }

        source.showNotification(notification);

        if (panelIcon !== "")
            Main.panel.statusArea['asus-nb-gex.panel'].style_class = 'panel-icon ' + panelIcon;
    }

    public static updateMode(selector:string, vendor:string, value:string = '') {
        Log.info(`(panel) new ${selector} mode: ${vendor}:${value}`);

        let menuItems = Main.panel.statusArea['asus-nb-gex.panel'].menu._getMenuItems();
        // Log.info(menuItems);
        menuItems.forEach((mi: { label: any; style_class: string; }) => {
            if (mi.style_class.includes(selector)){
                if (mi.style_class.includes(vendor)){
                    mi.style_class = mi.style_class+' active';
                    mi.label.set_text(mi.label.text+'  ✔');
                } else if (mi.style_class.includes('active')){
                    mi.style_class = mi.style_class.split('active').join(' ');
                    mi.label.set_text(mi.label.text.substr(0, mi.label.text.length-3));
                }
            }
        });
    }
}
