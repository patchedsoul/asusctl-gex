# asusctl ([-gex]: Gnome extension)

Extension for visualizing [asusctl](https://gitlab.com/asus-linux/asusctl)(`asusd`) settings and status.

## Views

Panel icon and Popup Menu:

![panel-open.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/master/screenshots/panel-open.png)

Notification on profile change:

![notification.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/master/screenshots/notification.png)

## Status

Done:

* Panel Icon
  * changes dynamically on:
    * profile changes
    * dedicated GPU power status changes
    * graphics mode changes
* Notification with profile icons
* Reboot / Logout information with icon and interactive confirmation
* Popup Menu with the possibilities to:
  * view the power status of the dedicated GPU
  * change the power profile
  * change the graphics mode

ToDo:

* Configuration interface (prefs)
* bind ROG-Button

This project is still WiP, but safe to use.

## Dependencies

* nodejs >= 14.0.0
* npm >= 6.14.0
* [asusctl](https://gitlab.com/asus-linux/asusctl) >= 3.4.0
* gnome >= 3.36.0

## Installation

In a gnome-terminal(user) enter the following two commands:

```bash
git clone git@gitlab.com:asus-linux/asusctl-gex.git /tmp/asusctl-gex && cd /tmp/asusctl-gex
npm install
npm run build && npm run install-user
```

## Debuging / Building

```bash
npm run debug
```

### License & Trademarks
Mozilla Public License Version 2.0 (MPL-2)

ASUS and ROG Trademark is either a US registered trademark or trademark of ASUSTeK Computer Inc. in the United States and/or other countries.
Reference to any ASUS products, services, processes, or other information and/or use of ASUS Trademarks does not constitute or imply endorsement, sponsorship, or recommendation thereof by ASUS.
The use of ROG and ASUS trademarks within this website and associated tools and libraries is only to provide a recognisable identifier to users to enable them to associate that these tools will work with ASUS ROG laptops.