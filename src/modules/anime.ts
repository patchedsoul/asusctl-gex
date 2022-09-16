declare const global: any, imports: any;
declare var asusctlGexInstance: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const {main, popupMenu, slider} = imports.ui;
const {St, Gio} = imports.gi;

import * as Log from './log';
import * as DBus from './anime_dbus';
import { IStoppableModule } from '../interfaces/iStoppableModule';
import { IPopulatePopupModule } from '../interfaces/iPopulatePopupModule';

export class Client implements IStoppableModule, IPopulatePopupModule {
    connector: DBus.AnimeDbus = new DBus.AnimeDbus();
    connected: boolean = false;
    itemAnimeParent: any;
    itemAnimeSwitcher: any;
    _sliderDragging: boolean = false;
    _sliderChangedId: number = 0;
    animeBrightnessSlider: any;

    constructor() {
      // nothing for now
    }

    isRunning(): boolean {
        return (this.connected && this.connector && this.connector.isRunning());
    }

    start() {
        Log.debug(`Starting AniMe client...`);

        try {
            this.connector.start();
            this.connected = this.connector.isRunning();
            this.populatePopup();
        } catch (e) {
            Log.error(`AniMe client start failed!`, e);
        }
    }

    stop() {
        Log.debug(`Stopping AniMe client...`);

        if (this.isRunning()) {
            this.connected = false;
            this.connector.stop();
        }
    }

    populatePopup(): void {
      if (!this.isRunning())
        return;

      // get menu
      let menu = main.panel.statusArea['asusctl-gex.panel'].menu;

      // menuItemParent
      this.itemAnimeParent = new popupMenu.PopupBaseMenuItem({ activate: false, style_class: 'asusctl-gex-menu-item asusctl-gex-anime-item' });

      // headline
      const animeItemHeadline = new popupMenu.PopupMenuItem('AniMe Matrix', {hover: false, can_focus: false, style_class: 'headline headline-label asusctl-gex-menu-item'});
      animeItemHeadline.sensitive = false;
      animeItemHeadline.active = false;

      // icon
      let iconAnime = new St.Icon({
        gicon: Gio.icon_new_for_string(`${Me.path}/icons/scalable/anime.svg`),
        style_class: 'popup-menu-icon'
      });
      this.itemAnimeParent.add(iconAnime);

      // slider
      // currently not added (see below) because it does not seem to work as intended
      this.animeBrightnessSlider = new slider.Slider(0);
      this.animeBrightnessSlider._disabled = true;

      this.animeBrightnessSlider.connect('drag-begin', () => (this._sliderDragging = true));

      this.animeBrightnessSlider.value = 1;

      this._sliderChangedId = this.animeBrightnessSlider.connect('notify::value', () => {
        // let sliderValue = Math.round(255*this.animeBrightnessSlider.value);
        let sliderValue = Math.round(this.animeBrightnessSlider.value*100)/100;

        // don't update all the time while dragging but just on drag-end
        if (!this._sliderDragging && sliderValue !== this.connector.brightness){
          this.connector.brightness = sliderValue;
          this.connector.setBrightness(sliderValue);
        }
      });

      // react on scroll over the whole menu item parent, not just the slider itself
      //@ts-ignore
      this.itemAnimeParent.connect('scroll-event', (actor, event) => {
        return this.animeBrightnessSlider.emit('scroll-event', event);
      });

      this.animeBrightnessSlider.connect('drag-end', () => {
        this._sliderDragging = false;
        // let sliderValue = Math.round(255*this.animeBrightnessSlider.value);
        let sliderValue = Math.round(this.animeBrightnessSlider.value*100)/100;
        if (sliderValue !== this.connector.brightness){
          this.connector.brightness = sliderValue;
          this.connector.setBrightness(sliderValue);
        }
      });

      // switch
      let bulbIcon = new St.Icon({
        gicon: Gio.icon_new_for_string(`${Me.path}/icons/scalable/bulb-on.svg`),
        style_class: 'asusctl-gex-switch-button-icon active'
      });

      this.itemAnimeSwitcher = new St.Button({
        style_class: 'asusctl-gex-switch-button active',
        accessible_name: 'On',
        child: bulbIcon,
      });

      //@ts-ignore
      this.itemAnimeSwitcher.connect('clicked', (object, value) => {
        this.connector.setOnOffState(null);
        
        if (this.itemAnimeSwitcher.style_class.includes('active')){
          this.itemAnimeSwitcher.style_class = this.itemAnimeSwitcher.style_class.split('active').join(' ');
          bulbIcon.gicon = Gio.icon_new_for_string(`${Me.path}/icons/scalable/bulb-off.svg`);
        } else {
          this.itemAnimeSwitcher.style_class = `${this.itemAnimeSwitcher.style_class} active`;
          bulbIcon.gicon = Gio.icon_new_for_string(`${Me.path}/icons/scalable/bulb-on.svg`);
        }
      });

      this.itemAnimeParent.add(iconAnime);
      this.itemAnimeParent.add_child(this.animeBrightnessSlider);
      this.itemAnimeParent.add_child(this.itemAnimeSwitcher);

      menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem());
      menu.addMenuItem(animeItemHeadline);
      menu.addMenuItem(this.itemAnimeParent);
  }
}
