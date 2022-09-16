declare const global: any, imports: any;
declare var asusctlGexInstance: Extension;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = imports.misc.extensionUtils.getCurrentExtension();

// const {Gio} = imports.gi;

import * as Log from './modules/log';
import * as Supported from './modules/supported';
import * as Charge from './modules/charge';
import * as Anime from './modules/anime';
import * as Panel from './modules/panel';
import * as Platform from './modules/platform';

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
    // @ts-ignore
    public superNotice: boolean;

    // extensions.gnome.org wants everything in enable()
    // so TS marks the following as errors when not initialised
    // in the constructor() - therefore @ts-ignore

    // @ts-ignore
    supported: Supported.Client;
    // @ts-ignore
    chargingLimit: Charge.Client;
    // @ts-ignore
    anime: Anime.Client;
    // @ts-ignore
    Platform: Platform.Client;

    constructor() {
        // nothing
    }

    enable() {
        this.isDebug = false;
        this.superNotice = false;

        this.getGexSettings();

        Log.info(`Initializing ${Me.metadata.name} version ${Me.metadata.version} on GNOME Shell ${Config.PACKAGE_VERSION}`);

        this.supported = new Supported.Client();
        this.supported.start();

        if (this.supported.connector.supportedAttributes.charge)
            this.chargingLimit = new Charge.Client();

        if (this.supported.connector.supportedAttributes.anime)
            this.anime = new Anime.Client();

        if (this.supported.connector.supportedAttributes.bios_overdrive || this.supported.connector.supportedAttributes.bios_toggleSound)
            this.Platform = new Platform.Client();

        Log.info(`Enabling ${Me.metadata.name} version ${Me.metadata.version}`);

        // create panel button (needs to be first in chain)
        // this.panelButton.create();
        this.panelButton = new Panel.AsusNb_Indicator();

        if (this.supported.connector.supportedAttributes.charge)
            this.chargingLimit.start();

        if (this.supported.connector.supportedAttributes.anime)
            this.anime.start();

        if (this.supported.connector.supportedAttributes.bios_overdrive || this.supported.connector.supportedAttributes.bios_toggleSound)
            this.Platform.start();
    }

    disable() {
        Log.info(`Disabling ${Me.metadata.name} version ${Me.metadata.version}`);

        this.supported.stop();

        if (this.supported.connector.supportedAttributes.charge)
            this.chargingLimit.stop();

        if (this.supported.connector.supportedAttributes.anime)
            this.anime.stop();

        if (this.supported.connector.supportedAttributes.bios_overdrive || this.supported.connector.supportedAttributes.bios_toggleSound)
            this.Platform.stop();

        this.panelButton.destroy();
        //@ts-ignore
        this.panelButton = null;
    }

    getGexSettings(){
        try {
            this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.asusctl-gex');

            this.isDebug = this.getGexSetting('debug-enabled');
            this.superNotice = this.getGexSetting('supernotice');

            Log.debug(this.superNotice.toString());
            
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

    public setGexSetting(setting: string, value: boolean){
        try {
            return this.settings.set_boolean(setting, value);
        } catch (e){
            return false;
        }
    }
}

// @ts-ignore
function init() {
    asusctlGexInstance = new Extension();
    return asusctlGexInstance;
}
