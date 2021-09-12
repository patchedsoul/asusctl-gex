declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as Log from './log';
import * as Popup from './popup';
import {IDestroyableModule} from '../interfaces/iDestroyableModule';


const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const PanelMenu = imports.ui.panelMenu;
const St = imports.gi.St;

export const Title = 'ASUS Notebook Control';

export class Button implements IDestroyableModule {
    public indicator: any;

    AsusNb_Indicator = new Lang.Class({
        Name: 'asusctl-gex-indicator',
        Extends: PanelMenu.Button,

        _init: function(){
            this.parent(null, 'AsusNbPanel');

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
                style_class: ' panel-bin-profile',
                reactive: true,
                can_focus: true,
                track_hover: true
            });

            this._binGpu = new St.Bin({ 
                style_class: 'panel-bin-gpu',
                reactive: true,
                can_focus: true,
                track_hover: true
            });

            this._iconProfile = new St.Icon({
                gicon: Gio.icon_new_for_string(`${Me.path}/icons/scalable/profile-boost.svg`),
                style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-profile'
            });

            this._iconGpu = new St.Icon({
                gicon: Gio.icon_new_for_string(`${Me.path}/icons/scalable/gpu-hybrid.svg`),
                style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-gpu'
            });

            this._binProfile.add_actor(this._iconProfile);
            this._binGpu.add_actor(this._iconGpu);

            this._indicatorLayout.add_child(this._binProfile);
            this._indicatorLayout.add_child(this._binGpu);

		    this.add_child(this._indicatorLayout);

            // populating panelMenu (extend)
            this.popupMenu = new Popup.Menu(this.menu);

            this.menu.connect('open-state-changed', Lang.bind(this._indicatorLayout, () => {
                if (this._indicatorLayout.style_class.includes('active')){
                    this._indicatorLayout.style_class = this._indicatorLayout.style_class.split('active').join(' ');
                } else {
                    this._indicatorLayout.style_class = `${this._indicatorLayout.style_class} active`;
                }
            }));
        }
    });

    public create(): void {
        this.indicator = new this.AsusNb_Indicator();

        Main.panel.addToStatusArea('asusctl-gex.panel', this.indicator);
    }

    public destroy(): void {
        if (this.indicator !== null) {
            this.indicator.destroy();
            this.indicator = null;
        }
    }
}

export class Actions {
    public static spawnCommandLine(command: string) {
        try {
            GLib.spawn_command_line_async(command);
        } catch (e) {
            Log.error(`Spawning command failed: ${command}`, e);
        }
    }

    public static notify(msg:string = Title, details:string, icon: string, action: string = "") {
        let gIcon = Gio.icon_new_for_string(`${Me.path}/icons/${icon}`);
        let params = { gicon: gIcon};
        let source = new MessageTray.Source(msg, icon, params);
        let notification = new MessageTray.Notification(source, msg, details, params);
        
        Main.messageTray.add(source);
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
        // TODO: this should be a method in gfx_mode_dbus (!)
        let warningIntegrated = (ext.gfxMode.connector.lastStatePower == 0 && ext.gfxMode.connector.lastState == 1);
        try {
            let vid = parseInt(ext.gfxMode.connector.asusLinuxProxy.VendorSync());
            warningIntegrated = (ext.gfxMode.connector.isRunning() && vid == 1 && warningIntegrated)
            if (vid !== ext.gfxMode.connector.lastState)
                ext.gfxMode.connector.lastState = vid;
        } catch {
            warningIntegrated = false;
        }

        // update panel class
        ext.panelButton.indicator.style_class = `${ext.panelButton.indicator._defaultClasses} ${ext.profile.connector.lastState} ${ext.gfxMode.connector.gfxLabels[ext.gfxMode.connector.lastState]} ${ext.gfxMode.connector.powerLabel[ext.gfxMode.connector.lastStatePower]} ${ext.gfxMode.igpu}`;

        // update profile icon panel
        let profileIconName = ext.profile.connector.lastState;
        if (!['normal', 'silent', 'boost'].includes(profileIconName))
            profileIconName = 'boost';

        ext.panelButton.indicator._iconProfile = new St.Icon({
            gicon: Gio.icon_new_for_string(`${Me.path}/icons/scalable/profile-${profileIconName}.svg`),
            style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-profile'
        });
        ext.panelButton.indicator._binProfile.add_actor(ext.panelButton.indicator._iconProfile);

        // update gpu icon panel
        ext.panelButton.indicator._iconGpu = new St.Icon({
            gicon: Gio.icon_new_for_string(`${Me.path}/icons/scalable/gpu-${ext.gfxMode.connector.gfxLabels[ext.gfxMode.connector.lastState]}${(ext.gfxMode.connector.powerLabel[ext.gfxMode.connector.lastStatePower] == 'active' ? '-active' : '')}.svg`),
            style_class: 'asusctl-gex-panel-icon asusctl-gex-panel-icon-gpu'
        });
        ext.panelButton.indicator._binGpu.add_actor(ext.panelButton.indicator._iconGpu);

        // update menu items
        let menuItems = Main.panel.statusArea['asusctl-gex.panel'].menu._getMenuItems();
        menuItems.forEach((mi: { label: any; style_class: string; sensitive: boolean; active: boolean }) => {
            if (mi.style_class.includes(selector)) {
                if (selector == 'asusctl-gex-charge'){
                    mi.label.set_text(`Charging Limit: ${payload}%`);
                } else if (selector == 'gpupower'){
                    mi.style_class = `${selector} ${payload}`;
                    if (warningIntegrated){
                        mi.label.set_text(`integrated mode, dGPU ${payload}, please reboot`);
                    } else {
                        mi.label.set_text(`dedicated GPU: ${payload}`);
                    }
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
