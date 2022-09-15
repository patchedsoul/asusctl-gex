declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const {main, popupMenu, panelMenu, messageTray} = imports.ui;
const {Gio, GObject, GLib, St} = imports.gi;
const Lang = imports.lang;

import * as Log from './log';
import * as Popup from './popup';

export const Title = 'ASUS Notebook Control';

export const AsusNb_Indicator = GObject.registerClass(
    class XRControlIndicator extends panelMenu.Button {
      _init() {
        super._init(0.0, "AsusNbPanel");

        this._defaultClasses = 'panel-status-button asusctl-gex-panel-button';

        this.style_class = this._defaultClasses;

        this._indicatorLayout = new St.BoxLayout({
            vertical: false,
            style_class: 'asusctl-gex-panel-layout system-status-icon panel-button',
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this._binProfile = new St.Bin({ 
            style_class: 'panel-bin-profile',
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this._iconProfile = new St.Icon({
            gicon: Gio.icon_new_for_string(`${Me.path}/icons/scalable/rog-logo.svg`),
            style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-profile'
        });

        this._binProfile.add_actor(this._iconProfile);

        this._indicatorLayout.add_child(this._binProfile);

        // add indicator to panel icon
        this.add_child(this._indicatorLayout);

        // populating panelMenu (extend)
        this.popupMenu = new Popup.Menu();

        this.menu.connect('open-state-changed', Lang.bind(this._indicatorLayout, (_: any, open: boolean) => {
            if (open)
                this._indicatorLayout.add_style_pseudo_class('active');
            else
                this._indicatorLayout.remove_style_pseudo_class('active');

        }));

        const rogcontrolcenterItemHeadline = new popupMenu.PopupMenuItem('ROG Control Center', {hover: false, can_focus: false, style_class: 'headline headline-label asusctl-gex-menu-item'});
        rogcontrolcenterItemHeadline.sensitive = false;
        rogcontrolcenterItemHeadline.active = false;

        this.menu.addMenuItem(rogcontrolcenterItemHeadline);

        const rogcontrolcenterItem = new popupMenu.PopupImageMenuItem(
            'Open ROG Control Center',
            Gio.icon_new_for_string(`${Me.path}/icons/scalable/rog-logo.svg`)
        )
        rogcontrolcenterItem.connect('activate', () => {
            this.spawnCommandLine('rog-control-center')
        });
        this.menu.addMenuItem(
            rogcontrolcenterItem
        );
        this.menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem());

        main.panel.addToStatusArea('asusctl-gex.panel', this);
      }

      spawnCommandLine(command: string) {
        try {
            GLib.spawn_command_line_async(command);
        } catch (e) {
            Log.error(`Spawning command failed: ${command}`, e);
        }
      }
    }
);

export class Actions {
    public static spawnCommandLine(command: string) {
        try {
            GLib.spawn_command_line_async(command);
        } catch (e) {
            Log.error(`Spawning command failed: ${command}`, e);
        }
    }

    public static notify(msg:string = Title, details:string, icon: string, action: string = "") {
        if (ext.getGexSetting('notifications-enabled') == false) return false;

        let gIcon = Gio.icon_new_for_string(`${Me.path}/icons/${icon}`);
        let params = { gicon: gIcon};
        let source = new messageTray.Source(msg, icon, params);
        let notification = new messageTray.Notification(source, msg, details, params);
        
        main.messageTray.add(source);
        notification.setTransient(true);

        if (action == 'reboot'){
            notification.setUrgency(3);
            notification.addAction('Reboot Now!', () => {this.spawnCommandLine('systemctl reboot')});
        } else if (action == 'logout'){
            notification.setUrgency(3);
            notification.addAction('Log Out Now!', () => {this.spawnCommandLine('gnome-session-quit')});
        } else {
            notification.setUrgency(2);
        }

        source.showNotification(notification);
    }

    public static updateMode(selector:string, payload:string) {
        if (ext.panelButton == null) return false;

        // update menu items
        let menuItems = main.panel.statusArea['asusctl-gex.panel'].menu._getMenuItems();
        menuItems.forEach((mi: { label: any; style_class: string; sensitive: boolean; active: boolean }) => {
            if (mi.style_class.includes(selector)) {
                if (selector == 'asusctl-gex-charge'){
                    mi.label.set_text(`Charging Limit: ${payload}%`);
                }
            }
        });
    }
}
