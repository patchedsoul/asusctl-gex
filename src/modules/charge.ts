declare const global: any, imports: any;
declare var asusctlGexInstance: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const {main, popupMenu, slider} = imports.ui;
const {St} = imports.gi;

import * as Log from './log';
import * as DBus from './charge_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';
import { IPopulatePopupModule } from '../interfaces/iPopulatePopupModule';

export class Client implements IStoppableModule, IPopulatePopupModule {
    connector: DBus.ChargingLimit = new DBus.ChargingLimit();
    connected: boolean = false;
    _sliderDragging: boolean = false;
    _sliderChangedId: number = 0;
    chargeLimitLabel: any;
    chargingLimitSlider: any;
    menuItemChargeLimit: any;

    constructor() {
      // nothing for now
    }

    isRunning(): boolean {
        return (this.connected && this.connector && this.connector.isRunning());
    }

    start() {
        Log.debug(`Starting Charging Limit client...`);

        try {
            this.connector.start();
            this.connected = this.connector.isRunning();
            this.populatePopup();
        } catch (e) {
            Log.error(`Charging Limit client start failed!`, e);
        }
    }

    stop() {
        Log.debug(`Stopping Charge Limit client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.connector.stop();
        }
    }

    showModal(): void {
      //@ts-ignore
      let modalChargeLimit = new ChangeChargingLimitDialog(this.connector);
      modalChargeLimit.open();
    }

    populatePopup(): void {
      if (!this.isRunning())
        return;

      // get menu
      let menu = main.panel.statusArea['asusctl-gex.panel'].menu;

      // menuItemParent
      this.menuItemChargeLimit = new popupMenu.PopupBaseMenuItem({ activate: false, style_class: 'asusctl-gex-menu-item asusctl-gex-battery-item' });

      // headline
      const chargingLimitItemHeadline = new popupMenu.PopupMenuItem('Battery Charge Limit', {hover: false, can_focus: false, style_class: 'headline headline-label asusctl-gex-menu-item'});
      chargingLimitItemHeadline.sensitive = false;
      chargingLimitItemHeadline.active = false;

      // icon
      let iconCharge = new St.Icon({ style_class: 'popup-menu-icon' });
      iconCharge.icon_name = 'battery-symbolic';
      this.menuItemChargeLimit.add(iconCharge);

      // slider
      let valueInit = parseInt(asusctlGexInstance.chargingLimit.connector.getChargingLimit())/100;
      this.chargingLimitSlider = new slider.Slider(0);

      this.chargingLimitSlider.connect('drag-begin', () => (this._sliderDragging = true));

      this.chargingLimitSlider.value = valueInit;

      this._sliderChangedId = this.chargingLimitSlider.connect('notify::value', () => {
        let sliderValue = Math.round(this.chargingLimitSlider.value*100);
        this.chargeLimitLabel.set_text(`${sliderValue}%`);

        // don't update all the time while dragging but just on drag-end
        if (!this._sliderDragging && sliderValue !== this.connector.lastState){
          this.connector.lastState = sliderValue;
          this.connector.setChargingLimit(sliderValue);
        }
      });

      // react on scroll over the whole menu item parent, not just the slider itself
      //@ts-ignore
      this.menuItemChargeLimit.connect('scroll-event', (actor, event) => {
        return this.chargingLimitSlider.emit('scroll-event', event);
      });

      this.chargingLimitSlider.connect('drag-end', () => {
        this._sliderDragging = false;
        let sliderValue = Math.round(this.chargingLimitSlider.value*100);
        if (sliderValue !== this.connector.lastState){
          this.connector.lastState = sliderValue;
          this.connector.setChargingLimit(sliderValue);
        } 
        this.chargeLimitLabel.set_text(`${sliderValue}%`);
      });

      // label
      this.chargeLimitLabel = new St.Label(
        {
          text: `${valueInit*100}%`,
          style_class: 'asusctl-gex-battery-slider-label'
        }
      );

      this.menuItemChargeLimit.add(iconCharge);
      this.menuItemChargeLimit.add_child(this.chargingLimitSlider);
      this.menuItemChargeLimit.add(this.chargeLimitLabel);

      menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem());
      menu.addMenuItem(chargingLimitItemHeadline);
      menu.addMenuItem(this.menuItemChargeLimit);
  }
}
