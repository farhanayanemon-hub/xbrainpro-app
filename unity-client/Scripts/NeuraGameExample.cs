using UnityEngine;

namespace Neura
{
    /// <summary>
    /// A minimal end-to-end example. Put this on ONE empty GameObject in your
    /// scene — it will auto-add NeuraApi and NeuraRealtime. Set the server
    /// address in NeuraConfig.cs first, then press Play and watch the Console:
    ///
    ///   1. Logs in (registers the test account the first time).
    ///   2. Loads the world map.
    ///   3. Opens the realtime socket and joins the city.
    ///   4. Prints other players joining/leaving/moving and chat lines.
    ///
    /// This is a connection sanity check, not gameplay — wire the events into
    /// your own avatars, map, and UI.
    /// </summary>
    [RequireComponent(typeof(NeuraApi))]
    [RequireComponent(typeof(NeuraRealtime))]
    public class NeuraGameExample : MonoBehaviour
    {
        [Header("Test account (change to anything)")]
        public string email = "unity-test@neura.city";
        public string password = "test-password-123";
        public string displayName = "UnityTester";
        public string avatarId = "ryan";

        private NeuraRealtime rt;

        private void Start()
        {
            rt = GetComponent<NeuraRealtime>();

            // Join AFTER "welcome" arrives — the server only starts listening
            // for your messages once it has finished authenticating you, so
            // joining on OnWelcome (not OnConnected) avoids a lost join.
            rt.OnWelcome += id =>
            {
                Debug.Log("[Neura] Connected. My id = " + id);
                rt.Join(avatarId);
            };
            rt.OnSnapshot += players => Debug.Log("[Neura] " + players.Length + " player(s) already here.");
            rt.OnPlayerJoin += p => Debug.Log("[Neura] Joined: " + p.name + " (" + p.id + ")");
            rt.OnPlayerLeave += id => Debug.Log("[Neura] Left: " + id);
            rt.OnPlayerMove += s => { /* Move the remote avatar for s.id to (s.x, s.z), heading s.h. */ };
            rt.OnChat += c => Debug.Log("[Neura] " + c.name + ": " + c.text);

            // Try to log in; if the account does not exist yet, register it.
            NeuraApi.Instance.Login(email, password,
                _ => AfterLogin(),
                _ => NeuraApi.Instance.Register(email, password, displayName,
                    __ => AfterLogin(),
                    err => Debug.LogError("[Neura] Auth failed: " + err)));
        }

        private void AfterLogin()
        {
            Debug.Log("[Neura] Logged in as " + NeuraApi.Instance.CurrentUser.name +
                      " (token acquired).");

            NeuraApi.Instance.SaveProfile(displayName, "male", "",
                _ => Debug.Log("[Neura] Profile saved."),
                err => Debug.LogWarning("[Neura] Profile save skipped: " + err));

            NeuraApi.Instance.GetWorldMap(json =>
                Debug.Log("[Neura] World map loaded (" + json.Length + " chars)."));

            rt.Connect();
        }
    }
}
