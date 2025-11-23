const ffi = require('ffi-napi');
const ref = require('ref-napi');
const EventEmitter = require('events');

// Define types
const voidPtr = ref.refType(ref.types.void);
const ulong = ref.types.ulong;
const uint = ref.types.uint;
const int = ref.types.int;
const handle = voidPtr;
const dword = ref.types.uint32;

// Load User32.dll
const user32 = ffi.Library('user32', {
    'GetForegroundWindow': [handle, []],
    'GetWindowThreadProcessId': [dword, [handle, ref.refType(dword)]],
    'GetWindowTextA': [int, [handle, 'string', int]],
});

// Load Kernel32.dll
const kernel32 = ffi.Library('kernel32', {
    'OpenProcess': [handle, [dword, int, dword]],
    'CloseHandle': [int, [handle]],
    'QueryFullProcessImageNameA': [int, [handle, dword, 'string', ref.refType(dword)]]
});

const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;

class FocusTracker extends EventEmitter {
    constructor() {
        super();
        this.lastFocus = null;
        this.trackingInterval = null;
        this.isTracking = false;
        this.ownPid = process.pid;
    }

    start(interval = 500) {
        if (this.isTracking) return;
        
        this.isTracking = true;
        this.trackingInterval = setInterval(() => {
            this.checkFocus();
        }, interval);
        
        console.log('FocusTracker: Started monitoring');
    }

    stop() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
        this.isTracking = false;
        console.log('FocusTracker: Stopped monitoring');
    }

    checkFocus() {
        try {
            const hwnd = user32.GetForegroundWindow();
            if (hwnd.isNull()) return;

            const pidBuffer = ref.alloc(dword);
            user32.GetWindowThreadProcessId(hwnd, pidBuffer);
            const pid = pidBuffer.deref();

            // Skip if it's our own process
            if (pid === this.ownPid) return;

            // Get Window Title
            const titleBuffer = Buffer.alloc(256);
            user32.GetWindowTextA(hwnd, titleBuffer, 256);
            const title = ref.readCString(titleBuffer, 0);

            // Get Process Name
            let processName = 'Unknown';
            const processHandle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
            
            if (!processHandle.isNull()) {
                const nameBuffer = Buffer.alloc(1024);
                const sizeBuffer = ref.alloc(dword, 1024);
                
                if (kernel32.QueryFullProcessImageNameA(processHandle, 0, nameBuffer, sizeBuffer)) {
                    const fullPath = ref.readCString(nameBuffer, 0);
                    processName = fullPath.split('\\').pop();
                }
                kernel32.CloseHandle(processHandle);
            }

            // Check if focus changed
            if (!this.lastFocus || this.lastFocus.pid !== pid || this.lastFocus.hwnd.address() !== hwnd.address()) {
                // Ignore Electron/Buddy related processes if needed, but usually we want to track everything else
                if (processName.toLowerCase() === 'electron.exe' || processName.toLowerCase().includes('buddy')) {
                    // Maybe we still want to track it, but usually we want the "last external" app
                    // For now, let's emit everything and let the consumer filter
                }

                const focusInfo = {
                    pid,
                    processName,
                    windowTitle: title,
                    hwnd: hwnd.address(), // Store address as number/string
                    timestamp: Date.now()
                };

                this.lastFocus = focusInfo;
                this.emit('focus-changed', focusInfo);
            }

        } catch (error) {
            console.error('FocusTracker: Error checking focus:', error);
        }
    }

    getLastFocus() {
        return this.lastFocus;
    }

    focusWindow(hwnd) {
        if (!hwnd) return false;
        try {
            // If hwnd is a number/string from our tracker, we might need to cast it back to a pointer?
            // But ffi-napi handles numbers for handles usually? 
            // Actually handles are pointers (void*).
            // If we stored it as address(), we need to recreate the buffer or pass the address if ffi supports it.
            // It's safer to keep the buffer if possible, but we stored address.
            // Let's try passing the address directly if ffi allows, or create a buffer.
            
            // For simplicity, let's assume we can pass the integer address if we define the arg as int/long?
            // No, we defined it as 'voidPtr'.
            
            // Let's just use the stored hwnd if we can, but we only stored address.
            // We should probably store the buffer or recreate it.
            
            // Recreating pointer from address:
            const hwndPtr = ref.alloc(voidPtr);
            // This is tricky in JS without ref-napi helpers for address-to-pointer.
            // Let's just use the user32.SetForegroundWindow with the address if we change the definition?
            // Or better, let's just use the native module for focusing if possible.
            
            // BUT, if we want to use this tracker, we should probably support focusing.
            // Let's try to use a simple hack: define SetForegroundWindow to take 'int' (or 'long long') instead of handle?
            // On 64-bit, handle is 64-bit. JS numbers are doubles (53-bit integer precision).
            // Addresses can be larger.
            
            // Let's skip adding focusWindow here for now and rely on tsf-manager to handle it 
            // or use the native module which should have its own focus mechanism.
            // The user just asked to "track" it.
            return false;
        } catch (e) {
            console.error('FocusTracker: Error focusing window:', e);
            return false;
        }
    }
}

module.exports = new FocusTracker();
