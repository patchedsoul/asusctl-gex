declare const global: any, imports: any;
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
            let menu = Main.panel.statusArea['asus-nb-gex.panel'].menu;
            let menuItems = menu._getMenuItems();
            menuItems.forEach((mi: any) => {
                Log.info('menu item '+mi.style_class);
                if (mi.style_class.includes('fan-mode') && mi.style_class.includes('none')){
                    mi.destroy();

                    let  menuItems: any = {
                        silent: new PM.PopupMenuItem('silent', {style_class: 'silent callmode-silent fan-mode'}),
                        normal: new PM.PopupMenuItem('normal', {style_class: 'normal callmode-normal fan-mode'}),
                        boost: new PM.PopupMenuItem('boost', {style_class: 'boost callmode-boost fan-mode'}),
                    }

                    for (const item in menuItems){
                        menu.addMenuItem(menuItems[item]);
                        menuItems[item].connect('activate', () => {this.profile.connector.setProfile(item)});
                    }
                }
            });
        }

        if (this.gfxMode.connected){
            // gfx connected, populating menu
            let menu = Main.panel.statusArea['asus-nb-gex.panel'].menu;
            let menuItems = menu._getMenuItems();
            menuItems.forEach((mi: any) => {
                Log.info('menu item '+mi.style_class);
                if (mi.style_class.includes('gfx-mode') && mi.style_class.includes('none')){
                    mi.destroy();

                    let vendor = this.gfxMode.connector.asusLinuxProxy.VendorSync().toString().trim();
                    // let power = this.gfxMode.connector.asusLinuxProxy.power;

                    let  menuItems: any = {
                        integrated: new PM.PopupMenuItem('integrated', {style_class: 'integrated gfx-mode'}),
                        hybrid: new PM.PopupMenuItem('hybrid', {style_class: 'hybrid gfx-mode'}),
                        compute: new PM.PopupMenuItem('compute', {style_class: 'compute gfx-mode'}),
                        dedicated: new PM.PopupMenuItem('nvidia', {style_class: 'nvidia gfx-mode'}),
                    }

                    let position = 1;
                    for (const item in menuItems){
                        if (item == vendor){
                            menuItems[item].style_class = menuItems[item].style_class+' active';
                            menuItems[item].label.set_text(menuItems[item].label.text+'  🗸');
                        }
                        menu.addMenuItem(menuItems[item], position);
                        menuItems[item].connect('activate', () => {this.gfxMode.connector.setGfxMode(item)});
                        position++;
                    }
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

let ext: Extension | null = null;

// @ts-ignore
function init() {
    ext = new Extension();
    return ext;
}
