namespace Neura
{
    /// <summary>
    /// One place to configure which server the Unity client talks to.
    /// Change <see cref="BaseUrl"/> to your own server address:
    ///   - Development (Replit workspace): "https://YOUR-REPL.replit.dev"
    ///   - Live (deployed):                "https://YOUR-APP.replit.app"
    /// Everything else (REST + WebSocket URLs) is derived from it.
    /// </summary>
    public static class NeuraConfig
    {
        // TODO: paste your server address here (no trailing slash needed).
        public static string BaseUrl = "https://YOUR-APP.replit.app";

        /// <summary>REST base, e.g. https://your-app.replit.app/api</summary>
        public static string ApiUrl => BaseUrl.TrimEnd('/') + "/api";

        /// <summary>
        /// Realtime WebSocket URL, e.g. wss://your-app.replit.app/ws
        /// (https -> wss, http -> ws). The auth token is appended as ?token=
        /// by <see cref="NeuraRealtime"/>.
        /// </summary>
        public static string WsUrl
        {
            get
            {
                var b = BaseUrl.TrimEnd('/');
                if (b.StartsWith("https://")) return "wss://" + b.Substring("https://".Length) + "/ws";
                if (b.StartsWith("http://")) return "ws://" + b.Substring("http://".Length) + "/ws";
                return b + "/ws";
            }
        }
    }
}
