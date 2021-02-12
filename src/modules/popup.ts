declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const PM = imports.ui.popupMenu;

export class Menu {
    constructor(menu: any) {
        let  menuItems: any = {
            gfxHeadline: new PM.PopupMenuItem('Graphics Mode', {hover: false, can_focus: false, style_class: 'headline gfx'}),
            init_gfx: new PM.PopupMenuItem('Graphics mode not initialized', {hover: false, can_focus: false, style_class: 'none gfx-mode'}),
            seperator1: new PM.PopupSeparatorMenuItem(),
            fanHeadline: new PM.PopupMenuItem('Profile', {hover: false, can_focus: false, style_class: 'headline fan'}),
            init_profile: new PM.PopupMenuItem('Profiles not initialized', {hover: false, can_focus: false, style_class: 'none fan-mode'}),
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
