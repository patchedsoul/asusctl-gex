declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Popup from './popup';
import {IDestroyableModule} from '../interfaces/iDestroyableModule';

const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const St = imports.gi.St;
const MessageTray = imports.ui.messageTray;

export const Title = 'AsusNB Control';

export class Button implements IDestroyableModule {
    public indicator: any;
    AsusNb_Indicator = new Lang.Class({
        Name: 'asus-nb-gex.indicator',
        Extends: PanelMenu.Button,

        _init: function(){
                this.parent(null, 'AsusNbPanel');
                //this.parent(0.0);

                // setting icon (placeholder - contains nothing then dimensions)
                this.add_actor(new St.Icon({style_class: 'panel-icon'}));

                // populating panelMenu (extend)
                let popupMenu = new Popup.Menu();
                popupMenu.createMenu(this.menu); // WiP

        }
    });

    public create(): void {
        this.indicator =  new this.AsusNb_Indicator();

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
    public static notify(msg:string = Title, details:string, icon: string, panelIcon: string = "") {
        let source = new MessageTray.Source(msg, icon);
        Main.messageTray.add(source);
        let notification = new MessageTray.Notification(source, msg, details);
        notification.setTransient(true);
        source.showNotification(notification);

        if (panelIcon !== "")
            Main.panel.statusArea['asus-nb-gex.panel'].style_class = 'panel-icon ' + panelIcon;
    }

    public static updateGfxMode(vendor:string, power:string) {
        let menuItem = Main.panel.statusArea['asus-nb-gex.panel'].menu.firstMenuItem;
        Log.info(`(panel) new mode: ${vendor}:${power}`);

        // manipulating label
        menuItem.label.text = `GFX status: ${vendor} (dGPU: ${power})`;
        menuItem.label.height = 0; // correcting height
        menuItem.label.style_class = `gfx-mode ${vendor}`;
    }
}
