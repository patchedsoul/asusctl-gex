declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const PM = imports.ui.popupMenu;
const Config = imports.misc.config;

export class Menu {
    constructor(menu: any) {
        let menuItems: any;

        if (parseInt(Config.PACKAGE_VERSION) < 41){
            menuItems = {
                fanHeadline: new PM.PopupMenuItem('Profile', {hover: false, can_focus: false, style_class: 'headline fan'}),
                init_profile: new PM.PopupMenuItem('Profiles not initialized', {hover: false, can_focus: false, style_class: 'none fan-mode'}),
            }
        }

        for (const item in menuItems){
            menu.addMenuItem(menuItems[item]);

            if (menuItems[item].style_class.includes('headline')) {
                // add CSS class to the label of headlines to style them
                menuItems[item].label.style_class = 'headline-label';
            }
        }
    }
}
