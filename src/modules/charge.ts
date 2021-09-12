declare const global: any, imports: any;
declare var ext: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

// needed for menu manipulations
const Main = imports.ui.main;
const PM = imports.ui.popupMenu;
const ModalDialog = imports.ui.modalDialog;
const Dialog = imports.ui.dialog;
const St = imports.gi.St;
// const Clutter = imports.gi.Clutter;
const GObject = imports.gi.GObject;

import * as Log from './log';
import * as DBus from './charge_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';
import { IPopulatePopupModule } from '../interfaces/iPopulatePopupModule';

var ChangeChargingLimitDialog = GObject.registerClass(
class ChangeChargingLimitDialog extends ModalDialog.ModalDialog {
    _init() {
        super._init({ styleClass: 'access-dialog' });

        let title = 'Battery Charge Limit';
        let description = 'Please enter a valid value from 1 to 100:';
        
        let content = new Dialog.MessageDialogContent({ title, description });
        this.contentLayout.add_actor(content);

        // let bodyLabel = new St.Label({
        //     text: 'This is the body text',
        //     x_align: Clutter.ActorAlign.CENTER,
        // });
        // content.add_child(bodyLabel);

        this._entry = new St.Entry({
          style_class: 'asusctl-gex-entry'
        });

        content.add_child(this._entry);

        this.addButton({
          label: 'Discard and close',
          action: () => {
            this.close(true);
          },
          default: true
        });

        this.addButton({
          label: 'Apply charging limit',
          action: () => {
            this.close(true);
            this.connect('closed', () => {
              try {
                ext.chargingLimit.connector.setChargingLimit(this._entry.text);
              } catch (e) {
                Log.error('Not able to set the charging limit!', e);
              }
            });
          },
          default: true
        });
    }
});

export class Client implements IStoppableModule, IPopulatePopupModule {
    connector: DBus.ChargingLimit = new DBus.ChargingLimit();
    connected: boolean = false;

    constructor() {        
        try {
            this.connector = new DBus.ChargingLimit("org-asuslinux-charge-2.0.5");
        } catch(e) {
            Log.error(`Charge-Limit client initialization failed!`, e);
        }
    }

    isRunning(): boolean {
        return (this.connected && this.connector && this.connector.isRunning());
    }

    start() {
        Log.info(`Starting Charging Limit client...`);

        try {
            this.connector.start();
            this.connected = this.connector.isRunning();
            this.populatePopup();
        } catch (e) {
            Log.error(`Charging Limit client start failed!`, e);
        }
    }

    stop() {
        Log.info(`Stopping Charge Limit client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.connector.stop();
        }
    }

    showModal(){
      //@ts-ignore
      let modalChargeLimit = new ChangeChargingLimitDialog(this.connector);
      modalChargeLimit.open();
    }

    populatePopup(): void {
      if (!this.isRunning())
        return;

      // get menu and its items
      let menu = Main.panel.statusArea['asusctl-gex.panel'].menu;

      const chargingLimitItemHeadline = new PM.PopupMenuItem('Battery Charge Limit', {hover: false, can_focus: false, style_class: 'headline-label'});

      let chargingLimitItem = new PM.PopupMenuItem(`Charging Limit: ${this.connector.lastState}%`, {
        style_class: `asusctl-gex-charge`
      });

      chargingLimitItem.connect('activate', () => {
        try {
          this.showModal();
        } catch (e:any) {
          Log.error(e.toString());
        }
      });

      menu.addMenuItem(new PM.PopupSeparatorMenuItem());
      menu.addMenuItem(chargingLimitItemHeadline);
      menu.addMenuItem(chargingLimitItem);
  }
}
