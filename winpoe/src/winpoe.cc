#include <napi.h>
#include <Windows.h>

namespace
{
HWINEVENTHOOK g_ForegroundHook = nullptr;
Napi::FunctionReference g_ForegroundHookCb;
HWND g_LastPoEHwnd = nullptr;

std::wstring s_poeCls = L"POEWindowClass";
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

    g_LastPoEHwnd = hwnd;

    return true;
}

bool CheckBounds(RECT bounds, int x, int y)
{
    return (x > bounds.left && x < bounds.right && y > bounds.top && y < bounds.bottom);
}

bool CheckMouseInStash(RECT bounds, int x)
{
    int winLength = bounds.right - bounds.left;
    int stashLength = (int)((double)winLength * 0.346875);

    return (x > bounds.left && x < (bounds.left + stashLength));
}

} // namespace pta

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

    // open chat
    keystrokes.push_back(pta::CreateInput(VK_RETURN, true));
    keystrokes.push_back(pta::CreateInput(VK_RETURN, false));

    // restore previous line before command
    keystrokes.push_back(pta::CreateInput(VK_UP, true));
    keystrokes.push_back(pta::CreateInput(VK_UP, false));
    keystrokes.push_back(pta::CreateInput(VK_UP, true));
    keystrokes.push_back(pta::CreateInput(VK_UP, false));

    // exit chat
    keystrokes.push_back(pta::CreateInput(VK_ESCAPE, true));
    keystrokes.push_back(pta::CreateInput(VK_ESCAPE, false));

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

void SendStashMove(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::Number direction = info[0].As<Napi::Number>();
    Napi::Number x = info[1].As<Napi::Number>();
    Napi::Number y = info[2].As<Napi::Number>();

    if (pta::IsPoEForeground())
    {
        HWND hwnd = GetForegroundWindow();
        RECT screen;

        if (GetWindowRect(hwnd, &screen) && pta::CheckBounds(screen, x.Int32Value(), y.Int32Value()) && !pta::CheckMouseInStash(screen, x.Int32Value()))
        {
            WORD key = (direction.Int32Value() > 0 ? VK_RIGHT : VK_LEFT);

            // Send input
            std::vector<INPUT> keystroke;

            keystroke.push_back(pta::CreateInput(key, true));
            keystroke.push_back(pta::CreateInput(key, false));

            SendInput(keystroke.size(), keystroke.data(), sizeof(keystroke[0]));
        }
    }
}

Napi::Boolean SetPoEForeground(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    if (g_LastPoEHwnd)
    {
        BOOL result = SetForegroundWindow(g_LastPoEHwnd);

        return Napi::Boolean::New(env, result != 0);
    }

    return Napi::Boolean::New(env, false);
}

void InitializeHooks(const Napi::CallbackInfo &info)
{
    g_ForegroundHook = SetWinEventHook(
        EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, NULL, ForegroundHookCallback, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS);

    HWND poehwnd = FindWindow(s_poeCls.c_str(), nullptr);

    if (poehwnd)
    {
        g_LastPoEHwnd = poehwnd;
    }
}

void ShutdownHooks(const Napi::CallbackInfo &info)
{
    if (g_ForegroundHook)
    {
        UnhookWinEvent(g_ForegroundHook);
    }
}

Napi::Object init(Napi::Env env, Napi::Object exports)
{
    // raw funcs
    exports.Set(Napi::String::New(env, "IsPoEForeground"), Napi::Function::New(env, IsPoEForeground));
    exports.Set(Napi::String::New(env, "SendCopyCommand"), Napi::Function::New(env, SendCopyCommand));
    exports.Set(Napi::String::New(env, "SendPasteCommand"), Napi::Function::New(env, SendPasteCommand));
    exports.Set(Napi::String::New(env, "SendStashMove"), Napi::Function::New(env, SendStashMove));
    exports.Set(Napi::String::New(env, "SetPoEForeground"), Napi::Function::New(env, SetPoEForeground));

    // cbs
    exports.Set(Napi::String::New(env, "onForegroundChange"), Napi::Function::New(env, InstallForegroundHookCb));

    // set
    exports.Set(Napi::String::New(env, "InitializeHooks"), Napi::Function::New(env, InitializeHooks));
    exports.Set(Napi::String::New(env, "ShutdownHooks"), Napi::Function::New(env, ShutdownHooks));
    return exports;
};

NODE_API_MODULE(NODE_GYP_MODULE_NAME, init);
