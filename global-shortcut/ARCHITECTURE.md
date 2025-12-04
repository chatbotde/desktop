# Architecture Diagrams

## Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              MinimalModeManager                              │
│  ─────────────────────────────────────────────────────────  │
│  - state: MinimalModeState                                  │
│  - ipcRegistry: MinimalModeIpcRegistry                      │
│  - windowCommunicator: IWindowCommunicator  ← DIP           │
│  - notifier: MinimalModeNotifier                            │
│  ─────────────────────────────────────────────────────────  │
│  + initialize(chatInputWindow)                              │
│  + toggleMinimalMode()                                      │
│  + enableMinimalMode()                                      │
│  + disableMinimalMode()                                     │
│  + getStatus(): boolean                                     │
│  + setChatInputWindow(window)                               │
│  + cleanup()                                                │
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          │ uses               │ uses               │ depends on
          ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ MinimalModeState │  │MinimalModeIpc    │  │<<interface>>     │
│                  │  │Registry          │  │IWindowComm...    │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ - isMinimal      │  │ - handlers...    │  │ + sendTo...()    │
├──────────────────┤  ├──────────────────┤  │ + isAvailable()  │
│ + enable()       │  │ + register...()  │  └──────────────────┘
│ + disable()      │  │ + unregister...()│           △
│ + toggle()       │  │ + isRegistered() │           │ implements
│ + getState()     │  └──────────────────┘           │
│ + reset()        │                                 │
└──────────────────┘                    ┌────────────┴─────────┐
          │ uses                        │                      │
          │                    ┌────────────────┐   ┌─────────────────┐
          │                    │ChatInputWindow │   │Custom Window    │
          │                    │Communicator    │   │Communicator     │
          │                    ├────────────────┤   ├─────────────────┤
          ▼                    │ - chatInput... │   │ - custom...     │
┌──────────────────┐           ├────────────────┤   ├─────────────────┤
│MinimalModeNotif  │           │ + sendTo...()  │   │ + sendTo...()   │
│                  │           │ + isAvailable()│   │ + isAvailable() │
├──────────────────┤           │ + setWindow()  │   └─────────────────┘
│ - windowComm     │           └────────────────┘
├──────────────────┤
│ + notifyState()  │
│ + setWindowC...()│
└──────────────────┘
```

## Component Interaction Flow

```
User Action (Ctrl+M)
       │
       ▼
┌──────────────────────┐
│ Electron Global      │
│ Shortcut Handler     │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ IPC Event            │
│ 'minimal-mode-toggle'│
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ MinimalModeIpc       │
│ Registry             │
│ (routes to callback) │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ MinimalModeManager   │
│ .toggleMinimalMode() │
└─────────┬────────────┘
          │
          ├─────────────────┐
          │                 │
          ▼                 ▼
┌──────────────────┐  ┌─────────────────┐
│ MinimalModeState │  │ MinimalMode     │
│ .toggle()        │  │ Notifier        │
└─────────┬────────┘  └────────┬────────┘
          │                    │
          │ returns new state  │
          └────────────────────┤
                               ▼
                    ┌────────────────────┐
                    │ IWindowCommunicator│
                    │ .sendToRenderer()  │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Renderer Process   │
                    │ (UI Update)        │
                    └────────────────────┘
```

## SOLID Principles Mapping

```
┌────────────────────────────────────────────────────────────┐
│ SRP (Single Responsibility Principle)                      │
├────────────────────────────────────────────────────────────┤
│ MinimalModeManager        → Coordination only              │
│ MinimalModeState          → State management only          │
│ MinimalModeIpcRegistry    → IPC registration only          │
│ MinimalModeNotifier       → Notification only              │
│ ChatInputWindowComm...    → Chat window communication      │
│ IWindowCommunicator       → Communication abstraction      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ OCP (Open/Closed Principle)                                │
├────────────────────────────────────────────────────────────┤
│ ✅ OPEN for extension:                                     │
│    - Add new window communicators                          │
│    - Extend IWindowCommunicator interface                  │
│                                                             │
│ ✅ CLOSED for modification:                                │
│    - MinimalModeManager doesn't change                     │
│    - Existing communicators don't change                   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ LSP (Liskov Substitution Principle)                        │
├────────────────────────────────────────────────────────────┤
│ All communicators can substitute the base interface:       │
│                                                             │
│ IWindowCommunicator comm = ?                               │
│   ├─→ new ChatInputWindowCommunicator()  ✅ Works          │
│   ├─→ new SettingsWindowCommunicator()   ✅ Works          │
│   ├─→ new MultiWindowCommunicator()      ✅ Works          │
│   └─→ new CustomCommunicator()           ✅ Works          │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ISP (Interface Segregation Principle)                      │
├────────────────────────────────────────────────────────────┤
│ IWindowCommunicator interface is minimal:                  │
│   ├─→ sendToRenderer(channel, data)  (essential)           │
│   └─→ isAvailable()                  (essential)           │
│                                                             │
│ No methods that clients don't need!                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ DIP (Dependency Inversion Principle)                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  High-Level Module                                         │
│  ┌──────────────────────┐                                  │
│  │ MinimalModeManager   │                                  │
│  └──────────┬───────────┘                                  │
│             │ depends on                                   │
│             ▼                                               │
│  ┌────────────────────────┐  Abstraction                   │
│  │ IWindowCommunicator    │  ◄──────────                   │
│  └────────┬───────────────┘                                │
│           │ implemented by                                 │
│           ▼                                                 │
│  ┌──────────────────┐  Low-Level Modules                   │
│  │ ChatInputWindow  │                                      │
│  │ SettingsWindow   │                                      │
│  │ MultiWindow      │                                      │
│  └──────────────────┘                                      │
│                                                             │
│ Both depend on abstraction, not each other!                │
└────────────────────────────────────────────────────────────┘
```

## Sequence Diagram: Enable Minimal Mode

```
User          Manager         State        Notifier      Communicator     Renderer
 │               │              │              │               │              │
 │ enableMinimal()              │              │               │              │
 │──────────────>│              │              │               │              │
 │               │ enable()     │              │               │              │
 │               │─────────────>│              │               │              │
 │               │              │              │               │              │
 │               │ returns true │              │               │              │
 │               │<─────────────│              │               │              │
 │               │              │              │               │              │
 │               │ notifyStateChange(true)     │               │              │
 │               │─────────────────────────────>│               │              │
 │               │              │              │ sendToRenderer()             │
 │               │              │              │──────────────>│              │
 │               │              │              │               │ send()       │
 │               │              │              │               │─────────────>│
 │               │              │              │               │              │
 │               │              │              │               │ UI Update    │
 │               │              │              │               │<─ ─ ─ ─ ─ ─ │
 │               │              │              │ returns true  │              │
 │               │              │              │<──────────────│              │
 │<──────────────│              │              │               │              │
