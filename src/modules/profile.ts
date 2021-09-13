declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const {main, popupMenu} = imports.ui;
const {Gio} = imports.gi;

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
        // get menu and its items
        let menu = main.panel.statusArea['asusctl-gex.panel'].menu;

        menu.addMenuItem(
            new popupMenu.PopupMenuItem(
                'Power Profile',
                {
                    hover: false,
                    can_focus: false,
                    style_class: 'asusctl-gex-menu-item headline headline-label fan'
                }
            )
        );

        if (this.connector.profiles.length > 0 && this.isRunning()){
            this.connector.profiles.forEach((profile: {'Profile': '', 'Driver': ''}) => {
                let menuItem = new popupMenu.PopupImageMenuItem(
                    profile.Profile,
                  Gio.icon_new_for_string(`${Me.path}/icons/scalable/profile-${profile.Profile}.svg`),
                  {
                    style_class: `${profile.Profile} callmode-${profile.Profile} fan-mode asusctl-gex-menu-item`
                  }
                );
                
                menu.addMenuItem(menuItem);
                menuItem.connect('activate', () => {
                    this.connector.setProfile(profile.Profile) 
                });
            });
        } else {
            menu.addMenuItem(
                new popupMenu.PopupMenuItem(
                    'Profiles not initialized',
                    {
                        hover: false,
                        can_focus: false,
                        style_class: 'none fan-mode asusctl-gex-menu-item'
                    }
                )
            );
        }
    }
}
