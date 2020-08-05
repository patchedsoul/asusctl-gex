declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import {IDestroyableModule} from '../interfaces/iDestroyableModule';

const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const St = imports.gi.St;
const MessageTray = imports.ui.messageTray;

export const Title = 'ROG-Core';

export class Button implements IDestroyableModule {
    public indicator: any;
    RogCore_Indicator = new Lang.Class({
        Name: 'rog-core-gex.indicator',
        Extends: PanelMenu.Button,

        _init: function(){
                this.parent(null, 'RogCorePanel');
                //this.parent(0.0);

                // setting icon (placeholder - contains nothing then dimensions)
                this.add_actor(new St.Icon({style_class: 'panel-icon'}));
        }
    });

    public create(): void {
        this.indicator =  new this.RogCore_Indicator();

        Main.panel.addToStatusArea('rog-core-gex.panel', this.indicator, 1, Main.panel._rightBox);
        Main.panel.statusArea['rog-core-gex.panel'].style_class = 'panel-icon white';
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
            Main.panel.statusArea['rog-core-gex.panel'].style_class = 'panel-icon ' + panelIcon;
    }
}