```

## Extension Example: Adding Settings Window Support

```
Step 1: Create Communicator (NEW FILE)
┌─────────────────────────────────────────┐
│ settings-window-communicator.js         │
├─────────────────────────────────────────┤
│ class SettingsWindowCommunicator        │
│   extends IWindowCommunicator {         │
│                                         │
│   constructor(settingsWindow) {         │
│     super();                            │
│     this.settingsWindow = settingsWindow;
│   }                                     │
│                                         │
│   sendToRenderer(channel, data) {      │
│     // Settings-specific implementation │
│   }                                     │
│                                         │
│   isAvailable() {                       │
│     // Check settings window            │
│   }                                     │
│ }                                       │
└─────────────────────────────────────────┘

Step 2: Use with Manager
┌─────────────────────────────────────────┐
│ const settingsComm = new Settings       │
│   WindowCommunicator(settingsWindow);   │
│                                         │
│ const manager = new MinimalModeManager( │
│   null, null, settingsComm              │
│ );                                      │
│                                         │
│ manager.enableMinimalMode();            │
└─────────────────────────────────────────┘

✅ DONE! No other modifications needed.
```

## Data Flow

```
Initialization
       │
       ▼
┌──────────────────┐
│ new MinimalMode  │
│ Manager()        │
└────────┬─────────┘
         │
         ├─→ Creates MinimalModeState
         ├─→ Creates MinimalModeIpcRegistry
         ├─→ Creates ChatInputWindowCommunicator
         └─→ Creates MinimalModeNotifier
         │
         ▼
   Manager Ready
         │
         ▼
   initialize(window)
         │
         ├─→ Update communicator window
         └─→ Register IPC handlers
         │
         ▼
   Fully Initialized
```

## Testing Architecture

```
Production:
┌─────────────────┐
│ MinimalMode     │
│ Manager         │
└────────┬────────┘
         │
         ├─→ Real State
         ├─→ Real IPC Registry
         └─→ Real Communicator
                 │
                 └─→ Real Window APIs

Testing:
┌─────────────────┐
│ MinimalMode     │
│ Manager         │
└────────┬────────┘
         │
         ├─→ Mock State          ← Injected
         ├─→ Mock IPC Registry   ← Injected
         └─→ Mock Communicator   ← Injected
                 │
                 └─→ No system calls, pure logic

Easy to test in isolation!
```

## Component Lifecycle

```
Creation
   │
   ▼
┌──────────────────┐
│ Manager Created  │
│ (with deps)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ initialize()     │
│ - Set window     │
│ - Register IPC   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Active           │
│ - Handle events  │
│ - Manage state   │
│ - Send notif...  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ cleanup()        │
│ - Clear window   │
│ - Unregister IPC │
│ - Reset state    │
└────────┬─────────┘
         │
         ▼
   Destroyed
```

## Error Handling Flow

```
Manager.enableMinimalMode()
       │
       ▼
State.enable()
       │
       ├─→ Already enabled?
       │   └─→ Return false, log warning
       │
       ▼
Notifier.notifyStateChange()
       │
       ▼
Communicator.sendToRenderer()
       │
       ├─→ Window available?
       │   │
       │   ├─→ No: Return false, log warning
       │   │
       │   └─→ Yes: Continue
       │
       ├─→ Window destroyed?
       │   │
       │   ├─→ Yes: Return false, log error
       │   │
       │   └─→ No: Continue
       │
       ▼
Send to renderer
       │
       ├─→ Success: Return true, log success
       │
       └─→ Error: Catch, log error, return false
```
