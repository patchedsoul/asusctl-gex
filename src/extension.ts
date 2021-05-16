declare const global: any, imports: any;
declare var ext: any;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PM = imports.ui.popupMenu;

import * as Log from './modules/log';
import * as Profile from './modules/profile';
import * as GfxMode from './modules/gfx_mode';
import * as Panel from './modules/panel';

import {IEnableableModule} from './interfaces/iEnableableModule';

export class Extension implements IEnableableModule {
    public panelButton: Panel.Button;
    profile: Profile.Client;
    gfxMode: GfxMode.Client;

    constructor() {
        Log.info(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
        this.panelButton = new Panel.Button();
        this.profile = new Profile.Client();
        this.gfxMode = new GfxMode.Client();
    }

    enable() {
        Log.info(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);
        this.panelButton.create();
        
        this.profile.start();
        this.gfxMode.start();

        if (this.profile.connected){
            // profile connected, populating menu
            let menu = Main.panel.statusArea['asusctl-gex.panel'].menu;
            let menuItems = menu._getMenuItems();
            menuItems.forEach((mi: any) => {
                if (mi.style_class.includes('fan-mode') && mi.style_class.includes('none')){
                    mi.destroy();

                    Log.info('Available Power Profiles: '+this.profile.connector.profileDesc.toString());

                    if (this.profile.connector.profileDesc.length > 0){
                        let menuItems: any = {};
                        this.profile.connector.profileDesc.forEach((el: any) => {
                            menuItems[el] = new PM.PopupMenuItem(el, {style_class: `${el} callmode-${el} fan-mode`});
                        });

                        for (const item in menuItems){
                            menu.addMenuItem(menuItems[item]);
                            menuItems[item].connect('activate', () => {this.profile.connector.setProfile(item)});
                        }
                    }
                }
            });
        }

        if (this.gfxMode.connected){
            let iGPU:string = this.gfxMode.getIGPU();

            // gfx connected, populating menu
            let menu = Main.panel.statusArea['asusctl-gex.panel'].menu;
            let menuItems = menu._getMenuItems();
            menuItems.forEach((mi: any) => {
                if (mi.style_class.includes('gfx-mode') && mi.style_class.includes('none')){
                    mi.destroy();

                    let vendor = this.gfxMode.connector.getGfxMode();
                    Log.info(`Current Graphics Mode is ${this.gfxMode.connector.gfxLabels[vendor]}`);

                    let  menuItems: any = {}
                    for (const key in this.gfxMode.connector.gfxLabels) {
                        menuItems[key] = new PM.PopupMenuItem(this.gfxMode.connector.gfxLabels[key], {style_class: this.gfxMode.connector.gfxLabels[key]+' gfx-mode ' + iGPU})
                    }

                    let position = 1;
                    for (const item in menuItems){
                        if (item == vendor){
                            menuItems[item].style_class = `${menuItems[item].style_class} active`;
                            menuItems[item].label.set_text(`${menuItems[item].label.text}  ✔`);
                        }
                        menu.addMenuItem(menuItems[item], position);
                        menuItems[item].connect('activate', () => {this.gfxMode.connector.setGfxMode(item)});
                        position++;
                    }

                    // gpu power items
                    let gpuPowerItem = new PM.PopupMenuItem('dedicated GPU: on', {style_class: 'gpupower on'});
                    menu.addMenuItem(gpuPowerItem, 1);
                }
            });
        }
    }

    disable() {
        Log.info(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);
        this.profile.stop();
        this.gfxMode.stop();
        this.panelButton.destroy();
    }
}

// @ts-ignore
function init() {
    ext = new Extension();
    return ext;
}