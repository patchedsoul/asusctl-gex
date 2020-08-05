declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as FanModeBase from './fanmode';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const ByteArray = imports.byteArray;
const GLib = imports.gi.GLib;

export class FanMode implements IStoppableModule {
    sourceId: any = null;
    enabled: boolean = false;
    lastState = -1;

    poller() {
        try {
            // TODO: replace with gshema
            let curState = parseInt(ByteArray.toString(GLib.file_get_contents(
                "/sys/devices/platform/asus-nb-wmi/throttle_thermal_policy"
            )[1]), 10);

            if (curState !== undefined && !isNaN(curState)  && this.lastState !== curState) {
                let message = ((this.lastState === -1)?'initial':'changed') + ' fan-mode: ' + FanModeBase.FanModeDescr[curState];

                // update state
                this.lastState = curState;

                Panel.Actions.notify(
                    Panel.Title, 
                    message,
                    FanModeBase.FanModeIcons[curState], 
                    FanModeBase.FanModeColor[curState]
                );
            }
        } finally {
            return this.enabled ? GLib.SOURCE_CONTINUE : false;
        }
    }

    public start() {
        Log.info(`Starting Poller client...`);
        try {
            this.sourceId = GLib.timeout_add(
                GLib.PRIORITY_DEFAULT,
                250,
                this.poller.bind(this)
            );
            this.enabled = true;
        } catch {
            Log.error(`Poller client start() failed!`);
        }
    }

    public stop() {
        Log.info(`Stopping Poller client...`);
        try {
            this.enabled = false;
            if(this.sourceId !== null) {
                // remove the callback loop
                GLib.g_source_remove(this.sourceId);
            }
        } catch {
            Log.error(`Poller client stop() failed!`);
        }
    }
}
