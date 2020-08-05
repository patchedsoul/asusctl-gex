declare const global: any, imports: any;
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './modules/log';
import * as Fanmode from './modules/fanmode';
import * as Panel from './modules/panel';

import {IEnableableModule} from './interfaces/iEnableableModule';

export class Extension implements IEnableableModule {
    panelButton: Panel.Button;
    fanMode: Fanmode.Client;

    constructor() {
        Log.info(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
        this.panelButton = new Panel.Button();
        this.fanMode = new Fanmode.Client();
    }

    enable() {
        Log.info(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);
        this.panelButton.create();
        this.fanMode.start();
    }

    disable() {
        Log.info(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);
        this.fanMode.stop();
        this.panelButton.destroy();
    }
}

let ext: Extension | null = null;

// @ts-ignore
function init() {
    ext = new Extension();
    return ext;
}
