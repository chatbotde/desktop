param(
  [Parameter(Mandatory = $true)][int]$ProcessId,
  [Parameter(Mandatory = $true)][string]$Text
)

$ErrorActionPreference = 'Stop'

Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class BuddyConsoleInput {
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool AttachConsole(uint dwProcessId);

  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool FreeConsole();

  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern IntPtr GetStdHandle(int nStdHandle);

  [StructLayout(LayoutKind.Sequential)]
  public struct INPUT_RECORD {
    public ushort EventType;
    public KEY_EVENT_RECORD KeyEvent;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct KEY_EVENT_RECORD {
    public bool bKeyDown;
    public ushort wRepeatCount;
    public ushort wVirtualKeyCode;
    public ushort wVirtualScanCode;
    public char UnicodeChar;
    public uint dwControlKeyState;
  }

  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  public static extern bool WriteConsoleInput(
    IntPtr hConsoleInput,
    INPUT_RECORD[] lpBuffer,
    int nLength,
    out int lpNumberOfEventsWritten
  );

  public static void SendText(int pid, string text) {
    if (!AttachConsole((uint)pid)) {
      throw new InvalidOperationException("AttachConsole failed");
    }
    try {
      IntPtr handle = GetStdHandle(-10);
      var events = new System.Collections.Generic.List<INPUT_RECORD>();
      foreach (char ch in text) {
        events.Add(new INPUT_RECORD {
          EventType = 1,
          KeyEvent = new KEY_EVENT_RECORD {
            bKeyDown = true,
            wRepeatCount = 1,
            UnicodeChar = ch
          }
        });
        events.Add(new INPUT_RECORD {
          EventType = 1,
          KeyEvent = new KEY_EVENT_RECORD {
            bKeyDown = false,
            wRepeatCount = 1,
            UnicodeChar = ch
          }
        });
      }
      events.Add(new INPUT_RECORD {
        EventType = 1,
        KeyEvent = new KEY_EVENT_RECORD {
          bKeyDown = true,
          wRepeatCount = 1,
          wVirtualKeyCode = 13
        }
      });
      events.Add(new INPUT_RECORD {
        EventType = 1,
        KeyEvent = new KEY_EVENT_RECORD {
          bKeyDown = false,
          wRepeatCount = 1,
          wVirtualKeyCode = 13
        }
      });
      int written;
      if (!WriteConsoleInput(handle, events.ToArray(), events.Count, out written)) {
        throw new InvalidOperationException("WriteConsoleInput failed");
      }
    } finally {
      FreeConsole();
    }
  }
}
"@

[BuddyConsoleInput]::SendText($ProcessId, $Text)
