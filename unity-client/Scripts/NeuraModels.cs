using System;

namespace Neura
{
    // ---------------------------------------------------------------------
    // REST response shapes. These match what the backend returns today.
    // Unity's built-in JsonUtility fills these in by field name.
    // ---------------------------------------------------------------------

    [Serializable]
    public class AuthUser
    {
        public int id;
        public string email;
        public string name;
        public string avatarUrl;
        public int xp;
        public int level;
        public int streak;
        public bool hasProgram;
        public bool onboarded;
        public string createdAt;
    }

    /// <summary>Returned by /auth/register and /auth/login.</summary>
    [Serializable]
    public class AuthResponse
    {
        public AuthUser user;
        public string token;
    }

    /// <summary>Returned by /player/profile (GET and PUT).</summary>
    [Serializable]
    public class PlayerProfile
    {
        public int userId;
        public string displayName;
        public string gender;
        public string bio;
        public bool hasPhoto;
        public string photoUrl;
    }

    /// <summary>Returned by /wallet.</summary>
    [Serializable]
    public class Wallet
    {
        public int coins;
        public int gems;
    }

    // ---------------------------------------------------------------------
    // Realtime (WebSocket) wire shapes. Every message is JSON with a "t"
    // (type) field. Parse the envelope first, then the specific type.
    // ---------------------------------------------------------------------

    [Serializable]
    public class Envelope
    {
        public string t;
    }

    /// <summary>{ t:"welcome", id } — your own player id.</summary>
    [Serializable]
    public class WelcomeMsg
    {
        public string t;
        public string id;
    }

    /// <summary>A player as seen by everyone else in the city.</summary>
    [Serializable]
    public class PlayerWire
    {
        public string id;
        public string name;
        public string gender;
        public string avatarId;
        public float x;
        public float z;
        public float h;
    }

    /// <summary>{ t:"snapshot", players:[...] } — everyone already online.</summary>
    [Serializable]
    public class SnapshotMsg
    {
        public string t;
        public PlayerWire[] players;
    }

    /// <summary>{ t:"join", player } — someone appeared.</summary>
    [Serializable]
    public class JoinMsg
    {
        public string t;
        public PlayerWire player;
    }

    /// <summary>{ t:"leave", id } — someone disappeared.</summary>
    [Serializable]
    public class LeaveMsg
    {
        public string t;
        public string id;
    }

    /// <summary>{ t:"state", id, x, z, h } — someone moved.</summary>
    [Serializable]
    public class StateMsg
    {
        public string t;
        public string id;
        public float x;
        public float z;
        public float h;
    }

    /// <summary>A single chat line.</summary>
    [Serializable]
    public class ChatWire
    {
        public string id;
        public string name;
        public string text;
        public long ts;
    }

    /// <summary>{ t:"chat", msg } — someone said something.</summary>
    [Serializable]
    public class ChatMsg
    {
        public string t;
        public ChatWire msg;
    }
}
