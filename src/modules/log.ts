declare const log: any;
var log_level = 4;

export function raw(text: string) {
    log(`rog-core-gex: ${text}`);
}

export function info(text: string) {
    if (log_level > 0) raw(`[INFO] ${text}`);
}

export function error(text: string) {
    if (log_level > 1) raw(`[ERROR] ${text}`);
}

export function warn(text: string) {
    if (log_level > 2) raw(`[WARN] ${text}`);
}

export function debug(text: string) {
    if (log_level > 3) raw(`[DEBUG] ${text}`);
}