# asusctl ([-gex]: Gnome extension)

Extension for visualizing [asusctl](https://gitlab.com/asus-linux/asusctl)(`asusd`) settings and status.

---

## Table of contents

[[_TOC_]]

---

## Extension Features

* Panel icon to display:
    * current power profile (from power-profiles-daemon)
    * current graphics mode
    * current power status of dedicated GPU
* Notifications:
  * Power Profiles
  * Battery Charge Limit
  * Graphics Modes
    * When graphics mode requires logout/reboot, notificatioin displays interactive button to perform logout/reboot
* Popup Menu with options to:
  * view power status of the dedicated GPU
  * change the graphics mode
  * if supported by laptop model:
    * change the battery charging limit
    * change AniMe Matrix brightness
    * enable / disable AniMe Matrix
* Extension Settings:
  * Enable / disable notifications
  * Enable debug message logging

### Waiting for implementation:

* Configuration interface (prefs)
  * bind ROG-Button to open prefs (if not `asusctl-control-center` is used)
  * create canvas based fan-curve editing
  * custom gfx poll-interval (with capped values)

---

## Icons/Screenshots

_The screenshots below are just examples and might not represent the current used icons._

### Power Profile Daemon icons

|Icon|Profile|
|-|-|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-silent.svg" height="30" alt="Power Profile Silent">|Power Saver|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-normal.svg" height="30" alt="Power Profile Normal">|Balanced|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-boost.svg" height="30" alt="Power Profile Boost">|Performance|

### GPU mode icons

|Icon|Description|
|-|-|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-dedicated.svg" height="30" alt="Graphics Profile Dedicated">|Dedicated, discrete graphics|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-integrated.svg" height="30" alt="Graphics Profile Integrated GPU">|Integrated|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-integrated-active.svg" height="30" alt="Graphics Profile Integrated GPU, dedicated GPU active">|Integrated, dedicated GPU active*|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-compute.svg" height="30" alt="Graphics Profile Compute">|Compute|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-compute-active.svg" height="30" alt="Graphics Profile Compute, dedicated GPU active">|Compute, dedicated GPU active|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-vfio.svg" height="30" alt="Graphics Profile VFIO">|VFIO|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-vfio-active.svg" height="30" alt="Graphics Profile VFIO, dedicated GPU active">|VFIO, dedicated GPU active|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-hybrid.svg" height="30" alt="Graphics Profile Hybrid, dedicated GPU active">|Hybrid|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-hybrid-active.svg" height="30" alt="Graphics Profile Hybrid, dedicated GPU active">|Hybrid, dedicated GPU active|

_\* on integrated the dedicated GPU should never be active. If this is the case it is possible that another application woke it up by rescanning the PCI bus. It's also possible that the NVIDIA drivers or asusctl is not configured properly._

### Screenshots

**Power Profile Daemon change notifications:**

![cpu-change-silent.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/cpu-change-silent.png)

**Graphics Mode change notification:**

![gfx-change-hybrid.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/gfx-change-hybrid.png)

**Panel (example):**

![panel-normal-compute.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-normal-compute.png)

![panel-normal-compute-hover.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-normal-compute-hover.png)

![panel-normal-compute-open.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-normal-compute-open.png)

---

## Requirements

* gnome >= 3.36.0
* [asusctl](https://gitlab.com/asus-linux/asusctl) >= 4.0
* [Power Profiles Daemon](https://gitlab.freedesktop.org/hadess/power-profiles-daemon) >= 0.9
* [supergfxctl](https://gitlab.com/asus-linux/supergfxctl) >= 3.0.0 (optional, required for graphics mode features)

---

## Build Instructions

### Dependencies

* nodejs >= 14.0.0
* npm >= 6.14.0

### Building

In a terminal enter the following commands as a user (**do NOT run as root or sudo**):

```bash
git clone https://gitlab.com/asus-linux/asusctl-gex.git /tmp/asusctl-gex && cd /tmp/asusctl-gex
npm install
npm run build && npm run install-user
```

_HINT: You will need to reload the GNOME Shell afterwards. (`Alt + F2` -> `r` on X11, `logout` on Wayland)_

### Source debugging

`cd` into the directory where you've downloaded the `asusctl-gex` source code and enter the following commands:

```bash
npm install
npm run debug
```

---

## License & Trademarks

**License:** Mozilla Public License Version 2.0 (MPL-2)

**Trademarks:** ASUS and ROG Trademark is either a US registered trademark or trademark of ASUSTeK Computer Inc. in the United States and/or other countries.
Reference to any ASUS products, services, processes, or other information and/or use of ASUS Trademarks does not constitute or imply endorsement, sponsorship, or recommendation thereof by ASUS.
The use of ROG and ASUS trademarks within this website and associated tools and libraries is only to provide a recognisable identifier to users to enable them to associate that these tools will work with ASUS ROG laptops.
