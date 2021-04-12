# ASUS-NB-Ctrl (Gnome extension)

Extension for visualizing [asus-nb-ctrl](https://gitlab.com/asus-linux/asus-nb-ctrl)(`asusd`) settings and status.

## Views

Panel icon(color changes due profilechange):

![panel-icon.png](https://gitlab.com/asus-linux/asus-nb-gex/-/raw/master/icons/examples/panel-icon.png)

Panelmenu subentry which shows the current GFX mode as well as the selected profile:

![gfx-mode.png](https://gitlab.com/asus-linux/asus-nb-gex/-/raw/master/icons/examples/gfx-mode-profile.png)

Notification on profile change:

![profile-change-notice.png](https://gitlab.com/asus-linux/asus-nb-gex/-/raw/master/icons/examples/profile-change-notice.png)

## Status

Done:

* Panel Icon (diffrent colors for each profile)
* Notification with colored icons
* Reboot/Logout information with icon and interactive confirmation
* Basic Profile (FanMode) Info
* Basic GFX Info
* Change profile
* Change GFX mode

ToDo:

* Configuration interface (prefs)
* bind ROG-Button

This project is still WiP, but safe to use.

## Dependencies

* nodejs >= 14.0.0
* npm >= 6.14.0
* [asus-nb-ctrl](https://gitlab.com/asus-linux/asus-nb-ctrl) >= 3.0.0
* gnome >= 3.36.0

## Installation

In a gnome-terminal(user) enter the following two commands:

```bash
git clone git@gitlab.com:asus-linux/asus-nb-gex.git /tmp/asus-nb-gex && cd /tmp/asus-nb-gex
make install && make enable && make restart-shell
```

## Debuging / Building

```bash
make all
# install and enable
make install
make enable
make restart-shell
```
