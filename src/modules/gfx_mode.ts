declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as DBus from './gfx_mode_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const GLib = imports.gi.GLib;

export class Client implements IStoppableModule {
    panelButton: any = null;
    igpu: string = 'intel';
    connector: any = null
    connected: boolean = false;

    constructor(panelButton: any = null) {
        this.panelButton = panelButton;
        
        try {
            this.connector = new DBus.GfxMode("org-asuslinux-gfx-3.0.0");
        } catch(e) {
            Log.error(`GfxMode client initialization failed!`);
            Log.error(e);
        }
    }

    public getCurrentMode() {
        return this.connector.getCurrentMode();
    }

    public getIGPU(){
        try {
            let isAMD:boolean = GLib.file_test('/sys/bus/pci/drivers/amdgpu', GLib.FileTest.EXISTS);
            Log.info(`integrated GPU: AMD`);
            this.igpu = isAMD ? 'amd' : 'intel';
            return this.igpu;
        } catch (e) {
            Log.info(`integrated GPU: Intel`);
            return 'intel';
        }
    }

    start() {
        Log.info(`Starting GfxMode client...`);

        try {
            this.connector.start();
            this.connected = true;
        } catch(e) {
            Log.error(`GfxMode client start failed!`);
            Log.error(e);
        }
    }

    stop() {
        Log.info(`Stopping GfxMode client...`);

        if (this.connected) {
            this.connected = false;
            this.connector.stop();
        }
    }
}
