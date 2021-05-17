# asusctl ([-gex]: Gnome extension)

Extension for visualizing [asusctl](https://gitlab.com/asus-linux/asusctl)(`asusd`) settings and status.

## Views

Panel icon and Popup Menu:

![panel-menu.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/master/icons/examples/panel-menu.png)

Notification on profile change:

![profile-change-notice.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/master/icons/examples/profile-change-notice.png)

## Status

Done:

* Panel Icon (diffrent colors for each profile)
* Notification with colored icons
* Reboot/Logout information with icon and interactive confirmation
* Basic Profile (FanMode) Info
* Basic GFX Info
* Change profile
* Change GFX mode
* Show dGPU power status in panel and menu
* Show GFX mode status in panel and menu
* react on changes of power profiles, dGPU power states and GFX modes 

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
npm run build && npm run install
```

## Debuging / Building

```bash
npm run debug
```
