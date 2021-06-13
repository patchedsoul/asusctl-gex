# asusctl ([-gex]: Gnome extension)

Extension for visualizing [asusctl](https://gitlab.com/asus-linux/asusctl)(`asusd`) settings and status.

---

## Table of contents

[[_TOC_]]

---

## Current project status

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

Waiting for implementation:

* Configuration interface (prefs)
  * bind ROG-Button to open prefs (if not `asusctl-control-center` is used)
  * create canvas based fan-curve editing
  * make notifications "silent"
  * custom gfx poll-interval (with capped values)

---

## Icons/Screenshots

_The screenshots are just examples and might not represent the current used icons._

### CPU profile icons

|Icon|Description (status)|
|-|-|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-silent.svg" height="30" alt="Power Profile Silent">|silent|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-normal.svg" height="30" alt="Power Profile Normal">|normal|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-boost.svg" height="30" alt="Power Profile Boost">|boost|

### GFX profile icons

|Icon|Description|
|-|-|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-nvidia.svg" height="30" alt="Graphics Profile Nvidia">|Nvidia (discrete)|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-integrated.svg" height="30" alt="Graphics Profile Integrated GPU">|Integrated|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-integrated-active.svg" height="30" alt="Graphics Profile Integrated GPU, dedicated GPU active">|Integrated, dedicated GPU active*|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-compute.svg" height="30" alt="Graphics Profile Compute">|Compute|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-compute-active.svg" height="30" alt="Graphics Profile Compute, dedicated GPU active">|Compute, dedicated GPU active|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-vfio.svg" height="30" alt="Graphics Profile VFIO">|VFIO|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-vfio-active.svg" height="30" alt="Graphics Profile VFIO, dedicated GPU active">|VFIO, dedicated GPU active|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-hybrid.svg" height="30" alt="Graphics Profile Hybrid, dedicated GPU active">|Hybrid|
|<img src="https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-hybrid-active.svg" height="30" alt="Graphics Profile Hybrid, dedicated GPU active">|Hybrid, dedicated GPU active|

_\* on integrated the dedicated GPU should never be active. If this is the case it is possible that another application woke it up by rescanning the PCI bus. It's also possible that the NVIDIA drivers or asusctl is not configured properly._

### Views (screenshots)

**CPU change notifications:**

![cpu-change-silent.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/cpu-change-silent.png)

**GFX change notification:**

![gfx-change-hybrid.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/gfx-change-hybrid.png)

**Panel (normal & hybrid):**

![panel-normal-hybrid.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-normal-hybrid.png)

![panel-normal-hybrid-hover.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-normal-hybrid-hover.png)

![panel-normal-hybrid-open.png](https://gitlab.com/asus-linux/asusctl-gex/-/raw/main/screenshots/panel-normal-hybrid-open.png)

---

## Dependencies

* [asusctl](https://gitlab.com/asus-linux/asusctl) >= 3.7.0
* gnome >= 3.36.0

### Development dependencies

* nodejs >= 14.0.0
* npm >= 6.14.0

---

## Installation

There are diffrent ways of installing asusctl-gex, please choose on of the following.

### From source

In a gnome-terminal(user) enter the following commands:

```bash
git clone git@gitlab.com:asus-linux/asusctl-gex.git /tmp/asusctl-gex && cd /tmp/asusctl-gex
npm install
npm run build && npm run install-user
```

_HINT: Reload the gnome-shell afterwards. (`Alt + F2` -> `r`)_

### Source debugging

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
