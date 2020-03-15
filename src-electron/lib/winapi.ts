import * as ffi from 'ffi-napi';
import * as ref from 'ref-napi';
import { types } from 'ref-napi';

/* Types */
const LONG = types.long;
const ULONG = types.ulong;
const INT = types.int;
const UINT = types.uint;
const DWORD = ULONG;
const BOOL = INT;

const HANDLE = types.uint64;
const HHOOK = HANDLE;
const HWND = HANDLE;
const HINSTANCE = HANDLE;

const WPARAM = types.uint64;
const LPARAM = types.int64;
const LRESULT = types.int64;

const HOOKPROC = 'pointer';

const LPTSTR = ref.refType(ref.types.CString);

const u32 = ffi.Library('user32', {
  GetForegroundWindow: [HWND, []],
  GetClassNameA: [INT, [HWND, LPTSTR, INT]]
});

export function IsPoEForeground() {
  const hwnd = u32.GetForegroundWindow();

  if (!hwnd) {
    return false;
  }

  const buf = Buffer.alloc(255);
  u32.GetClassNameA(hwnd, buf, 255);
  const cls = ref.readCString(buf, 0);

  if (cls !== 'POEWindowClass') {
    return false;
  }

  return true;
}
