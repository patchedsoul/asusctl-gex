declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const PM = imports.ui.popupMenu;
const Gio = imports.gi.Gio;

export class Menu {
    createMenu(menu: any): void {

        let  menuItems: any = {
            gfxHeadline: new PM.PopupMenuItem('Graphics Mode', {style_class: 'headline'}),
            integrated: new PM.PopupMenuItem('integrated', {style_class: 'integrated gfx-mode'}),
            hybrid: new PM.PopupMenuItem('hybrid', {style_class: 'hybrid gfx-mode'}),
            compute: new PM.PopupMenuItem('compute', {style_class: 'compute gfx-mode'}),
            dedicated: new PM.PopupMenuItem('nvidia', {style_class: 'nvidia gfx-mode'}),
            seperator1: new PM.PopupSeparatorMenuItem(),
            fanHeadline: new PM.PopupMenuItem('Fan Mode', {style_class: 'headline'}),
            silent: new PM.PopupMenuItem('silent', {style_class: 'silent fan-mode'}),
            normal: new PM.PopupMenuItem('normal', {style_class: 'normal fan-mode'}),
            boost: new PM.PopupMenuItem('boost', {style_class: 'boost fan-mode'}),
        }

        for (const item in menuItems){
            menu.addMenuItem(menuItems[item]);

            if (menuItems[item].style_class.includes('headline')) {
                menuItems[item].label.style_class = 'headline-label';
            }

            if (menuItems[item].style_class.includes('gfx-mode')) {
                menuItems[item].connect('activate', () => {this.gfxModeCallback(item)});
            }

            if (menuItems[item].style_class.includes('fan-mode')) {
                menuItems[item].connect('activate', () => {this.fanModeCallback(item)});
            }
        }
    }

    gfxModeCallback(mode: string): void {
        // modal dialog should be shown here

        let subprocess = new Gio.Subprocess({
            argv: `asusctl graphics -m ${mode} -f`.split(' '),
            flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        });

        subprocess.init(null);
        subprocess.communicate_utf8_async(null, null).bind(this);
    }

    fanModeCallback(mode: string): void {
        let subprocess = new Gio.Subprocess({
            argv: `asusctl profile ${mode}`.split(' '),
            flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        });

        subprocess.init(null);
        subprocess.communicate_utf8_async(null, null).bind(this);
    }
}
