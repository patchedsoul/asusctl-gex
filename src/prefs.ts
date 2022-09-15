declare const global: any, imports: any;
declare var ext: any;

// @ts-ignore
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

// import * as Log from './modules/log';

const {GObject, Gio, Gtk} = imports.gi;

const asusctlGexPreferencesWindow = GObject.registerClass({
    GTypeName: 'asusctl-gex-preferences',
    Template: Me.dir.get_child('prefs.ui').get_uri(),
    InternalChildren: [
        'notifications_enabled',
        'debug_enabled',
        'supernotice'
    ],
}, class asusctlGexPreferencesWindow extends Gtk.Box {

    // @ts-ignore
    _init(preferences) {
        super._init();
        this._preferences = preferences;
        this._preferences.connect('changed', this._syncPreferences.bind(this));

        // Initialize application state
        this._syncPreferences();

        //@ts-ignore
        this._notifications_enabled.connect('state-set', (event: any, state: boolean) => !this._preferences.set_boolean('notifications-enabled', state));

        //@ts-ignore
        this._debug_enabled.connect('state-set', (event: any, state: boolean) => !this._preferences.set_boolean('debug-enabled', state));
    }

    _syncPreferences() {
        this._notifications_enabled.active = this._preferences.get_boolean('notifications-enabled');

        this._debug_enabled.active = this._preferences.get_boolean('debug-enabled');
    }
});

// @ts-ignore
function buildPrefsWidget() {
    const preferences = ExtensionUtils.getSettings('org.gnome.shell.extensions.asusctl-gex');
    return new asusctlGexPreferencesWindow(preferences);
}

// @ts-ignore
function init() {
    // ExtensionUtils.initTranslations();
}