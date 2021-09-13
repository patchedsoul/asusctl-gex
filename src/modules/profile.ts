declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

// needed for menu manipulations
const Main = imports.ui.main;
const PM = imports.ui.popupMenu;

import * as Log from './log';
import * as DBus from './profile_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';
import { IPopulatePopupModule } from '../interfaces/iPopulatePopupModule';

export class Client implements IStoppableModule, IPopulatePopupModule {
    connector: DBus.Profile = new DBus.Profile();
    connected: boolean = false;

    constructor() {        
        try {
            this.connector = new DBus.Profile();
        } catch(e) {
            Log.error(`Profile client initialization failed!`, e);
        }
    }

    isRunning(): boolean {
        return (this.connected && this.connector && this.connector.isRunning());
    }

    start() {
        Log.info(`Starting Profile client...`);

        try {
            this.connector.start();
            this.connected = this.connector.isRunning();
            this.populatePopup();
        } catch (e) {
            Log.error(`Profile start failed!`, e);
        }
    }

    stop() {
        Log.info(`Stopping Profile client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.connector.stop();
        }
    }
    
    populatePopup(): void {
        if (!this.isRunning())
            return;

        // get menu and its items
        let menu = Main.panel.statusArea['asusctl-gex.panel'].menu;
        let menuItems = menu._getMenuItems();

        menuItems.forEach((mi: any) => {
            if (mi.style_class.includes('fan-mode') && mi.style_class.includes('none'))
            {         
                mi.destroy();
                this.connector.profiles.forEach((profile: {'Profile': '', 'Driver': ''}) => {
                    let tMenuItem = new PM.PopupMenuItem(profile.Profile, {style_class: `${profile.Profile} callmode-${profile.Profile} fan-mode`});
                    menu.addMenuItem(tMenuItem);
                    tMenuItem.connect('activate', () => {
                        this.connector.setProfile(profile.Profile) 
                    });
                });
                Log.info(`Added Power Profiles to UI.`);
            }
        });
    }
}
