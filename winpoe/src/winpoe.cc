#include <napi.h>
#include <Windows.h>

namespace
{
HWINEVENTHOOK g_ForegroundHook = nullptr;
HHOOK g_MouseHook = nullptr;
HHOOK g_KeyboardHook = nullptr;
bool g_ctrldown = false;
bool g_ctrlScrollEnabled = false;

Napi::FunctionReference g_ForegroundHookCb;
} // namespace

namespace pta
{
INPUT CreateInput(WORD vk, bool isDown)
{
    INPUT input = {};
    input.type = INPUT_KEYBOARD;
    input.ki.wVk = vk;
    input.ki.wScan = 0;
    input.ki.dwFlags = (isDown ? 0 : KEYEVENTF_KEYUP);
    input.ki.time = 0;
    input.ki.dwExtraInfo = 0;
    return input;
}

bool IsPoEForeground()
{
    static const std::wstring s_poeCls = L"POEWindowClass";

    HWND hwnd = GetForegroundWindow();

    if (nullptr == hwnd)
    {
        return false;
    }

    wchar_t cls[512];
    GetClassName(hwnd, cls, std::size(cls));

    if (s_poeCls != cls)
    {
        return false;
    }

    return true;
}
} // namespace pta

LRESULT CALLBACK LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam)
{
    if (nCode >= HC_ACTION)
    {
        KBDLLHOOKSTRUCT *kb = (KBDLLHOOKSTRUCT *)lParam;

        if (kb->vkCode == VK_CONTROL || kb->vkCode == VK_LCONTROL || kb->vkCode == VK_RCONTROL)
        {
            g_ctrldown = (wParam == WM_KEYDOWN);
        }
    }

    return CallNextHookEx(g_KeyboardHook, nCode, wParam, lParam);
}

LRESULT CALLBACK LowLevelMouseProc(int nCode, WPARAM wParam, LPARAM lParam)
{
    if (nCode >= HC_ACTION)
    {
        if (wParam == WM_MOUSEWHEEL && g_ctrldown && pta::IsPoEForeground() && g_ctrlScrollEnabled)
        {
            MSLLHOOKSTRUCT *mhs = (MSLLHOOKSTRUCT *)lParam;

            auto zDelta = GET_WHEEL_DELTA_WPARAM(mhs->mouseData);

            WORD key = (zDelta > 0 ? VK_LEFT : VK_RIGHT);

            // Send input
            std::vector<INPUT> keystroke;

            keystroke.push_back(pta::CreateInput(key, true));
            keystroke.push_back(pta::CreateInput(key, false));

            SendInput(keystroke.size(), keystroke.data(), sizeof(keystroke[0]));

            // consume the input
            return -1;
        }
    }

    return CallNextHookEx(g_MouseHook, nCode, wParam, lParam);
}

VOID CALLBACK
ForegroundHookCallback(HWINEVENTHOOK hWinEventHook, DWORD dwEvent, HWND hwnd, LONG idObject, LONG idChild, DWORD dwEventThread, DWORD dwmsEventTime)
{
    if (g_ForegroundHookCb)
    {
        bool poefg = pta::IsPoEForeground();
        g_ForegroundHookCb.Call({Napi::Boolean::New(g_ForegroundHookCb.Env(), poefg)});
    }
}

void InstallForegroundHookCb(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::Function cb = info[0].As<Napi::Function>();

    if (cb)
    {
        g_ForegroundHookCb = Napi::Persistent(cb);
    }
}

void InitializeHooks(const Napi::CallbackInfo &info)
{
    g_ForegroundHook = SetWinEventHook(
        EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, NULL, ForegroundHookCallback, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS);

    g_MouseHook = SetWindowsHookEx(WH_MOUSE_LL, &LowLevelMouseProc, GetModuleHandle(NULL), NULL);

    g_KeyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, &LowLevelKeyboardProc, GetModuleHandle(NULL), NULL);
}

void ShutdownHooks(const Napi::CallbackInfo &info)
{
    if (g_ForegroundHook)
    {
        UnhookWinEvent(g_ForegroundHook);
    }

    if (g_MouseHook)
    {
        UnhookWindowsHookEx(g_MouseHook);
    }

    if (g_KeyboardHook)
    {
        UnhookWindowsHookEx(g_KeyboardHook);
    }
}

