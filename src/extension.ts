declare const global: any, imports: any;
declare var ext: Extension;
const Config = imports.misc.config;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const {Gio} = imports.gi;

import * as Log from './modules/log';
import * as Profile from './modules/profile';
import * as GfxMode from './modules/gfx_mode';
import * as Charge from './modules/charge';
import * as Anime from './modules/anime';
import * as Panel from './modules/panel';

import {IEnableableModule} from './interfaces/iEnableableModule';

export class Extension implements IEnableableModule {
    public panelButton: Panel.Button = new Panel.Button();
    profile: Profile.Client;
    gfxMode: GfxMode.Client;
    chargingLimit: Charge.Client;
    anime: Anime.Client;
    settings: any | null = null; // not sure how to define this

    constructor() {
        Log.info(`Initializing ${Me.metadata.name} version ${Me.metadata.version} on GNOME Shell ${Config.PACKAGE_VERSION}`);

        this.getSettings();

        this.profile = new Profile.Client();
        this.gfxMode = new GfxMode.Client();
        this.chargingLimit = new Charge.Client();
        this.anime = new Anime.Client();
    }

    enable() {
        Log.info(`Enabling ${Me.metadata.name} version ${Me.metadata.version}`);

        // create panel button (needs to be first in chain)
        this.panelButton.create();

        // starting clients (dbus)
        this.profile.start();
        this.gfxMode.start();
        this.chargingLimit.start();
        this.anime.start();
    }

    disable() {
        Log.info(`Disabling ${Me.metadata.name} version ${Me.metadata.version}`);
        this.profile.stop();
        this.gfxMode.stop();
        this.chargingLimit.stop();
        this.panelButton.destroy();
    }

    getSettings(){
        // preperation for reading saved settings
        // like turning notifications on / off
        // not used, yet
        try {
            this.settings = new Gio.Settings({
                schema_id: 'org.asus-linux.gex',
            });
        } catch (error) {
            Log.error('Error getting settings, creating initials...', error);
        }
    }
}

// @ts-ignore
function init() {
    ext = new Extension();
    return ext;
}
