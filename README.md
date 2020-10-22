# ASUS-NB-Ctrl (Gnome extension)

Extension for visualizing [asus-nb-ctrl](https://gitlab.com/asus-linux/asus-nb-ctrl)(`asusd`) settings and status.

## Views

Panel icon(color changes due profilechange):

![](https://gitlab.com/asus-linux/asus-nb-gex/-/raw/master/icons/examples/panel-icon.png)

Panelmenu subentry which shows the current GFX mode:

![](https://gitlab.com/asus-linux/asus-nb-gex/-/raw/master/icons/examples/gfx-mode.png)

Notification on profilechange:

![](https://gitlab.com/asus-linux/asus-nb-gex/-/raw/master/icons/examples/profile-change-notice.png)

## Status

Done:

* Panel Icon
* Basic Profile (FanMode) Info
* Basic GFX Info

ToDo:

* Configuration interface (prefs)
* make profile changable
* make gfx changable
* bind ROG-Button
* Status overview (ui)

highly WiP - use at own risk!

## Dependencies

* nodejs >= 14.0.0
* npm >= 6.14.0
* [asus-nb-ctrl](https://gitlab.com/asus-linux/asus-nb-ctrl) >= 2.0.5
* gnome >= 3.36.0

## Installation

In a gnome-terminal(user) enter the following two commands:

```bash
git clone git@gitlab.com:asus-linux/asus-nb-gex.git /tmp/asus-nb-gex && cd /tmp/asus-nb-gex
make install && sudo make install_icons && make enable && make restart-shell 
```

## Debuging / Building

```bash
make all
# install and enable
make install
sudo make install_icons
make enable
make restart-shell
```

only root is allowed to install the icons, use sudo or use a diffrent root-shell to install them.
