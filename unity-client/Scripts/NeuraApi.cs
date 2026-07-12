using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace Neura
{
    /// <summary>
    /// REST client for the Neura City backend. Add this component once (an empty
    /// GameObject is fine) and call it from anywhere via <see cref="Instance"/>.
    ///
    /// All calls are coroutines with onOk / onErr callbacks so they never block
    /// the game. The session token from login/register is stored here and sent
    /// automatically as the "Authorization: Bearer" header on later calls.
    /// </summary>
    public class NeuraApi : MonoBehaviour
    {
        public static NeuraApi Instance { get; private set; }

        /// <summary>Session token; set after a successful login/register.</summary>
        public string Token { get; private set; }

        /// <summary>The signed-in user; set after a successful login/register.</summary>
        public AuthUser CurrentUser { get; private set; }

        public bool IsLoggedIn => !string.IsNullOrEmpty(Token);

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        // ------------------------------------------------------------------
        // Auth
        // ------------------------------------------------------------------

        public Coroutine Register(string email, string password, string name,
            Action<AuthResponse> onOk, Action<string> onErr = null)
        {
            string body = "{\"email\":" + Q(email) + ",\"password\":" + Q(password) +
                          ",\"name\":" + Q(name) + "}";
            return StartCoroutine(SendJson("POST", "/auth/register", body, res =>
            {
                var r = JsonUtility.FromJson<AuthResponse>(res);
                Token = r.token;
                CurrentUser = r.user;
                onOk?.Invoke(r);
            }, onErr));
        }

        public Coroutine Login(string email, string password,
            Action<AuthResponse> onOk, Action<string> onErr = null)
        {
            string body = "{\"email\":" + Q(email) + ",\"password\":" + Q(password) + "}";
            return StartCoroutine(SendJson("POST", "/auth/login", body, res =>
            {
                var r = JsonUtility.FromJson<AuthResponse>(res);
                Token = r.token;
                CurrentUser = r.user;
                onOk?.Invoke(r);
            }, onErr));
        }

        public Coroutine GetMe(Action<AuthUser> onOk, Action<string> onErr = null)
            => StartCoroutine(GetJson("/auth/me",
                res => onOk?.Invoke(JsonUtility.FromJson<AuthUser>(res)), onErr));

        public void Logout() { Token = null; CurrentUser = null; }

        // ------------------------------------------------------------------
        // Player profile
        // ------------------------------------------------------------------

        public Coroutine GetProfile(Action<PlayerProfile> onOk, Action<string> onErr = null)
            => StartCoroutine(GetJson("/player/profile",
                res => onOk?.Invoke(JsonUtility.FromJson<PlayerProfile>(res)), onErr));

        public Coroutine SaveProfile(string displayName, string gender, string bio,
            Action<PlayerProfile> onOk, Action<string> onErr = null)
        {
            string body = "{\"displayName\":" + Q(displayName) +
                          ",\"gender\":" + Q(gender) +
                          ",\"bio\":" + Q(bio ?? "") + "}";
            return StartCoroutine(SendJson("PUT", "/player/profile", body,
                res => onOk?.Invoke(JsonUtility.FromJson<PlayerProfile>(res)), onErr));
        }

        // ------------------------------------------------------------------
        // World map (free-form objects; delivered as raw JSON so you can parse
        // it however your scene needs — see the guide for the shape).
        // ------------------------------------------------------------------

        public Coroutine GetWorldMap(Action<string> onOkRawJson, Action<string> onErr = null)
            => StartCoroutine(GetJson("/world/map", onOkRawJson, onErr));

        // ------------------------------------------------------------------
        // Wallet
        // ------------------------------------------------------------------

        public Coroutine GetWallet(Action<Wallet> onOk, Action<string> onErr = null)
            => StartCoroutine(GetJson("/wallet",
                res => onOk?.Invoke(JsonUtility.FromJson<Wallet>(res)), onErr));

        // ------------------------------------------------------------------
        // Low-level HTTP
        // ------------------------------------------------------------------

        private IEnumerator GetJson(string path, Action<string> onOk, Action<string> onErr)
        {
            using var req = UnityWebRequest.Get(NeuraConfig.ApiUrl + path);
            AddAuth(req);
            yield return req.SendWebRequest();
            Handle(req, onOk, onErr);
        }

        private IEnumerator SendJson(string method, string path, string body,
            Action<string> onOk, Action<string> onErr)
        {
            using var req = new UnityWebRequest(NeuraConfig.ApiUrl + path, method);
            req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");
            AddAuth(req);
            yield return req.SendWebRequest();
            Handle(req, onOk, onErr);
        }

        private void AddAuth(UnityWebRequest req)
        {
            if (!string.IsNullOrEmpty(Token))
                req.SetRequestHeader("Authorization", "Bearer " + Token);
        }

        private void Handle(UnityWebRequest req, Action<string> onOk, Action<string> onErr)
        {
            if (req.result == UnityWebRequest.Result.Success)
            {
                onOk?.Invoke(req.downloadHandler.text);
            }
            else
            {
                string msg = (int)req.responseCode + " " + req.error + ": " +
                             (req.downloadHandler != null ? req.downloadHandler.text : "");
                Debug.LogError("[NeuraApi] " + msg);
                onErr?.Invoke(msg);
            }
        }

        /// <summary>Quote + fully escape a string into a JSON string literal
        /// (handles quotes, backslashes, and control chars like newline/tab so
        /// bios and names never produce invalid JSON).</summary>
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
