declare const global: any, imports: any;
declare var ext: any;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Config = imports.misc.config;

import * as Log from './modules/log';
import * as PowerProfiles from './modules/power_profiles';
import * as Profile from './modules/profile';
import * as GfxMode from './modules/gfx_mode';
import * as Panel from './modules/panel';

import {IEnableableModule} from './interfaces/iEnableableModule';

export class Extension implements IEnableableModule {
    public panelButton: Panel.Button = new Panel.Button();
    powerProfiles: PowerProfiles.Client;
    profile: Profile.Client;
    gfxMode: GfxMode.Client;

    constructor() {
        Log.info(`Initializing ${Me.metadata.name} version ${Me.metadata.version} on GNOME Shell ${Config.PACKAGE_VERSION}`);

        this.powerProfiles = new PowerProfiles.Client();
        this.profile = new Profile.Client();
        this.gfxMode = new GfxMode.Client();
    }

    enable() {
        Log.info(`Enabling ${Me.metadata.name} version ${Me.metadata.version}`);

        // create panel button (needs to be first in chain)
        this.panelButton.create();

        // starting clients (dbus)

        // GS prior 41, checking for power profiles daemon
        if (parseInt(Config.PACKAGE_VERSION) >= 41){
            this.powerProfiles.start();
        }

        // Power Profiles Client not running when not available or GS < 41
        if (!this.powerProfiles.isRunning()){
            Log.info('Power Profiles Daemon not detected or GNOME Shell prior 41, using asusctl profiles');
            this.profile.start(true);
        }

        this.gfxMode.start(true);
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
