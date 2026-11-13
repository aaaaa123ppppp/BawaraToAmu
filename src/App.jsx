
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

const ROOM = "amu-apology";

const DEFAULT_MESSAGE = `Dear AMU,

I know I may have hurt you, and I genuinely regret it.

I never wanted to make you sad. You are special to me, and I don't want a mistake to come between us.

I cannot change what happened, but I can promise to learn from it.

Please forgive your Bawara.

A thousand apologies and lots of love. ❤️`;

function App() {
  const params = new URLSearchParams(window.location.search);
  const isHer = params.get("role") === "her";

  const [status, setStatus] = useState("waiting");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [error, setError] = useState("");

  function updateStatus(event) {
    setStatus(event === "reset" ? "waiting" : event);
  }

  useEffect(() => {
    let active = true;

    const channel = supabase
      .channel("amu-apology-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "apology_events",
          filter: `room=eq.${ROOM}`,
        },
        (payload) => {
          if (!active) return;

          updateStatus(payload.new.event);
          setLoading(false);
        }
      )
      .subscribe(async (state) => {
        if (!active) return;

        if (state === "SUBSCRIBED") {
          setConnected(true);
          setError("");

          const { data, error: fetchError } = await supabase
            .from("apology_events")
            .select("event")
            .eq("room", ROOM)
            .order("id", { ascending: false })
            .limit(1);

          if (!active) return;

          if (fetchError) {
            setError(fetchError.message);
            return;
          }

          if (data && data.length > 0) {
            updateStatus(data[0].event);
          } else {
            setStatus("waiting");
          }
        }

        if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          setConnected(false);
          setError("Live connection failed. Please check Supabase.");
        }

        if (state === "CLOSED") {
          setConnected(false);
        }
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function sendEvent(event) {
    if (!connected || loading) return;

    setLoading(true);
    setError("");

    const { error: insertError } = await supabase
      .from("apology_events")
      .insert({
        room: ROOM,
        event,
      });

    if (insertError) {
      console.error(insertError);
      setError("Could not send your response. Please try again.");
      setLoading(false);
      return;
    }

    updateStatus(event);
    setLoading(false);
  }

  async function refreshExperience() {
    if (!connected || loading) return;

    const confirmed = window.confirm(
      "Shall we start with a fresh apology again? 🥺❤️"
    );

    if (confirmed) {
      await sendEvent("reset");
    }
  }

  return (
    <div className="app">
      <div className="hearts">
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i}>♥</span>
        ))}
      </div>

      <div className="sorry-background">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            className="sorry-line"
            key={i}
            style={{ animationDelay: `${i * -2}s` }}
          >
            {Array.from({ length: 5 }, (_, j) => (
              <span key={j}>SORRY AMU ❤️</span>
            ))}
          </div>
        ))}
      </div>

      <main className="main-card">
        <div className="top-heart">
          {status === "waiting" ? "💗" : "❤️"}
        </div>

        <p className="small-heading">
          {isHer
            ? "A LITTLE MESSAGE FROM YOUR BAWARA"
            : "A LITTLE APOLOGY FROM THE HEART"}
        </p>

        <h1>
          {status === "waiting" ? (
            <>
              Sorry,
              <br />
              <span>AMU ❤️</span>
            </>
          ) : status === "forgiven" ? (
            <>
              Thank You,
              <br />
              <span>AMU ❤️</span>
            </>
          ) : (
            <>
              LOVE YOU,
              <br />
              <span>AMU ❤️</span>
            </>
          )}
        </h1>

        <p className="subtitle">
          {status === "waiting"
            ? "If every sorry could become a flower, I would fill the whole world for you. 🌷"
            : status === "forgiven"
            ? "You just made your Bawara the happiest person. 🥹"
            : "A little thank you, from Bawara to AMU. ❤️"}
        </p>

        <div className="connection-status">
          <span className={connected ? "online-dot" : "offline-dot"} />
          {connected
            ? "Live connection active"
            : "Connecting to the love server..."}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="infinite-box">
          <div className="infinite-track">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i}>SORRY AMU ❤️</span>
            ))}
          </div>
        </div>

        {status === "waiting" && (
          <section className="letter">
            <div className="letter-icon">💌</div>
            <h2>A letter from Bawara</h2>

            <textarea
              className="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              readOnly={isHer}
              rows={7}
            />

            <p className="letter-footer">
              Every word comes straight from my heart. ❤️
            </p>
          </section>
        )}

        {status === "waiting" && (
          <section className="forgiveness-section">
            {isHer ? (
              <>
                <h2>AMU, can you forgive your Bawara? 🥺</h2>

                <p className="question">
                  No pressure. Take your time. Your feelings matter.
                </p>

                <button
                  className="yes-button"
                  disabled={loading || !connected}
                  onClick={() => sendEvent("forgiven")}
                >
                  {loading
                    ? "Sending..."
                    : "I Forgive You, Bawara ❤️"}
                </button>
              </>
            ) : (
              <>
                <h2>Waiting for AMU's response 🥺</h2>

                <p className="question">
                  Your Bawara is waiting patiently. ❤️
                </p>

                <div className="waiting-heart">💗</div>

                <p className="question">
                  Every second, another sorry for AMU.
                </p>
              </>
            )}
          </section>
        )}

        {status === "forgiven" && (
          <section className="success-message">
            <div className="success-heart">❤️</div>

            <h2>
              {isHer
                ? "YOU MADE HIS DAY!"
                : "SHE FORGAVE YOU, BAWARA!"}
            </h2>

            <p>
              {isHer
                ? "Your forgiveness has reached Bawara. He is so happy! 💗"
                : "AMU has forgiven you! Now make sure you keep that smile on her face. 🥹"}
            </p>

            {!isHer && (
              <button
                className="yes-button live-button"
                disabled={loading || !connected}
                onClick={() => sendEvent("thank_you")}
              >
                {loading
                  ? "Sending..."
                  : "Thank You AMU 🥹❤️"}
              </button>
            )}
          </section>
        )}

        {status === "thank_you" && (
          <section className="success-message">
            <div className="success-heart">💗</div>

            <h2>
              {isHer
                ? "BAWARA SAYS THANK YOU!"
                : "THANK YOU SENT, BAWARA!"}
            </h2>

            <p>
              {isHer
                ? "Your forgiveness means a lot to him. Your Bawara is really happy! 🥹"
                : "Your thank-you message has reached AMU's screen. ❤️"}
            </p>

            <div className="celebration">
              🥰 💗 🌸 🧸 💕
            </div>
          </section>
        )}

        <section className="romantic-apology">
          <div className="apology-icon">🌹</div>

          <p className="apology-label">
            A FEW WORDS FROM BAWARA
          </p>

          <h2>I'm Truly Sorry, AMU ❤️</h2>

          <p className="apology-text">
            I am genuinely sorry for my silly act today, AMU.
            I know I should have been more thoughtful, and
            I regret hurting you.
          </p>

          <p className="apology-text">
            You deserve all the love, respect, happiness and
            beautiful smiles in this world. I wish I could
            take that moment back, but I promise to learn
            from my mistakes and do better.
          </p>

          <p className="apology-highlight">
            Please don't let one silly moment overshadow
            all the beautiful moments. ❤️
          </p>

          <div className="apology-signature">
            With all my heart,
            <strong>Your Bawara 🥺</strong>
          </div>

          <div className="apology-hearts">
            ❤️ 💗 🌷 💕
          </div>
        </section>

        {/* Cute shared refresh button */}
        <section className="restart-section">
          <button
            className="restart-button"
            disabled={loading || !connected}
            onClick={refreshExperience}
          >
            {loading
              ? "Refreshing..."
              : "One More Sorry? 🥺💗"}
          </button>

          <p className="restart-note">
            Because you deserve a thousand apologies
            and a million smiles. 🌷
          </p>
        </section>

        <footer>
          <p>Made by Bawara, with love for AMU ❤️</p>
          <p>One heart. A thousand apologies. 💗</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
