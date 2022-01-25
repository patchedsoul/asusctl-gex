declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const {main, popupMenu} = imports.ui;
const {Gio, GLib, St} = imports.gi;

import * as Log from './log';
import * as DBus from './gfx_mode_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';
import { IPopulatePopupModule } from '../interfaces/iPopulatePopupModule';

export class Client implements IStoppableModule, IPopulatePopupModule {
    iGpuString: string = 'unknown';
    connector: DBus.GfxMode = new DBus.GfxMode();
    connected: boolean = false;
    updateGfxItem: any;

    constructor() {
        Log.debug(`Starting GfxMode client...`);
    }

    public getIGPU(){
        try {
            this.iGpuString = GLib.file_test('/sys/bus/pci/drivers/amdgpu', GLib.FileTest.EXISTS) ? 'amd' : 'intel';
        } catch (e) {
            this.iGpuString = 'intel';
        }
        Log.debug(`Detected integrated GPU: ${this.iGpuString}`);
        return this.iGpuString;
    }

    public getAcl(ven: number, idx: number) {
        return this.connector.getAcl(ven, idx);
    }

    isRunning(): boolean {
        return (this.connected && this.connector && this.connector.isRunning());
    }

    start() {
        this.connected = this.connector.start();

        if (this.connected)
            this.populatePopup();
    }

    stop() {
        Log.debug(`Stopping GfxMode client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.connector.stop();
        }
    }

    populatePopup(): void {
        if (this.isRunning() && this.connector.supported.length > 0){

            let vendor = this.connector.getGfxMode();
            let gpuPower = this.connector.getGpuPower();

            let menu = main.panel.statusArea['asusctl-gex.panel'].menu;

            let menuIdx = 1;

            // Graphics switching options and the indicator icon in the panel
            // should only be shown if the install version of supergfxctl is 
            // supported by asusctl-gex
            if (this. connector.getVersion() == this.connector.supergfxSupportedVer) {
                
                // add Graphics Mode header
                menu.addMenuItem(new popupMenu.PopupMenuItem('Graphics Mode', {hover: false, can_focus: false, style_class: 'headline gfx headline-label asusctl-gex-menu-item'}), 0);
                
                // add the GPU icon to the panel icon bin
                ext.panelButton._indicatorLayout.add_child(ext.panelButton._binGpu);
                
                Log.debug(`Current Graphics Mode is ${this.connector.gfxLabels[vendor]}`);
            
                if (typeof gpuPower !== 'undefined') {
                    let gpuPowerItem = new popupMenu.PopupImageMenuItem(
                        `dedicated GPU: ${this.connector.gfxLabels[gpuPower]}`,
                        Gio.icon_new_for_string(`${Me.path}/icons/scalable/dgpu-${this.connector.gfxLabels[gpuPower]}.svg`),
                    {
                        hover: false,
                        can_focus: false,
                        style_class: `gpupower ${this.connector.gfxLabels[gpuPower]} asusctl-gex-menu-item`
                    }
                    );

                    menu.addMenuItem(gpuPowerItem, menuIdx++);

                    // seperator
                    menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem(), menuIdx++);
                }

                let indexIntegrated = 0;
                this.connector.supported.forEach((supported: number) => {
                    menuIdx++;

                    let localIndex = menuIdx;

                    let labelMenu = this.connector.gfxLabels[supported];
                    if (labelMenu == 'integrated'){
                        indexIntegrated = localIndex;
                    }

                    if (labelMenu == 'vfio' || labelMenu == 'compute'){
                        labelMenu = '↳ '+labelMenu;
                        localIndex = indexIntegrated;
                    }

                    let menuItem = new popupMenu.PopupImageMenuItem(
                        labelMenu,
                        Gio.icon_new_for_string(`${Me.path}/icons/scalable/gpu-${this.connector.gfxLabels[supported]}.svg`),
                    {style_class: `${this.connector.gfxLabels[supported]} gfx-mode ${this.iGpuString} asusctl-gex-menu-item`}
                    );

                    let idx = this.connector.gfxLabels.indexOf(this.connector.gfxLabels[supported]);
                    let acl = this.getAcl(vendor, idx);

                    // set active item
                    if (idx === vendor) {
                        menuItem.style_class = `${menuItem.style_class} active asusctl-gex-menu-item`;
                        menuItem.label.set_text(`${menuItem.label.text}  ✔`);
                    }

                    // add to menu

                    menu.addMenuItem(menuItem, localIndex);

                    // check and set acl (true == access granted)
                    menuItem.sensitive = acl;
                    menuItem.active = acl;
                    menuItem.connect('activate', () => {
                        // delay poller, only on integrated(1) and swithing to vfio(3)
                        if (this.connector.lastState == 1 && idx == 3)
                            this.connector.pollerDelayTicks = 5;
                        this.connector.setGfxMode(idx);
                    });
                });

                menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem(), menuIdx++);
            } else {
                // If installed version of supergfxctl isn't supported, don't show 
                // graphics menu options. Instead, show a warning to upgrade.
                
                // Parent Menu item
                this.updateGfxItem = new popupMenu.PopupBaseMenuItem({hover: false, can_focus: false, style_class: 'asusctl-gex-menu-item'});

                // Create icon and label for the warning. We use this longer method so 
                // that we can make only the white icon orange for greater visibility :)
                let textUpdateGfx = 'Please update supergfxctl to version\n' + this.connector.supergfxSupportedVer + ' to enable graphics support!'
                let iconUpdateGfx = new St.Icon({icon_name: 'software-update-available-symbolic', icon_size: 28, style_class: 'popup-menu-icon popup-menu-icon-orange'});
                let labelUpdateGfx = new St.Label({text: textUpdateGfx, style_class: 'asusctl-gex-menu-item'});

                // Add the above two sub-tems to the parent menu item
                this.updateGfxItem.add(iconUpdateGfx);
                this.updateGfxItem.add(labelUpdateGfx);

                // Add menu item to main panel menu
                menu.addMenuItem(this.updateGfxItem, menuIdx++);
            }
        }
    }
}
