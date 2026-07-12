using System;
using System.Globalization;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using NativeWebSocket;

namespace Neura
{
    /// <summary>
    /// Realtime multiplayer client. Requires the NativeWebSocket package
    /// (https://github.com/endel/NativeWebSocket) and a logged-in NeuraApi
    /// (for the auth token).
    ///
    /// Subscribe to the events, call <see cref="Connect"/>, then <see cref="Join"/>
    /// once <see cref="OnWelcome"/> fires (the server only listens for your
    /// messages after it has authenticated you — joining any earlier is lost).
    /// Send <see cref="Move"/> as your local player moves, and
    /// react to other players via OnSnapshot / OnPlayerJoin / OnPlayerLeave /
    /// OnPlayerMove.
    /// </summary>
    public class NeuraRealtime : MonoBehaviour
    {
        private WebSocket ws;

        public event Action OnConnected;
        public event Action<string> OnWelcome;         // your own player id
        public event Action<PlayerWire[]> OnSnapshot;  // everyone already here
        public event Action<PlayerWire> OnPlayerJoin;  // someone appeared
        public event Action<string> OnPlayerLeave;     // id that disappeared
        public event Action<StateMsg> OnPlayerMove;    // someone moved
        public event Action<ChatWire> OnChat;          // someone said something
        public event Action OnClosed;

        public bool IsOpen => ws != null && ws.State == WebSocketState.Open;

        public async void Connect()
        {
            string token = NeuraApi.Instance != null ? NeuraApi.Instance.Token : null;
            if (string.IsNullOrEmpty(token))
            {
                Debug.LogError("[NeuraRealtime] Not logged in — log in with NeuraApi first.");
                return;
            }

            string url = NeuraConfig.WsUrl + "?token=" + Uri.EscapeDataString(token);
            ws = new WebSocket(url);

            ws.OnOpen += () => OnConnected?.Invoke();
            ws.OnError += (e) => Debug.LogError("[NeuraRealtime] " + e);
            ws.OnClose += (e) => OnClosed?.Invoke();
            ws.OnMessage += (bytes) => Dispatch(Encoding.UTF8.GetString(bytes));

            await ws.Connect();
        }

        // ---- outgoing messages ----

        public async void Join(string avatarId)
            => await Send("{\"t\":\"join\",\"avatarId\":" + Q(avatarId) + "}");

        public async void SetAvatar(string avatarId)
            => await Send("{\"t\":\"avatar\",\"avatarId\":" + Q(avatarId) + "}");

        public async void Move(float x, float z, float h)
            => await Send("{\"t\":\"move\",\"x\":" + F(x) + ",\"z\":" + F(z) + ",\"h\":" + F(h) + "}");

        public async void Chat(string text)
            => await Send("{\"t\":\"chat\",\"text\":" + Q(text) + "}");

        /// <summary>Set false while inside a private interior to hide from the city.</summary>
        public async void SetVisible(bool visible)
            => await Send("{\"t\":\"vis\",\"v\":" + (visible ? "true" : "false") + "}");

        private async Task Send(string json)
        {
            if (IsOpen) await ws.SendText(json);
        }

        // ---- incoming messages ----

        private void Dispatch(string json)
        {
            string t = JsonUtility.FromJson<Envelope>(json).t;
            switch (t)
            {
                case "welcome":
                    OnWelcome?.Invoke(JsonUtility.FromJson<WelcomeMsg>(json).id);
                    break;
                case "snapshot":
                    OnSnapshot?.Invoke(JsonUtility.FromJson<SnapshotMsg>(json).players);
                    break;
                case "join":
                    OnPlayerJoin?.Invoke(JsonUtility.FromJson<JoinMsg>(json).player);
                    break;
                case "leave":
                    OnPlayerLeave?.Invoke(JsonUtility.FromJson<LeaveMsg>(json).id);
                    break;
                case "state":
                    OnPlayerMove?.Invoke(JsonUtility.FromJson<StateMsg>(json));
                    break;
                case "chat":
                    OnChat?.Invoke(JsonUtility.FromJson<ChatMsg>(json).msg);
                    break;
                // "chatlog", "dm", "muted", "error" also exist — see the guide.
            }
        }

        private void Update()
        {
#if !UNITY_WEBGL || UNITY_EDITOR
            // On non-WebGL platforms received messages are queued and must be
            // pumped from the main thread. WebGL delivers them directly.
            ws?.DispatchMessageQueue();
#endif
        }

        private async void OnApplicationQuit()
        {
            if (ws != null) await ws.Close();
        }

        private async void OnDestroy()
        {
            if (ws != null) await ws.Close();
        }

        private static string F(float v) => v.ToString("0.###", CultureInfo.InvariantCulture);

        private static string Q(string s)
        {
            if (s == null) return "\"\"";
            var sb = new StringBuilder(s.Length + 2);
            sb.Append('"');
            foreach (char c in s)
            {
                switch (c)
                {
                    case '\\': sb.Append("\\\\"); break;
                    case '"': sb.Append("\\\""); break;
                    case '\b': sb.Append("\\b"); break;
                    case '\f': sb.Append("\\f"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < ' ') sb.Append("\\u").Append(((int)c).ToString("x4"));
                        else sb.Append(c);
                        break;
                }
            }
            sb.Append('"');
            return sb.ToString();
        }
    }
}
