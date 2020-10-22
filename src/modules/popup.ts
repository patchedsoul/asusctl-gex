declare const global: any, imports: any;
//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const PM = imports.ui.popupMenu;
const Main = imports.ui.main;

export class Menu {
    createMenu(menu: any): void {[
            // adding menu-items
            [new PM.PopupMenuItem(`GFX status: Initializing...`), ['button-press-event', this.gfxModeCallback]],
        ].forEach(mi => {
            mi[0].label.height = 0; // correcting height
            mi[0].label.style_class = `gfx-mode default`;
            if (mi.length === 2 && mi[1].length === 2) {
                mi[0].connect(mi[1][0], mi[1][1]);
                menu.addMenuItem(mi[0]);
            }
        });
    }

    gfxModeCallback(): void {
        Main.notify('Warning', 'Not implemented!');
        
    }
}
