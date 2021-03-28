# Retrieve the UUID from ``metadata.json``
UUID = $(shell grep -E '^[ ]*"uuid":' ./metadata.json | sed 's@^[ ]*"uuid":[ ]*"\(.\+\)",[ ]*@\1@')
DEBUG ?= 1

ifeq ($(strip $(DESTDIR)),)
INSTALLBASE = $(HOME)/.local/share/gnome-shell/extensions
else
INSTALLBASE = $(DESTDIR)/usr/share/gnome-shell/extensions
endif
INSTALLNAME = $(UUID)

$(info UUID is "$(UUID)")

.PHONY: all clean install zip-file

sources = src/*.ts src/**/*.ts *.css

all: depcheck compile

nohw: depcheck compile_nohw

clean:
	rm -rf _build schemas/gschemas.compiled target

transpile: $(sources)
	tsc

compile: convert metadata.json schemas
	rm -rf _build
	mkdir -p _build/modules
	cp -r target/modules/*js _build/modules
	cp -r metadata.json icons schemas resources target/*.js *.css _build

convert: transpile
	for file in target/*.js; do \
		sed -i \
			-e 's#export function#function#g' \
			-e 's#export var#var#g' \
			-e 's#export const#var#g' \
			-e 's#Object.defineProperty(exports, "__esModule", { value: true });#var exports = {};#g' \
			"$${file}"; \
		sed -i -E 's/export class (\w+)/var \1 = class \1/g' "$${file}"; \
		sed -i -E "s/import \* as (\w+) from '.\/modules\/(\w+)'/const \1 = Me.imports.modules.\2/g" "$${file}"; \
		sed -i -E "s/import \* as (\w+) from '.\/(\w+)'/const \1 = Me.imports.\2/g" "$${file}"; \
		sed -i -E "s/from '.\/modules\/(\w+)'/= Me.imports.modules.\1/g" "$${file}"; \
		sed -i -E "s/from '.\/(\w+)'/= Me.imports.\1/g" "$${file}"; \
		sed -i -E "s/import \{/var \{/g" "$${file}"; \
	done
	for file in target/modules/*.js; do \
		sed -i \
			-e 's#export function#function#g' \
			-e 's#export var#var#g' \
			-e 's#export const#var#g' \
			-e 's#Object.defineProperty(exports, "__esModule", { value: true });#var exports = {};#g' \
			"$${file}"; \
		sed -i -E 's/export class (\w+)/var \1 = class \1/g' "$${file}"; \
		sed -i -E "s/import \* as (\w+) from '.\/(\w+)'/const \1 = Me.imports.modules.\2/g" "$${file}"; \
		sed -i -E "s/from '.\/(\w+)'/= Me.imports.modules.\1/g" "$${file}"; \
		sed -i -E "s/import \{/var \{/g" "$${file}"; \
	done

depcheck:
	@echo depcheck
	@if ! command -v tsc >/dev/null; then \
		echo \
		echo 'You must install TypeScript >= 3.8 to transpile.'; \
		false; \
	fi

enable:
	gnome-extensions enable "asus-nb-gex@asus-linux.org"

disable:
	gnome-extensions disable "asus-nb-gex@asus-linux.org"

listen:
	journalctl -o cat -n 0 -f "$$(which gnome-shell)" | grep -v warning

install:
	rm -rf $(INSTALLBASE)/$(INSTALLNAME)
	mkdir -p $(INSTALLBASE)/$(INSTALLNAME)
	cp -r _build/* $(INSTALLBASE)/$(INSTALLNAME)/

uninstall:
	rm -rf $(INSTALLBASE)/$(INSTALLNAME)

restart-shell:
	echo "Restart shell!"
	if bash -c 'xprop -root &> /dev/null'; then \
		busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting Gnome...")'; \
	else \
		gnome-session-quit --logout; \
	fi

update-repository:
	git fetch origin
	git reset --hard origin/master_focal
	git clean -fd

schemas: schemas/gschemas.compiled
	touch $@

schemas/gschemas.compiled: schemas/*.gschema.xml
	glib-compile-schemas schemas

zip-file: all
	cd _build && zip -qr "../$(UUID)$(VSTRING).zip" .
