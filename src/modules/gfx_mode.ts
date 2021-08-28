declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as DBus from './gfx_mode_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';
import { IPopulatePopupModule } from '../interfaces/iPopulatePopupModule';

const GLib = imports.gi.GLib;

// needed for menu manipulations
const Main = imports.ui.main;
const PM = imports.ui.popupMenu;

export class Client implements IStoppableModule, IPopulatePopupModule {
    iGpuString: string = 'unknown';
    connector: DBus.GfxMode = new DBus.GfxMode();
    connected: boolean = false;

    constructor() {
        try {
            this.connector = new DBus.GfxMode("org-asuslinux-gfx-3.0.0");
            this.getIGPU(); // also sets the value
        } catch(e) {
            Log.error(`GfxMode client initialization failed!`, e);
        }
    }

    public getGfxMode() {
        if (this.isRunning())
            return this.connector.getGfxMode();
    }

    public getGpuPower() {
        if (this.isRunning())
            return this.connector.getGpuPower();
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

    start() {
        Log.info(`Starting GfxMode client...`);

        try {
            this.connector.start();
            this.connected = this.connector.isRunning();
        } catch(e) {
            Log.error(`GfxMode client start failed!`, e);
        }
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

        let vendor = this.getGfxMode() ?? 5;
        let gpuPower = this.getGpuPower();

        // get menu and its items
        let menu = Main.panel.statusArea['asusctl-gex.panel'].menu;
        let menuItems = menu._getMenuItems();

        let menuIdx = 1;
        menuItems.forEach((mi: any) => {
            if (mi.style_class.includes('gfx-mode') && mi.style_class.includes('none'))
            {
                mi.destroy();
                Log.info(`Current Graphics Mode is ${this.connector.gfxLabels[vendor]}`);
                
                if (typeof gpuPower !== 'undefined') {
                    let gpuPowerItem = new PM.PopupMenuItem(`dedicated GPU: ${this.connector.powerLabel[gpuPower]}`, {
                        hover: false,
                        can_focus: false,
                        style_class: `gpupower ${this.connector.powerLabel[gpuPower]}`
                    });
                    menu.addMenuItem(gpuPowerItem, menuIdx++);
                }

                // seperator
                menu.addMenuItem(new PM.PopupSeparatorMenuItem(), menuIdx++)

                this.connector.gfxLabels.forEach((label: string) => {
                    if (label === 'unknown') // skip this type, should not be listed
                        return;

                    let tMenuItem = new PM.PopupMenuItem(label, {style_class: `${label} gfx-mode ${this.iGpuString}`});
                    let idx = this.connector.gfxLabels.indexOf(label);
                    let acl = this.getAcl(vendor, idx);

                    // set active item
                    if (idx === vendor) {
                        tMenuItem.style_class = `${tMenuItem.style_class} active`;
                        tMenuItem.label.set_text(`${tMenuItem.label.text}  ✔`);
                    }

                    // add to menu
                    menu.addMenuItem(tMenuItem, menuIdx++);                    

                    // check and set acl (true == access granted)
                    tMenuItem.sensitive = acl;
                    tMenuItem.active = acl;
                    tMenuItem.connect('activate', () => {
                        // delay poller, only on integrated(1) and swithing to vfio(3)
                        if (this.connector.lastState == 1 && idx == 3)
                            this.connector.pollerDelayTicks = 5;
                        this.connector.setGfxMode(idx);
                    });
                });
            }
        });
    }
}