void SetScrollHookEnabled(const Napi::CallbackInfo &info)
{
    Napi::Boolean enabled = info[0].As<Napi::Boolean>();
    g_ctrlScrollEnabled = enabled.Value();
}

Napi::Boolean IsPoEForeground(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    bool poefg = pta::IsPoEForeground();

    return Napi::Boolean::New(env, poefg);
}

void SendPasteCommand(const Napi::CallbackInfo &info)
{
    std::vector<INPUT> keystrokes;

    // ensure all used keys are up
    keystrokes.push_back(pta::CreateInput(VK_MENU, false));
    keystrokes.push_back(pta::CreateInput(VK_CONTROL, false));
    keystrokes.push_back(pta::CreateInput('V', false));
    keystrokes.push_back(pta::CreateInput('A', false));
    keystrokes.push_back(pta::CreateInput(VK_BACK, false));

    // open chat
    keystrokes.push_back(pta::CreateInput(VK_RETURN, true));
    keystrokes.push_back(pta::CreateInput(VK_RETURN, false));

    // select all and delete
    keystrokes.push_back(pta::CreateInput(VK_CONTROL, true));
    keystrokes.push_back(pta::CreateInput('A', true));
    keystrokes.push_back(pta::CreateInput('A', false));
    keystrokes.push_back(pta::CreateInput(VK_CONTROL, false));
    keystrokes.push_back(pta::CreateInput(VK_BACK, true));
    keystrokes.push_back(pta::CreateInput(VK_BACK, false));

    // paste command
    keystrokes.push_back(pta::CreateInput(VK_CONTROL, true));
    keystrokes.push_back(pta::CreateInput('V', true));
    keystrokes.push_back(pta::CreateInput('V', false));
    keystrokes.push_back(pta::CreateInput(VK_CONTROL, false));

    // press enter
    keystrokes.push_back(pta::CreateInput(VK_RETURN, true));
    keystrokes.push_back(pta::CreateInput(VK_RETURN, false));

    SendInput(keystrokes.size(), keystrokes.data(), sizeof(keystrokes[0]));
}

void SendCopyCommand(const Napi::CallbackInfo &info)
{
    std::vector<INPUT> keystrokes;

    // ensure all used keys are up
    keystrokes.push_back(pta::CreateInput(VK_MENU, false));
    keystrokes.push_back(pta::CreateInput(VK_CONTROL, false));
    keystrokes.push_back(pta::CreateInput('C', false));

    keystrokes.push_back(pta::CreateInput(VK_CONTROL, true));
    keystrokes.push_back(pta::CreateInput('C', true));
    keystrokes.push_back(pta::CreateInput('C', false));
    keystrokes.push_back(pta::CreateInput(VK_CONTROL, false));

    SendInput(keystrokes.size(), keystrokes.data(), sizeof(keystrokes[0]));
}

Napi::Object init(Napi::Env env, Napi::Object exports)
{
    // raw funcs
    exports.Set(Napi::String::New(env, "IsPoEForeground"), Napi::Function::New(env, IsPoEForeground));
    exports.Set(Napi::String::New(env, "SendCopyCommand"), Napi::Function::New(env, SendCopyCommand));
    exports.Set(Napi::String::New(env, "SendPasteCommand"), Napi::Function::New(env, SendPasteCommand));

    // cbs
    exports.Set(Napi::String::New(env, "onForegroundChange"), Napi::Function::New(env, InstallForegroundHookCb));

    // set
    exports.Set(Napi::String::New(env, "SetScrollHookEnabled"), Napi::Function::New(env, SetScrollHookEnabled));
    exports.Set(Napi::String::New(env, "InitializeHooks"), Napi::Function::New(env, InitializeHooks));
    exports.Set(Napi::String::New(env, "ShutdownHooks"), Napi::Function::New(env, ShutdownHooks));
    return exports;
};

NODE_API_MODULE(NODE_GYP_MODULE_NAME, init);
