#include <napi.h>
#include <Windows.h>

#include <thread>
#include <chrono>

namespace
{
    const double STASH_WIDTH_PCT = 0.346875;

    HWINEVENTHOOK g_ForegroundHook = nullptr;

    HWND g_LastPoEHwnd = nullptr;
    HWND g_clipboardMonitor = nullptr;

    Napi::ThreadSafeFunction g_Callback;

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

} // namespace pta

VOID CALLBACK
ForegroundHookCallback(HWINEVENTHOOK hWinEventHook, DWORD dwEvent, HWND hwnd, LONG idObject, LONG idChild, DWORD dwEventThread, DWORD dwmsEventTime)
{
    auto callback = [](Napi::Env env, Napi::Function jsCallback, bool *value)
    {
        jsCallback.Call({Napi::String::New(env, "foreground"), Napi::Boolean::New(env, *value)});

        delete value;
    };

    bool *poefg = new bool(pta::IsPoEForeground());
    g_Callback.BlockingCall(poefg, callback);
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

LRESULT CALLBACK ClipboardMonitorProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
{
    auto callback = [](Napi::Env env, Napi::Function jsCallback)
    {
        jsCallback.Call({Napi::String::New(env, "clipboard")});
    };

    switch (message)
    {
    case WM_CLIPBOARDUPDATE:
        g_Callback.BlockingCall(callback);
        break;
    case WM_DESTROY:
        PostQuitMessage(0);
        break;
    case WM_CLOSE:
        DestroyWindow(hWnd);
        break;
    }

    return DefWindowProc(hWnd, message, wParam, lParam);
}

void InitClipboardMonitor()
{
    HINSTANCE hInst = NULL;
    GetModuleHandleEx(0, NULL, &hInst);

    LPCWSTR className = L"PTANextClipboardMonitor";

    WNDCLASSEX wx = {};
    wx.cbSize = sizeof(WNDCLASSEX);
    wx.lpfnWndProc = ClipboardMonitorProc;
    wx.hInstance = hInst;
    wx.lpszClassName = className;

    if (!RegisterClassEx(&wx))
    {
        return;
    }

    g_clipboardMonitor = CreateWindowEx(0, className, (LPCWSTR) "Clipboard Monitor", 0, 0, 0, 0, 0, HWND_MESSAGE, NULL, NULL, NULL);

    if (!g_clipboardMonitor)
    {
        return;
    }

    BOOL res = AddClipboardFormatListener(g_clipboardMonitor);

    if (!res)
    {
        DestroyWindow(g_clipboardMonitor);
        g_clipboardMonitor = nullptr;
        return;
    }

    g_Callback.Acquire();

    MSG msg;

    while (GetMessage(&msg, nullptr, 0, 0))
    {
        if (msg.message == WM_QUIT)
            break;

        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    g_Callback.Release();
}

void ShutdownClipboardMonitor()
{
    if (g_clipboardMonitor)
    {
        RemoveClipboardFormatListener(g_clipboardMonitor);
        DestroyWindow(g_clipboardMonitor);
        g_clipboardMonitor = nullptr;
    }
}

void InitializeHooks(const Napi::CallbackInfo &info)
{
    g_ForegroundHook = SetWinEventHook(
        EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, NULL, ForegroundHookCallback, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS);
}

void ShutdownHooks(const Napi::CallbackInfo &info)
{
    if (g_ForegroundHook)
    {
        UnhookWinEvent(g_ForegroundHook);
    }
}

void Start(const Napi::CallbackInfo &info)
{
    HWND poehwnd = FindWindow(s_poeCls.c_str(), nullptr);

    if (poehwnd)
    {
        g_LastPoEHwnd = poehwnd;
    }

    std::thread clipthread(InitClipboardMonitor);
    clipthread.detach();
}

void Stop(const Napi::CallbackInfo &info)
{
    ShutdownClipboardMonitor();
}

void InstallHandlerCallback(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    g_Callback = Napi::ThreadSafeFunction::New(env, info[0].As<Napi::Function>(), "Event Handler", 0, 1, [](Napi::Env)
                                               { ShutdownClipboardMonitor(); });
}

Napi::Object GetPoERect(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    Napi::Object result = Napi::Object::New(env);

    result.Set(Napi::String::New(env, "valid"), false);

    if (g_LastPoEHwnd)
    {
        result.Set(Napi::String::New(env, "valid"), true);

        RECT rect;

        GetClientRect(g_LastPoEHwnd, &rect);

        result.Set(Napi::String::New(env, "w"), rect.right);
        result.Set(Napi::String::New(env, "h"), rect.bottom);

        POINT pt = {0, 0};

        ClientToScreen(g_LastPoEHwnd, &pt);

        result.Set(Napi::String::New(env, "x"), pt.x);
        result.Set(Napi::String::New(env, "y"), pt.y);
    }

    return result;
}

Napi::Object init(Napi::Env env, Napi::Object exports)
{
    // raw funcs
    exports.Set(Napi::String::New(env, "IsPoEForeground"), Napi::Function::New(env, IsPoEForeground));
    exports.Set(Napi::String::New(env, "SendPasteCommand"), Napi::Function::New(env, SendPasteCommand));
    exports.Set(Napi::String::New(env, "SetPoEForeground"), Napi::Function::New(env, SetPoEForeground));
    exports.Set(Napi::String::New(env, "GetPoERect"), Napi::Function::New(env, GetPoERect));

    // cbs
    exports.Set(Napi::String::New(env, "InstallHandlerCallback"), Napi::Function::New(env, InstallHandlerCallback));

    // set
    exports.Set(Napi::String::New(env, "InitializeHooks"), Napi::Function::New(env, InitializeHooks));
    exports.Set(Napi::String::New(env, "ShutdownHooks"), Napi::Function::New(env, ShutdownHooks));
    exports.Set(Napi::String::New(env, "Start"), Napi::Function::New(env, Start));
    exports.Set(Napi::String::New(env, "Stop"), Napi::Function::New(env, Stop));
    return exports;
};

NODE_API_MODULE(NODE_GYP_MODULE_NAME, init);
