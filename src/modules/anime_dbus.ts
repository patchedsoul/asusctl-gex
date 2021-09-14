declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Panel from './panel';
import * as Resources from './resources';
import { IStoppableModule } from '../interfaces/iStoppableModule';

const {Gio} = imports.gi;

export class AnimeDbus implements IStoppableModule {
    asusLinuxProxy: any = null; // type: Gio.DbusProxy (donno how to add)
    connected: boolean = false;
    state: boolean = true;
    brightness: number = 255;

    constructor() {
        // nothing for now
    }

    // currently there is no DBUS method because this can't be read from
    // hardware (as to @fluke).
    // https://gitlab.com/asus-linux/asusctl/-/issues/138

    // public getOnOffState() {
    //     if (this.isRunning()) {
    //         try {
    //             let currentState = this.asusLinuxProxy.AwakeEnabled;

    //             return currentState;
    //         } catch (e) {
    //             Log.error(`Failed to fetch AniMe!`, e);
    //         }
    //     }

    //     return this.state;
    // }

    public setOnOffState(state: boolean | null) {
        if (this.isRunning()) {
            try {
                // if null, toggle the current state
                state = (state == null ? !this.state : state);

                if (this.state !== state) {
                    this.state = state;
                }
                Log.info(`Setting AniMe Power to ${state}`);
                return this.asusLinuxProxy.SetOnOffSync(state);
            } catch (e) {
                Log.error(`AniMe DBus set power failed!`, e);
            }
        }
    }

    public setBrightness(brightness: number) {
      if (this.isRunning()) {
          try {
              if (this.brightness !== brightness) {
                  this.brightness = brightness;
              }
              Log.info(`Setting AniMe Brightness to ${brightness}`);
              return this.asusLinuxProxy.SetBrightnessSync(brightness);
              // Panel.Actions.spawnCommandLine(`asusctl anime leds -b ${brightness}`);
          } catch (e) {
              Log.error(`AniMe DBus set brightness failed!`, e);
          }
      }
    }

    isRunning(): boolean {
        return this.connected;
    }

    async start() {
        Log.info(`Starting AniMe DBus client...`);

        try {
            // creating the proxy
            let xml = Resources.File.DBus('org-asuslinux-anime-4')
            this.asusLinuxProxy = new Gio.DBusProxy.makeProxyWrapper(xml)(
                Gio.DBus.system,
                'org.asuslinux.Daemon',
                '/org/asuslinux/Anime'
            );

            this.connected = true;
            
            // currently there is no DBUS method because this can't be read from
            // hardware (as to @fluke).
            // https://gitlab.com/asus-linux/asusctl/-/issues/138
            /* 
              this.asusLinuxProxy.connectSignal(
                  "NotifyCharge",
                  (proxy: any = null, name: string, data: string) => {
                      if (proxy) {
                          Log.info(`AniMe Power State has changed to ${data}% (${name}).`);
                      }
                  }
              );
            */
        } catch (e) {
            Log.error(`AniMe DBus initialization failed!`, e);
        }
    }

    stop() {
        Log.info(`Stopping AniMe DBus client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.asusLinuxProxy = null;
            this.state = true;
        }
    }
}