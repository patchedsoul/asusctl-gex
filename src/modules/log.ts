declare const log: any;
declare var asusctlGexInstance: any;
var log_level = 4;

export function raw(text: string, prefix: string, e: any = null) {
    if (typeof asusctlGexInstance !== 'undefined'){
        if (asusctlGexInstance.isDebug == true){
            log(`asusctl-gex: ${prefix} ${text}`);
            if (e) {
                log(`asusctl-gex: ${prefix} Exception:\nasusctl-gex: ${e}`);
            }
        }
    }
}

export function info(text: string, e: any = null) {
    if (log_level > 0) raw(text, '[INFO]', e);
}

export function error(text: string, e: any = null) {
    if (log_level > 1) raw(text, '[ERROR]', e);
}

export function warn(text: string, e: any = null) {
    if (log_level > 2) raw(text, '[WARN]', e);
}

export function debug(text: string, e: any = null) {
    if (typeof asusctlGexInstance !== 'undefined'){
        if (asusctlGexInstance.isDebug == true){
            if (log_level > 3) raw(text, '[DEBUG]', e);
        }
    }
}