declare const global: any, imports: any;
const Config = imports.misc.config;
declare var ext: Extension;
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './modules/log';
import * as Profile from './modules/profile';
import * as GfxMode from './modules/gfx_mode';
import * as Charge from './modules/charge';
import * as Panel from './modules/panel';

import {IEnableableModule} from './interfaces/iEnableableModule';

export class Extension implements IEnableableModule {
    public panelButton: Panel.Button = new Panel.Button();
    profile: Profile.Client;
    gfxMode: GfxMode.Client;
    chargingLimit: Charge.Client;

    constructor() {
        Log.info(`Initializing ${Me.metadata.name} version ${Me.metadata.version} on GNOME Shell ${Config.PACKAGE_VERSION}`);

        this.profile = new Profile.Client();
        this.gfxMode = new GfxMode.Client();
        this.chargingLimit = new Charge.Client();
    }

    enable() {
        Log.info(`Enabling ${Me.metadata.name} version ${Me.metadata.version}`);

        // create panel button (needs to be first in chain)
        this.panelButton.create();
        
        // starting clients (dbus)
        this.profile.start();
        this.gfxMode.start(true);
        this.chargingLimit.start();
    }

    disable() {
        Log.info(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);
        this.profile.stop();
        this.gfxMode.stop();
        this.chargingLimit.stop();
        this.panelButton.destroy();
    }
}

// @ts-ignore
function init() {
    ext = new Extension();
    return ext;
}
