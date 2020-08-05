declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
const GLib = imports.gi.GLib;

export class File {
    public static DBus(name: string) {
        let file = `${Me.path}/resources/dbus/${name}.xml`;
        try {
            let [_ok, bytes] = GLib.file_get_contents(file)
            if (!_ok)
                Log.warn(`Couldn't read contents of "${file}"`);
            return _ok ? imports.byteArray.toString(bytes) : null;
        } catch (e) {
            Log.error(`Failed to load "${file}"`);
        }
    }
}
