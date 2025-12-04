# Architecture Diagrams

## Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   AutoStartupManager                         │
│  ─────────────────────────────────────────────────────────  │
│  - appName: string                                          │
│  - isSetup: boolean                                         │
│  - strategy: IPlatformStartupStrategy  ← DIP                │
│  ─────────────────────────────────────────────────────────  │
│  + setupAutoStartup(): Promise<boolean>                     │
│  + enableAutoStartup(): Promise<boolean>                    │
│  + disableAutoStartup(): Promise<boolean>                   │
│  + toggleAutoStartup(): Promise<boolean>                    │
│  + isAutoStartupEnabled(): boolean                          │
│  + isStartupLaunch(): boolean                               │
│  + getStartupInfo(): Object                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ depends on (DIP)
                          ▼
        ┌──────────────────────────────────────┐
        │   <<interface>>                      │
        │   IPlatformStartupStrategy           │
        │  ──────────────────────────────────  │
        │  + enable(): Promise<boolean>        │
        │  + disable(): Promise<boolean>       │
        │  + isEnabled(): boolean              │
        └──────────────────────────────────────┘
                          △
                          │ implements
          ┌───────────────┼───────────────┐
          │               │               │
          │               │               │
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│ WindowsStartup  │ │ MacOSStartup│ │ LinuxStartup    │
│ Strategy        │ │ Strategy    │ │ Strategy        │
├─────────────────┤ ├─────────────┤ ├─────────────────┤
│ - registryMgr   │ │             │ │ - desktopMgr    │
├─────────────────┤ ├─────────────┤ ├─────────────────┤
│ + enable()      │ │ + enable()  │ │ + enable()      │
│ + disable()     │ │ + disable() │ │ + disable()     │
│ + isEnabled()   │ │ + isEnabled()│ │ + isEnabled()   │
└─────────────────┘ └─────────────┘ └─────────────────┘
        │                                   │
        │ uses (SRP)                        │ uses (SRP)
        ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│ RegistryManager │                 │DesktopFileMgr   │
├─────────────────┤                 ├─────────────────┤
│ + addEntry()    │                 │ + createEntry() │
│ + removeEntry() │                 │ + removeEntry() │
└─────────────────┘                 └─────────────────┘


┌──────────────────────────────────┐      ┌─────────────────────┐
│ PlatformStrategyFactory          │      │ StartupInfoProvider │
├──────────────────────────────────┤      ├─────────────────────┤
│ + createStrategy()  (OCP)        │      │ + isStartupLaunch() │
│ + isPlatformSupported()          │      │ + getPlatform()     │
│ + getSupportedPlatforms()        │      │ + getStartupArgs()  │
└──────────────────────────────────┘      └─────────────────────┘
```

## Component Interaction Flow

```
User Code
    │
    ├─→ AutoStartupManager.setupAutoStartup()
    │       │
    │       ├─→ strategy.isEnabled() ←─ Abstraction (DIP)
    │       │
    │       └─→ strategy.enable()
    │               │
    │               └─→ [WindowsStartupStrategy]
    │                       │
    │                       ├─→ app.setLoginItemSettings()
    │                       │
    │                       └─→ RegistryManager.addEntry()
    │                               │
    │                               └─→ spawn('cmd', ...)
    │
    ├─→ AutoStartupManager.disableAutoStartup()
    │       │
    │       └─→ strategy.disable()
    │
    └─→ AutoStartupManager.getStartupInfo()
            │
            └─→ StartupInfoProvider.getPlatform()
