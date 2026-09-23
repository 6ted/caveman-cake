
import { API_URL } from "../api";
import { useState } from "react";
import "./Payment.css";

export default function Payment() {
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    window.location.href = "/";
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      const response = await fetch(
  `${API_URL}/api/payment/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Could not start the payment."
        );
      }

      // Send customer to PayChangu checkout
      window.location.href = data.checkoutUrl;

    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      alert(
        error.message ||
          "Something went wrong while starting the payment."
      );

      setLoading(false);
    }
  };

  return (
    <main className="payment-page">

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="payment-loading-overlay">

          <div className="payment-loading-card">

            <div className="payment-spinner"></div>

            <h2>
              Preparing secure payment
            </h2>

            <p>
              Connecting you to PayChangu...
            </p>

          </div>

        </div>
      )}


      {/* HEADER */}
      <header className="payment-header">

        <button
          type="button"
          className="back-button"
          onClick={handleBack}
          disabled={loading}
        >
          ← Back to Caveman Cake
        </button>

        <div className="payment-brand">
          <strong>
            CAVEMAN CAKE
          </strong>

          <span>
            Produced at Cave Tunes
          </span>
        </div>

      </header>


      {/* CHECKOUT */}
      <section className="payment-container">

        <div className="payment-intro">

          <p className="payment-label">
            SECURE CHECKOUT
          </p>

          <h1>
            Get your ingredients.
          </h1>

          <p>
            Complete your payment to unlock
            Caveman Cake — Slice 1 and download
            the full sample pack.
          </p>

        </div>


        <div className="payment-layout">

          {/* ORDER SUMMARY */}
          <section className="order-card">

            <div className="order-image">

              <img
                src="/caveman-cake.jpg"
                alt="Caveman Cake Slice 1"
              />

            </div>


            <div className="order-content">

              <span className="order-label">
                YOUR ORDER
              </span>

              <h2>
                Caveman Cake
              </h2>

              <h3>
                Slice 1
              </h3>

              <p>
                Melody loops, drum loops, textures,
                one shots and MIDI files created for
                producers and musicians.
              </p>


              <div className="order-divider" />


              <div className="order-row">

                <span>
                  Product
                </span>

                <strong>
                  Caveman Cake — Slice 1
                </strong>

              </div>


              <div className="order-row">

                <span>
                  Delivery
                </span>

                <strong>
                  Digital Download
                </strong>

              </div>


              <div className="order-row">

                <span>
                  Access
                </span>

                <strong>
                  After payment
                </strong>

              </div>

            </div>

          </section>


          {/* PAYMENT CARD */}
          <section className="checkout-card">

            <div className="checkout-heading">

              <span className="order-label">
                PAYMENT
              </span>

              <h2>
                Secure your download.
              </h2>

              <p>
                You will be redirected to PayChangu
                to complete your payment securely.
              </p>

            </div>


            {/* PRICE */}
            <div className="payment-price">

              <span>
                Total
              </span>

              <strong>
                MWK 100.00
              </strong>

              <span>
                ($10.00 USD)
              </span>

            </div>


            {/* PAYMENT METHOD */}
            <div className="payment-method">

              <div className="payment-method-icon">
                ₱
              </div>

              <div>

                <strong>
                  PayChangu
                </strong>

                <span>
                  Secure online payment
                </span>

              </div>

            </div>


            {/* NOTICE */}
            <div className="payment-notice">

              <span>
                ✓
              </span>

              <p>
                Your download will only become
                available after your payment has
                been successfully confirmed.
              </p>

            </div>


            {/* PAY BUTTON */}
            <button
              type="button"
              className="pay-button"
              onClick={handlePayment}
              disabled={loading}
            >

              {loading
                ? "STARTING PAYMENT..."
                : "CONTINUE TO PAYMENT"}

              <span>
                →
              </span>

            </button>


            <p className="secure-payment">
              🔒 Secure payment powered by PayChangu
            </p>

          </section>

        </div>


        {/* PAYMENT INFORMATION */}
        <section className="payment-information">

          <div className="payment-info-item">

            <span>
              01
            </span>

            <div>

              <strong>
                Pay securely
              </strong>

              <p>
                Complete the payment using the
                available PayChangu payment methods.
              </p>

            </div>

          </div>


          <div className="payment-info-item">

            <span>
              02
            </span>

            <div>

              <strong>
                Payment verification
              </strong>

              <p>
                Your payment will be verified before
                download access is granted.
              </p>

            </div>

          </div>


          <div className="payment-info-item">

            <span>
              03
            </span>

            <div>

              <strong>
                Download your pack
              </strong>

              <p>
                After successful verification, you
                will be redirected to your download
                page.
              </p>

            </div>

          </div>

        </section>


        {/* LICENSE REMINDER */}
        <section className="payment-license">

          <strong>
            Before you continue
          </strong>

          <p>
            By completing this purchase, you confirm
            that you have read and accepted the
            Caveman Cake Slice 1 license agreement
            shown on the previous page.
          </p>

          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
          >
            Review product information
          </button>

        </section>

      </section>


      {/* FOOTER */}
      <footer className="payment-footer">

        <strong>
          CAVEMAN CAKE
        </strong>

        <span>
          Produced at Cave Tunes
        </span>

      </footer>

    </main>
  );
}

