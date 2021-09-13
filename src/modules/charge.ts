declare const global: any, imports: any;
declare var ext: any;
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
    chargeLimitLabel: any;
    chargingLimitSlider: any;
    menuItemChargeLimit: any;

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

      // icon
      let iconCharge = new St.Icon({ style_class: 'popup-menu-icon' });
      iconCharge.icon_name = 'battery-symbolic';
      this.menuItemChargeLimit.add(iconCharge);

      // slider
      let valueInit = parseInt(ext.chargingLimit.connector.getChargingLimit())/100;
      this.chargingLimitSlider = new slider.Slider(0);

      this.chargingLimitSlider.connect('drag-begin', () => (this._sliderDragging = true));

      this.chargingLimitSlider.value = valueInit;

      this.chargingLimitSlider.connect('notify::value', () => {
        let sliderValue = Math.round(this.chargingLimitSlider.value*100);
        if (sliderValue !== this.connector.lastState){
          this.connector.lastState = sliderValue;
          ext.chargingLimit.connector.setChargingLimit(sliderValue);
        } 
        this.chargeLimitLabel.set_text(`${sliderValue}%`);
      });

      this.chargingLimitSlider.connect('scroll-event', () => {
        return false;
      });

      this.chargingLimitSlider.connect('drag-end', () => {
        this._sliderDragging = false;
        let sliderValue = Math.round(this.chargingLimitSlider.value*100);
        if (sliderValue !== this.connector.lastState){
          this.connector.lastState = sliderValue;
          ext.chargingLimit.connector.setChargingLimit(sliderValue);
        } 
        this.chargeLimitLabel.set_text(`${sliderValue}%`);
      });

      //@ts-ignore
      // this.menuItemChargeLimit.connect('scroll-event', (actor:any, event:any) => {
      //   return this.chargingLimitSlider.emit('scroll-event', event);
      // });

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
