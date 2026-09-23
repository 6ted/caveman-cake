import { API_URL } from "../api";
import { useEffect, useState } from "react";
import "./Download.css";

export default function Download() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  const params =
    new URLSearchParams(window.location.search);

  const token =
    params.get("token");


  useEffect(() => {
    const verifyDownload = async () => {

      if (!token) {
        setError(
          "No download authorization was provided."
        );

        setLoading(false);

        return;
      }


      try {

        const response =
          await fetch(
            `${API_URL}/api/download/check?token=${encodeURIComponent(token)}`
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.message ||
              "Download access denied."
          );
        }


        setAuthorized(true);

      } catch (error) {

        console.error(
          "Download verification error:",
          error
        );

        setError(
          error.message ||
            "Your download could not be verified."
        );

      } finally {

        setLoading(false);

      }
    };


    verifyDownload();

  }, [token]);


  const handleDownload = () => {

   window.location.href =
  `${API_URL}/api/download?token=${encodeURIComponent(token)}`;

  };


  const handleHome = () => {
    window.location.href = "/";
  };


  if (loading) {
    return (
      <main className="download-page">
        <div className="download-card">
          <p className="download-label">
            CAVEMAN CAKE
          </p>

          <h1>
            Checking your purchase...
          </h1>

          <p>
            Please wait while we verify your
            download access.
          </p>
        </div>
      </main>
    );
  }


  if (!authorized) {
    return (
      <main className="download-page">
        <div className="download-card">

          <p className="download-label">
            DOWNLOAD ACCESS
          </p>

          <h1>
            Access unavailable.
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="download-secondary"
            onClick={handleHome}
          >
            BACK TO CAVEMAN CAKE
          </button>

        </div>
      </main>
    );
  }


  return (
    <main className="download-page">

      <div className="download-card success">

        <p className="download-label">
          PAYMENT CONFIRMED
        </p>

        <div className="success-icon">
          ✓
        </div>

        <h1>
          Your cake is ready.
        </h1>

        <p>
          Thank you for purchasing Caveman Cake —
          Slice 1.
        </p>

        <p>
          Your payment has been successfully
          confirmed and your full sample pack is
          ready to download.
        </p>

        <button
          type="button"
          className="download-button"
          onClick={handleDownload}
        >
          DOWNLOAD FULL PACK
          <span>↓</span>
        </button>

        <button
          type="button"
          className="download-secondary"
          onClick={handleHome}
        >
          BACK TO CAVEMAN CAKE
        </button>

        <p className="download-note">
          Caveman Cake — Slice 1
          <br />
          Produced at Cave Tunes
        </p>

      </div>

    </main>
  );
}