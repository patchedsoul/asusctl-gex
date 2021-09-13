declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const {main, popupMenu} = imports.ui;
const {Gio, GLib} = imports.gi;

import * as Log from './log';
import * as DBus from './gfx_mode_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';
import { IPopulatePopupModule } from '../interfaces/iPopulatePopupModule';

export class Client implements IStoppableModule, IPopulatePopupModule {
    iGpuString: string = 'unknown';
    connector: DBus.GfxMode = new DBus.GfxMode();
    connected: boolean = false;

    constructor() {
        Log.info(`Starting GfxMode client...`);
    }

    public getGfxMode() {
        if (this.isRunning())
            return this.connector.getGfxMode();
    }

    public getGpuPower() {
        if (this.isRunning()){
            return this.connector.getGpuPower();
        }
    }

    public getIGPU(){
        try {
            this.iGpuString = GLib.file_test('/sys/bus/pci/drivers/amdgpu', GLib.FileTest.EXISTS) ? 'amd' : 'intel';
        } catch (e) {
            this.iGpuString = 'intel';
        }
        Log.info(`Detected integrated GPU: ${this.iGpuString}`);
        return this.iGpuString;
    }

    public getAcl(ven: number, idx: number) {
        return this.connector.getAcl(ven, idx);
    }

    isRunning(): boolean {
        return (this.connected && this.connector && this.connector.isRunning());
    }

    start(initMenu: boolean = false) {
        this.connected = this.connector.start();

        if (initMenu)
            this.populatePopup();
    }

    stop() {
        Log.info(`Stopping GfxMode client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.connector.stop();
        }
    }

    populatePopup(): void {
        if (!this.isRunning())
            return;

        // add the GPU icon to the panel icon bin
        ext.panelButton.indicator._indicatorLayout.add_child(ext.panelButton.indicator._binGpu);

        let vendor = this.getGfxMode() ?? 5;
        let gpuPower = this.getGpuPower();

        let menu = main.panel.statusArea['asusctl-gex.panel'].menu;

        let menuIdx = 1;
        menu.addMenuItem(new popupMenu.PopupMenuItem('Graphics Mode', {hover: false, can_focus: false, style_class: 'headline gfx headline-label asusctl-gex-menu-item'}), 0);

        Log.info(`Current Graphics Mode is ${this.connector.gfxLabels[vendor]}`);
        
        if (typeof gpuPower !== 'undefined') {
            let gpuPowerItem = new popupMenu.PopupImageMenuItem(
                `dedicated GPU: ${this.connector.powerLabel[gpuPower]}`,
                Gio.icon_new_for_string(`${Me.path}/icons/scalable/dgpu-${this.connector.powerLabel[gpuPower]}.svg`),
              {
                hover: false,
                can_focus: false,
                style_class: `gpupower ${this.connector.powerLabel[gpuPower]} asusctl-gex-menu-item`
              }
            );

            menu.addMenuItem(gpuPowerItem, menuIdx++);

            // seperator
            menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem(), menuIdx++);
        }

        this.connector.gfxLabels.forEach((label: string) => {
            if (label === 'unknown') // skip this type, should not be listed
                return;

            let labelMenu = label;
            if (labelMenu == 'vfio' || labelMenu == 'compute'){
                labelMenu = '↳ '+labelMenu;
            }

            let menuItem = new popupMenu.PopupImageMenuItem(
                labelMenu,
                Gio.icon_new_for_string(`${Me.path}/icons/scalable/gpu-${label}.svg`),
              {style_class: `${label} gfx-mode ${this.iGpuString} asusctl-gex-menu-item`}
            );

            let idx = this.connector.gfxLabels.indexOf(label);
            let acl = this.getAcl(vendor, idx);

            // set active item
            if (idx === vendor) {
                menuItem.style_class = `${menuItem.style_class} active asusctl-gex-menu-item`;
                menuItem.label.set_text(`${menuItem.label.text}  ✔`);
            }

            // add to menu
            menu.addMenuItem(menuItem, menuIdx++);

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
    }
}
