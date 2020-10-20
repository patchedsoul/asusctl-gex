declare const global: any, imports: any;
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './modules/log';
import * as Profile from './modules/profile';
import * as GfxMode from './modules/gfx_mode';
import * as Panel from './modules/panel';

import {IEnableableModule} from './interfaces/iEnableableModule';

export class Extension implements IEnableableModule {
    panelButton: Panel.Button;
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