```

## SOLID Principles Mapping

```
┌────────────────────────────────────────────────────────────┐
│ SRP (Single Responsibility Principle)                      │
├────────────────────────────────────────────────────────────┤
│ AutoStartupManager        → Coordination only              │
│ WindowsStartupStrategy    → Windows startup only           │
│ MacOSStartupStrategy      → macOS startup only             │
│ LinuxStartupStrategy      → Linux startup only             │
│ RegistryManager           → Registry operations only       │
│ DesktopFileManager        → Desktop files only             │
│ StartupInfoProvider       → Info queries only              │
│ PlatformStrategyFactory   → Strategy creation only         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ OCP (Open/Closed Principle)                                │
├────────────────────────────────────────────────────────────┤
│ ✅ OPEN for extension:                                     │
│    - Add new platforms by creating new strategy classes    │
│    - Add new strategy to factory                           │
│                                                             │
│ ✅ CLOSED for modification:                                │
│    - Existing strategies don't need changes                │
│    - AutoStartupManager doesn't need changes               │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ LSP (Liskov Substitution Principle)                        │
├────────────────────────────────────────────────────────────┤
│ All strategies can be substituted for the base interface:  │
│                                                             │
│ IPlatformStartupStrategy base = ?                          │
│   ├─→ new WindowsStartupStrategy()   ✅ Works              │
│   ├─→ new MacOSStartupStrategy()     ✅ Works              │
│   ├─→ new LinuxStartupStrategy()     ✅ Works              │
│   └─→ new CustomStrategy()           ✅ Works              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ISP (Interface Segregation Principle)                      │
├────────────────────────────────────────────────────────────┤
│ IPlatformStartupStrategy interface is minimal:             │
│   ├─→ enable()      (essential)                            │
│   ├─→ disable()     (essential)                            │
│   └─→ isEnabled()   (essential)                            │
│                                                             │
│ No methods that clients don't need!                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ DIP (Dependency Inversion Principle)                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  High-Level Module                                         │
│  ┌──────────────────────┐                                  │
│  │ AutoStartupManager   │                                  │
│  └──────────┬───────────┘                                  │
│             │ depends on                                   │
│             ▼                                               │
│  ┌────────────────────────────┐  Abstraction               │
│  │ IPlatformStartupStrategy   │  ◄──────────               │
│  └────────┬───────────────────┘                            │
│           │ implemented by                                 │
│           ▼                                                 │
│  ┌──────────────────┐  Low-Level Modules                   │
│  │ WindowsStartup   │                                      │
│  │ MacOSStartup     │                                      │
│  │ LinuxStartup     │                                      │
│  └──────────────────┘                                      │
│                                                             │
│ Both depend on abstraction, not each other!                │
└────────────────────────────────────────────────────────────┘
```

## Extension Example: Adding FreeBSD Support

```
Step 1: Create Strategy Class (NEW FILE)
┌─────────────────────────────────────────┐
│ freebsd-startup-strategy.js             │
├─────────────────────────────────────────┤
│ class FreeBSDStartupStrategy            │
│   extends IPlatformStartupStrategy {    │
│                                         │
│   async enable() {                      │
│     // FreeBSD-specific logic           │
│   }                                     │
│                                         │
│   async disable() {                     │
│     // FreeBSD-specific logic           │
│   }                                     │
│                                         │
│   isEnabled() {                         │
│     // FreeBSD-specific logic           │
│   }                                     │
│ }                                       │
└─────────────────────────────────────────┘

Step 2: Register in Factory (ONE LINE)
┌─────────────────────────────────────────┐
│ platform-strategy-factory.js            │
├─────────────────────────────────────────┤
│ static createStrategy(platform, name) { │
│   switch (platform) {                   │
│     case 'win32':   return new Windows  │
│     case 'darwin':  return new MacOS    │
│     case 'linux':   return new Linux    │
│     case 'freebsd': return new FreeBSD ←│
│   }                                     │
│ }                                       │
└─────────────────────────────────────────┘

✅ DONE! No other modifications needed.
   All existing code continues to work.
```

## Data Flow

```
Application Startup
       │
       ▼
┌──────────────────┐
│ new Auto         │
│ StartupManager() │
└────────┬─────────┘
         │
         ├─→ PlatformStrategyFactory.createStrategy()
         │       │
         │       ├─→ Detect platform (win32/darwin/linux)
         │       │
         │       └─→ Instantiate appropriate strategy
         │               │
         │               ├─→ Windows → RegistryManager
         │               ├─→ macOS   → (Electron API)
         │               └─→ Linux   → DesktopFileManager
         │
         ▼
   Strategy Injected
         │
         ▼
   Manager Ready
```

## Testing Architecture

```
Production:
┌─────────────────┐
│ AutoStartup     │
│ Manager         │
└────────┬────────┘
         │
         ├─→ Real Strategy
         │       │
         │       └─→ Real System APIs
         │

Testing:
┌─────────────────┐
│ AutoStartup     │
│ Manager         │
└────────┬────────┘
         │
         ├─→ Mock Strategy  ← Injected for testing
         │       │
         │       └─→ No system calls, pure logic
         │

Easy to test in isolation!
```
