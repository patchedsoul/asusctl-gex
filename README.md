# ASUS-NB-Ctrl (Gnome extension)

Extension for visualizing most of the asus-nb-ctrl(asusd) settings and status.

## Status

Done:

* Panel Icon
* Basic FanMode Info - Experimental

ToDo:

* Configuration interface (prefs)
* Status overview (ui)

highly WiP - use at own risk!

## Dependencies

* nodejs >= 14.0.0
* npm >= 6.14.0
* [asus-nb-ctrl](https://gitlab.com/asus-linux/asus-nb-ctrl) >= 0.1.0
* gnome >= 3.36.0

## Installation

In a gnome-terminal(user) enter the following two commands:

```bash
git clone git@gitlab.com:asus-linux/asus-nb-gox.git /tmp/asus-nb-gox && cd /tmp/asus-nb-gox
make install && make enable && make restart-shell
```

## Debuging / Building

```bash
make all
# OR
make nohw
# install and enable
make install
make enable
make restart-shell
```

only use 'nohw' if the hardware thermal interface is missing.
