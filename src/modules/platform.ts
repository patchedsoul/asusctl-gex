declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const {main, popupMenu} = imports.ui;
const {} = imports.gi;

import * as Log from './log';
import * as DBus from './platform_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';
import { IPopulatePopupModule } from '../interfaces/iPopulatePopupModule';

export class Client implements IStoppableModule, IPopulatePopupModule {
    connector: DBus.Platform = new DBus.Platform();
    connected: boolean = false;
    overdriveSwitch: any;
    switchPostBootSound: any;

    constructor() {
        // nothing for now
    }
  
    isRunning(): boolean {
        return (this.connected && this.connector && this.connector.isRunning());
    }

    start() {
        Log.debug(`Starting Platform client...`);

        try {
            this.connector.start();
            this.connected = this.connector.isRunning();
            this.populatePopup();
        } catch (e) {
            Log.error(`Platform client start failed!`, e);
        }
    }

    stop() {
        Log.debug(`Stopping Platform client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.connector.stop();
        }
    }

    populatePopup(): void {
        if (!this.isRunning())
          return;
  
        // get menu
        let menu = main.panel.statusArea['asusctl-gex.panel'].menu;
        
        // headline
        menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem());
        const biosHeadline = new popupMenu.PopupMenuItem(
            'BIOS Settings',
            {
                hover: false,
                can_focus: false,
                style_class: 'headline headline-label asusctl-gex-menu-item'
            }
        )
        biosHeadline.sensitive = false;
        biosHeadline.active = false;
        menu.addMenuItem(
            biosHeadline
        );

        if (ext.supported.connector.supportedAttributes.bios_overdrive) {
            // switch
            this.overdriveSwitch = new popupMenu.PopupSwitchMenuItem(
                'Panel Overdrive',
                this.connector.lastStateOverdrive
            );

            this.overdriveSwitch.connect(
                'toggled',  // signal
                (item: any) => { 
                    this.connector.setOverdrive(item.state);
                }
            );

            menu.addMenuItem(this.overdriveSwitch);
        }
        
        if (ext.supported.connector.supportedAttributes.bios_toggleSound) {
            // switch
            this.switchPostBootSound = new popupMenu.PopupSwitchMenuItem(
                'Post Boot Sound',
                this.connector.lastStatePostBootSound
            );
            
            this.switchPostBootSound.connect(
                'toggled', // signal
                (item: any) => {
                    this.connector.setPostBootSound(item.state);
                }
            );

            menu.addMenuItem(this.switchPostBootSound);
        }        
    }
}
