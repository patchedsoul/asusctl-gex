declare const global: any, imports: any;
declare var asusctlGexInstance: any;
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
      superRemoved:boolean = false;

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
        );
        rogcontrolcenterItem.connect('activate', () => {
            this.spawnCommandRog();
        });
        this.menu.addMenuItem(
            rogcontrolcenterItem
        );
        this.menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem());


        this.hintSuperHead = new popupMenu.PopupMenuItem('GPU Mode moved', {hover: false, can_focus: false, style_class: 'headline headline-label asusctl-gex-menu-item'});
        this.hintSuperHead.sensitive = false;
        this.hintSuperHead.active = false;

        this.hintSuper = new popupMenu.PopupMenuItem('install supergfxctl-gex', {style_class: 'asusctl-gex-menu-item'});
        this.hintSuper.connect('activate', () => {
            try {
                GLib.spawn_command_line_async('xdg-open https://extensions.gnome.org/extension/5344/supergfxctl-gex/');
            } catch (error) {
                Log.error('error opening https://extensions.gnome.org/extension/5344/supergfxctl-gex/')
            }
        });
        this.hintSuperHeaddesc = new popupMenu.PopupMenuItem("This hint does not appear\nif you either install 'Super Graphics Control'\nor disable this hint in the extension settings", {hover: false, can_focus: false, style_class: 'asusctl-gex-menu-item'});
        this.hintSuperHeaddesc.sensitive = false;
        this.hintSuperHeaddesc.active = false;

        this.superSeperator = new popupMenu.PopupSeparatorMenuItem();

        this.menu.addMenuItem(this.hintSuperHead, 0);
        this.menu.addMenuItem(this.hintSuperHeaddesc, 1);
        this.menu.addMenuItem(this.hintSuper, 2);
        this.menu.addMenuItem(this.superSeperator, 3);

        this.getSuper();
        main.extensionManager.connectObject('extension-state-changed', this.getExtension.bind(this), this);
        
        main.panel.addToStatusArea('asusctl-gex.panel', this);
      }

      //@ts-ignore
      extract({ uuid, state, type, hasPrefs, metadata: { name, url } }) {
        return uuid;
      }
      //@ts-ignore
      getExtension(mgr_, ext) {
        const uuid = this.extract(ext);
        Log.debug(uuid.toLowerCase());
        if (uuid.toLowerCase() == "supergfxctl-gex@asus-linux.org" || asusctlGexInstance.getGexSetting('supernotice')) {
            this.removeSuperItem();
        }
      }

      removeSuperItem() {
        if (!this.superRemoved){
            this.hintSuperHead?.destroy();
            this.hintSuperHead = null;
            this.hintSuperHeaddesc?.destroy();
            this.hintSuperHeaddesc = null;
            this.hintSuper?.destroy();
            this.hintSuper = null;
            this.superSeperator?.destroy();
            this.superSeperator = null;
            this.superRemoved = true;
        }
      }

      getSuper(){
        main.extensionManager.getUuids().forEach((uuid:string) => {
            if (uuid == "supergfxctl-gex@asus-linux.org" || asusctlGexInstance.getGexSetting('supernotice')) {
                this.removeSuperItem();
            }
        });
        return false;
      }

      spawnCommandRog() {
        try {
            GLib.spawn_command_line_async('rog-control-center');
        } catch (e) {
            this.spawnCommandRogPage();
        }
      }
      spawnCommandRogPage() {
        try {
            GLib.spawn_command_line_async('xdg-open https://gitlab.com/asus-linux/asusctl#gui');
        } catch (e) {
            Log.error(`Spawning command failed`, e);
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
        if (asusctlGexInstance.getGexSetting('notifications-enabled') == false) return false;

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
        if (asusctlGexInstance.panelButton == null) return false;

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
