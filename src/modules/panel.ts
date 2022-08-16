declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const {main, panelMenu, messageTray} = imports.ui;
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

        // Profile indicator ->
        this._binProfile = new St.Bin({ 
            style_class: 'panel-bin-profile',
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this._iconProfile = new St.Icon({
            gicon: Gio.icon_new_for_string(`${Me.path}/icons/scalable/profile-boost.svg`),
            style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-profile'
        });

        this._binProfile.add_actor(this._iconProfile);

        this._indicatorLayout.add_child(this._binProfile);
        // <- Profile indicator

        // Graphics indicator (not attached, yet) ->
        this._binGpu = new St.Bin({ 
            style_class: 'panel-bin-gpu',
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this._iconGpu = new St.Icon({
            gicon: Gio.icon_new_for_string(`${Me.path}/icons/scalable/gpu-hybrid.svg`),
            style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-gpu'
        });

        this._binGpu.add_actor(this._iconGpu);
        // <- Graphics indicator

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

        main.panel.addToStatusArea('asusctl-gex.panel', this);
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

        // update panel class
        let profileRunningClass: string = ext.profile.isRunning() ? 'with-profiles' : 'without-profiles';
        ext.panelButton.style_class = `${profileRunningClass} ${ext.panelButton._defaultClasses} ${ext.profile.connector.lastState} ${ext.gfxMode.connector.gfxLabels[ext.gfxMode.connector.lastState]} ${ext.gfxMode.connector.powerLabel[ext.gfxMode.connector.lastStatePower]} ${ext.gfxMode.igpu}`;

        // update profile icon panel
        if (ext.profile.isRunning()){
            let profileIconName = ext.profile.connector.lastState;
            if (!['balanced', 'power-saver', 'performance'].includes(profileIconName))
                profileIconName = 'performance';
    
            ext.panelButton._iconProfile = new St.Icon({
                gicon: Gio.icon_new_for_string(`${Me.path}/icons/scalable/profile-${profileIconName}.svg`),
                style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-profile'
            });
            ext.panelButton._binProfile.add_actor(ext.panelButton._iconProfile);
        }

        // update gpu icon panel
        let warningIntegrated = false;
        if (ext.gfxMode.isRunning()){
            // TODO: this should be a method in gfx_mode_dbus (!) >
            let warningIntegrated = (ext.gfxMode.connector.lastStatePower == 0 && ext.gfxMode.connector.lastState == 1);
            try {
                let vid = parseInt(ext.gfxMode.connector.powerProfilesProxy.VendorSync());
                warningIntegrated = (ext.gfxMode.connector.isRunning() && vid == 1 && warningIntegrated)
                if (vid !== ext.gfxMode.connector.lastState)
                    ext.gfxMode.connector.lastState = vid;
            } catch {
                warningIntegrated = false;
            }
            // < TODO

            ext.panelButton._iconGpu = new St.Icon({
                gicon: Gio.icon_new_for_string(`${Me.path}/icons/scalable/gpu-${ext.gfxMode.connector.gfxLabels[ext.gfxMode.connector.lastState]}${(ext.gfxMode.connector.powerLabel[ext.gfxMode.connector.lastStatePower] == 'active' ? '-active' : '')}.svg`),
                style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-gpu'
            });
            ext.panelButton._binGpu.add_actor(ext.panelButton._iconGpu);
        }

        // update menu items
        let menuItems = main.panel.statusArea['asusctl-gex.panel'].menu._getMenuItems();
        menuItems.forEach((mi: { label: any; style_class: string; sensitive: boolean; active: boolean }) => {
            if (mi.style_class.includes(selector)) {
                if (selector == 'asusctl-gex-charge'){
                    mi.label.set_text(`Charging Limit: ${payload}%`);
                } else if (selector == 'gpupower'){
                    let gpuPowerLabel = warningIntegrated ? `integrated mode, dGPU ${payload}, please reboot` : `dedicated GPU: ${payload}`;
                    mi.label.set_text(gpuPowerLabel);
                    //@ts-ignore
                    mi.setIcon(Gio.icon_new_for_string(`${Me.path}/icons/scalable/dgpu-${ext.gfxMode.connector.powerLabel[ext.gfxMode.connector.getGpuPower()]}.svg`));
                } else {
                    if (mi.style_class.includes(payload) && mi.style_class.includes('active')) {
                        // ignore, don't change the text
                    } else if (mi.style_class.includes(payload) && !mi.style_class.includes('active')) {
                        mi.style_class = `${mi.style_class} active`;
                        mi.label.set_text(`${mi.label.text}  ✔`);
                    } else if (mi.style_class.includes('active')){
                        mi.style_class = mi.style_class.split('active').join(' ');
                        mi.label.set_text(mi.label.text.substr(0, mi.label.text.length-3));
                    }

                    // ACL
                    if (selector === 'gfx-mode') {
                        let curItem = ext.gfxMode.connector.gfxLabels.indexOf(
                            mi.style_class.split(' ').filter(el => ext.gfxMode.connector.gfxLabels.includes(el)).join().trim()
                        );
                        if (curItem != -1) {
                            let acl = ext.gfxMode.getAcl(ext.gfxMode.connector.lastState, curItem);
                            mi.sensitive = acl;
                            mi.active = acl;
                        }
                    }
                }
            }
        });
    }
}
