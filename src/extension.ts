declare const global: any, imports: any;
declare var ext: Extension;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = imports.misc.extensionUtils.getCurrentExtension();

// const {Gio} = imports.gi;

import * as Log from './modules/log';
import * as Supported from './modules/supported';
import * as Profile from './modules/profile';
import * as GfxMode from './modules/gfx_mode';
import * as Charge from './modules/charge';
import * as Anime from './modules/anime';
import * as Panel from './modules/panel';

import {IEnableableModule} from './interfaces/iEnableableModule';

export class Extension implements IEnableableModule {
    // no itialisation so they don't appear in constructor()
    // @ts-ignore
    public panelButton: Panel.Button;

    // no itialisation so they don't appear in constructor()
    // settings of type GIName:Gio.Settings -> how to declare?
    public settings: any;
    // @ts-ignore
    public isDebug: boolean;

    // extensions.gnome.org wants everything in enable()
    // so TS marks the following as errors when not initialised
    // in the constructor() - therefore @ts-ignore

    // @ts-ignore
    supported: Supported.Client;
    // @ts-ignore
    profile: Profile.Client;
    // @ts-ignore
    gfxMode: GfxMode.Client;
    // @ts-ignore
    chargingLimit: Charge.Client;
    // @ts-ignore
    anime: Anime.Client;

    constructor() {
        // nothing
    }

    enable() {
        // since the rewrite of the init process panel button was not
        // completely destroyed on disable
        // at first I worked around it to try{} to create a new button
        // then I nulled it after destroy() in the hope this de-initialisies it
        // so we have to keep an eye on this one
        // I haven't tested if the button now is sucessfully destroyed on disable
        // and I kept this try{} still in to be sure
        // I just wanted to get the new version on extensions.gnome.org asap
        // this.panelButton = new Panel.Button();

        this.isDebug = false;

        this.getGexSettings();

        Log.info(`Initializing ${Me.metadata.name} version ${Me.metadata.version} on GNOME Shell ${Config.PACKAGE_VERSION}`);

        this.supported = new Supported.Client();
        this.supported.start();

        this.profile = new Profile.Client();
        this.gfxMode = new GfxMode.Client();

        if (this.supported.connector.supportedAttributes.charge)
            this.chargingLimit = new Charge.Client();

        if (this.supported.connector.supportedAttributes.anime)
            this.anime = new Anime.Client();


        Log.info(`Enabling ${Me.metadata.name} version ${Me.metadata.version}`);

        // create panel button (needs to be first in chain)
        // this.panelButton.create();
        this.panelButton = new Panel.AsusNb_Indicator();

        // starting clients (dbus)
        this.profile.start();
        this.gfxMode.start();

        if (this.supported.connector.supportedAttributes.charge)
            this.chargingLimit.start();

        if (this.supported.connector.supportedAttributes.anime)
            this.anime.start();
    }

    disable() {
        Log.info(`Disabling ${Me.metadata.name} version ${Me.metadata.version}`);

        this.supported.stop();

        this.profile.stop();

        this.gfxMode.stop();

        if (this.supported.connector.supportedAttributes.charge)
            this.chargingLimit.stop();

        if (this.supported.connector.supportedAttributes.anime)
            this.anime.stop();

        this.panelButton.destroy();
        //@ts-ignore
        this.panelButton = null;
    }

    getGexSettings(){
        try {
            this.settings = ExtensionUtils.getSettings();

            this.isDebug = this.getGexSetting('debug-enabled');
        } catch (e) {
            Log.debug('Error getting settings.', e);
        }
    }

    public getGexSetting(setting: string){
        try {
            return this.settings.get_boolean(setting);
        } catch (e){
            return false;
        }
    }
}

// @ts-ignore
function init() {
    ext = new Extension();
    return ext;
}
