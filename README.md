# ROG-Core (Gnome extension)

Extension for visualizing most of the rog-core settings and status.

## Status

Done:

* Panel Icon incl. Submenu
* Basic poller for FanMode (fs based) - Experimental

ToDo:

* Configuration interface (prefs)
* Status overview (ui)
* DBus Handler/Commands

highly WiP - use at own risk!

## Dependencies

* nodejs >= 14.0.0
* npm >= 6.14.0
* [rog-core](https://github.com/flukejones/rog-core) >= 0.10.0
* gnome >= 3.36.0

## Installation

In a gnome-terminal(user) enter the following two commands:

```bash
git clone git@lab.retarded.farm:zappel/rog-core-gex.git /tmp/rog-core-gex && cd /tmp/rog-core-gex
make install && make enable && make restart-shell
```

## Debuging / Building

```bash
make nohw
# OR
make all
# install and enable
make install
make enable
make restart-shell
```

only use 'nohw' if the hardware thermal interface is missing.
