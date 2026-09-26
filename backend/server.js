
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");


dotenv.config();

const pool = require("./config/database");

const app = express();
app.set("trust proxy", 1);

// ==================================================
// CONFIGURATION
// ==================================================

const PORT =
  Number(process.env.PORT) || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  `http://localhost:${PORT}`;

const PAYCHANGU_SECRET_KEY =
  process.env.PAYCHANGU_SECRET_KEY;

const PAYCHANGU_WEBHOOK_SECRET =
  process.env.PAYCHANGU_WEBHOOK_SECRET;

const PRODUCT_PRICE_MWK =
  Number(
    process.env.PRODUCT_PRICE_MWK || 1500
  );

const PRODUCT_PRICE_USD =
  Number(
    process.env.PRODUCT_PRICE_USD || 10
  );

const PRODUCT_ID =
  "caveman-cake-slice-1";

const PRODUCT_NAME =
  "Caveman Cake — Slice 1";

const DOWNLOAD_TOKEN_LIFETIME_MS =
  30 * 60 * 1000;


// ==================================================
// FILE PATHS
// ==================================================

const PRIVATE_FOLDER =
  path.join(
    __dirname,
    "private"
  );

const DOWNLOAD_FILE =
  path.join(
    PRIVATE_FOLDER,
    "Caveman-Cake-Slice-1.zip"
  );


// ==================================================
// CREATE REQUIRED FOLDER
// ==================================================

if (
  !fs.existsSync(
    PRIVATE_FOLDER
  )
) {
  fs.mkdirSync(
    PRIVATE_FOLDER,
    {
      recursive: true
    }
  );
}


// ==================================================
// SECURITY HEADERS
// ==================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);


// ==================================================
// CORS
// ==================================================
const allowedOrigins = [
  "http://localhost:5173",
  "https://cave.cavetunes.workers.dev",
  "https://cavetunes.site"
];

app.use(
  cors({
    origin: function (origin, callback) {

      // Allow requests without an Origin header.
      // This includes server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      // Allow the known production origins.
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow local Vite development from a phone
      // connected to the same Wi-Fi network.
      if (
        /^http:\/\/192\.168\.\d+\.\d+:5173$/.test(origin) ||
        /^http:\/\/10\.\d+\.\d+\.\d+:5173$/.test(origin) ||
        /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:5173$/.test(origin)
      ) {
        return callback(null, true);
      }

      console.warn(
        "CORS blocked origin:",
        origin
      );

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    methods: [
      "GET",
      "POST",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type"
    ],

    optionsSuccessStatus: 204
  })
);


// ==================================================
// PAYCHANGU WEBHOOK
//
// IMPORTANT:
// Raw body must be processed BEFORE express.json()
// ==================================================

app.post(
  "/api/payment/webhook",
  express.raw({
    type: "application/json",
    limit: "100kb"
  }),
  async (req, res) => {
    try {

      if (
        !PAYCHANGU_WEBHOOK_SECRET
      ) {
        console.error(
          "PAYCHANGU_WEBHOOK_SECRET is not configured."
        );

        return res
          .status(500)
          .send(
            "Webhook secret not configured."
          );
      }


      const signature =
        req.headers.signature;


      if (
        typeof signature !==
        "string"
      ) {
        return res
          .status(401)
          .send(
            "Missing signature."
          );
      }


      const rawBody =
        req.body;


      if (
        !Buffer.isBuffer(
          rawBody
        )
      ) {
        return res
          .status(400)
          .send(
            "Invalid webhook body."
          );
      }


      // ----------------------------------------------
      // VERIFY PAYCHANGU SIGNATURE
      // ----------------------------------------------

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            PAYCHANGU_WEBHOOK_SECRET
          )
          .update(rawBody)
          .digest("hex");


      const receivedBuffer =
        Buffer.from(
          signature,
          "utf8"
        );

      const expectedBuffer =
        Buffer.from(
          expectedSignature,
          "utf8"
        );


      if (
        receivedBuffer.length !==
        expectedBuffer.length
      ) {
        return res
          .status(401)
          .send(
            "Invalid signature."
          );
      }


      const validSignature =
        crypto.timingSafeEqual(
          receivedBuffer,
          expectedBuffer
        );


      if (!validSignature) {
        return res
          .status(401)
          .send(
            "Invalid signature."
          );
      }


      // ----------------------------------------------
      // PARSE WEBHOOK
      // ----------------------------------------------

      let payload;

      try {

        payload =
          JSON.parse(
            rawBody.toString(
              "utf8"
            )
          );

      } catch (error) {

        return res
          .status(400)
          .send(
            "Invalid JSON payload."
          );
      }


      console.log(
        "Valid PayChangu webhook received."
      );


      const txRef =
        payload.tx_ref ||
        payload.data?.tx_ref ||
        payload.transaction?.tx_ref;


      if (!txRef) {

        console.warn(
          "Webhook received without tx_ref."
        );

        return res.sendStatus(200);
      }


      console.log(
        "Webhook tx_ref:",
        txRef
      );


      // ----------------------------------------------
      // ALWAYS RE-VERIFY WITH PAYCHANGU
      // ----------------------------------------------

      const verification =
        await verifyPayChanguTransaction(
          txRef
        );


      if (
        !verification.success
      ) {

        console.error(
          "Webhook payment verification failed:",
          verification.message
        );

        return res.sendStatus(200);
      }


      const payment =
        verification.payment;


      // ----------------------------------------------
      // FIND ORDER
      // ----------------------------------------------

      const orderResult =
        await pool.query(
          `
            SELECT *
            FROM orders
            WHERE tx_ref = $1
            LIMIT 1
          `,
          [txRef]
        );


      if (
        orderResult.rows.length === 0
      ) {

        console.warn(
          "Webhook transaction does not match an existing order:",
          txRef
        );

        return res.sendStatus(200);
      }


      const order =
        orderResult.rows[0];


      // ----------------------------------------------
      // VALIDATE PAYMENT
      // ----------------------------------------------

      const validation =
        validatePayment(
          payment,
          order
        );


      if (!validation.valid) {

        console.error(
          "Webhook payment failed order validation:",
          validation
        );


        await pool.query(
          `
            UPDATE orders
            SET
              status = 'failed',
              updated_at = NOW()
            WHERE id = $1
              AND status <> 'paid'
          `,
          [order.id]
        );


        return res.sendStatus(200);
      }


      // ----------------------------------------------
      // MARK ORDER AS PAID
      //
      // Only update a non-paid order.
      // This prevents webhook retries from
      // generating new tokens.
      // ----------------------------------------------

      if (
        order.status !==
        "paid"
      ) {

        const downloadToken =
          generateDownloadToken();

        const tokenExpiresAt =
          new Date(
            Date.now() +
            DOWNLOAD_TOKEN_LIFETIME_MS
          );


        await pool.query(
          `
            UPDATE orders
            SET
              status = 'paid',
              paid_at = COALESCE(
                paid_at,
                NOW()
              ),
              download_token = COALESCE(
                download_token,
                $1
              ),
              download_token_expires_at = COALESCE(
                download_token_expires_at,
                $2
              ),
              download_used = FALSE,
              download_used_at = NULL,
              paychangu_reference = COALESCE(
                $3,
                paychangu_reference
              ),
              updated_at = NOW()
            WHERE id = $4
              AND status <> 'paid'
          `,
          [
            downloadToken,
            tokenExpiresAt,
            payment.reference || null,
            order.id
          ]
        );
      }


      return res.sendStatus(200);

    } catch (error) {

      console.error(
        "Webhook error:",
        error
      );

      return res
        .status(500)
        .send(
          "Webhook error."
        );
    }
  }
);


// ==================================================
// JSON BODY PARSER
// ==================================================

app.use(
  express.json({
    limit: "100kb"
  })
);


// ==================================================
// CAVEMAN CAKE BUTTON CLICK NOTIFICATION
// ==================================================

// ==================================================
// CAVEMAN CAKE BUTTON CLICK NOTIFICATION
// ==================================================

app.post(
  "/api/pack-interest",
  async (req, res) => {
    try {
      const product =
        req.body?.product ||
        "Caveman Cake Slice 1";

      console.log(
        "🍰 GET THE FULL PACK clicked:",
        product
      );

      return res.json({
        success: true,
        message:
          "Pack interest recorded."
      });

    } catch (error) {
      console.error(
        "Pack interest notification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not process pack interest."
      });
    }
  }
);

// ==================================================
// RATE LIMITERS
// ==================================================

const paymentCreateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 20,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      success: false,
      message:
        "Too many payment attempts. Please try again later."
    }
  });


const downloadLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 30,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message:
      "Too many download requests. Please try again later."
  });


// ==================================================
// DATABASE HELPERS
// ==================================================

async function getOrderByTxRef(
  txRef
) {

  const result =
    await pool.query(
      `
        SELECT *
        FROM orders
        WHERE tx_ref = $1
        LIMIT 1
      `,
      [txRef]
    );

  return (
    result.rows[0] ||
    null
  );
}


async function getOrderByDownloadToken(
  token
) {

  const result =
    await pool.query(
      `
        SELECT *
        FROM orders
        WHERE download_token = $1
        LIMIT 1
      `,
      [token]
    );

  return (
    result.rows[0] ||
    null
  );
}


// ==================================================
// GENERATE PAYCHANGU REFERENCE
// ==================================================

function generateReference() {

  return (
    `CAVEMAN-${Date.now()}-` +
    crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase()
  );
}


// ==================================================
// GENERATE DOWNLOAD TOKEN
// ==================================================

function generateDownloadToken() {

  return crypto
    .randomBytes(32)
    .toString("hex");
}


// ==================================================
// TOKEN EXPIRATION
// ==================================================

function isTokenExpired(
  order
) {

  if (
    !order.download_token_expires_at
  ) {
    return true;
  }


  return (
    Date.now() >=
    new Date(
      order.download_token_expires_at
    ).getTime()
  );
}


// ==================================================
// PAYMENT VALIDATION
// ==================================================

function validatePayment(
  payment,
  order
) {

  const correctReference =
    payment.tx_ref ===
    order.tx_ref;


  const successful =
    payment.status ===
    "success";


  const correctCurrency =
    payment.currency ===
    order.currency;


  const correctAmount =
    Number(
      payment.amount
    ) >=
    Number(
      order.amount
    );


  return {
    valid:
      correctReference &&
      successful &&
      correctCurrency &&
      correctAmount,

    correctReference,

    successful,

    correctCurrency,

    correctAmount
  };
}


// ==================================================
// PAYCHANGU TRANSACTION VERIFICATION
// ==================================================

async function verifyPayChanguTransaction(
  txRef
) {

  try {

    if (
      !PAYCHANGU_SECRET_KEY
    ) {

      return {
        success: false,

        message:
          "PayChangu secret key is not configured."
      };
    }


    const response =
      await fetch(
        `https://api.paychangu.com/verify-payment/${encodeURIComponent(
          txRef
        )}`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${PAYCHANGU_SECRET_KEY}`
          }
        }
      );


    const data =
      await response.json();


    console.log(
      "PayChangu verification:",
      data
    );


    if (
      !response.ok ||
      data.status !==
        "success"
    ) {

      return {
        success: false,

        message:
          data.message ||
          "PayChangu verification failed."
      };
    }


    if (
      !data.data
    ) {

      return {
        success: false,

        message:
          "PayChangu returned no payment data."
      };
    }


    return {
      success: true,

      payment:
        data.data
    };

  } catch (error) {

    console.error(
      "PayChangu verification error:",
      error
    );


    return {
      success: false,

      message:
        "Unable to verify payment with PayChangu."
    };
  }
}


// ==================================================
// HEALTH CHECK
// ==================================================

app.get(
  "/api/health",
  async (req, res) => {

    try {

      // Test PostgreSQL connection
      const result =
        await pool.query(
          "SELECT NOW() AS database_time"
        );


      return res.json({
        success: true,

        message:
          "Caveman Cake backend is running.",

        database:
          "connected",

        databaseTime:
          result.rows[0].database_time
      });

    } catch (error) {

      console.error(
        "Health check database error:",
        error
      );


      return res.status(500).json({
        success: false,

        message:
          "Backend is running but database connection failed."
      });
    }
  }
);


// ==================================================
// CREATE PAYCHANGU PAYMENT
// ==================================================

app.post(
  "/api/payment/create",
  paymentCreateLimiter,

  async (req, res) => {

    try {

      if (
        !PAYCHANGU_SECRET_KEY
      ) {

        return res.status(500).json({
          success: false,

          message:
            "PayChangu secret key is not configured."
        });
      }


      if (
        !Number.isFinite(
          PRODUCT_PRICE_MWK
        ) ||
        PRODUCT_PRICE_MWK <= 0
      ) {

        return res.status(500).json({
          success: false,

          message:
            "Product price is not configured correctly."
        });
      }


      const txRef =
        generateReference();


      const orderId =
        crypto.randomUUID();


      // ----------------------------------------------
      // SAVE PENDING ORDER IN POSTGRESQL
      // ----------------------------------------------

      await pool.query(
        `
          INSERT INTO orders (
            id,
            product_id,
            product_name,
            amount,
            currency,
            usd_price,
            tx_ref,
            status,
            download_token,
            download_token_expires_at,
            download_used,
            download_used_at,
            paid_at,
            paychangu_reference,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            'pending',
            NULL,
            NULL,
            FALSE,
            NULL,
            NULL,
            NULL,
            NOW(),
            NOW()
          )
        `,
        [
          orderId,
          PRODUCT_ID,
          PRODUCT_NAME,
          PRODUCT_PRICE_MWK,
          "MWK",
          PRODUCT_PRICE_USD,
          txRef
        ]
      );


      // ----------------------------------------------
      // CREATE PAYCHANGU CHECKOUT
      // ----------------------------------------------

      const paychanguResponse =
        await fetch(
          "https://api.paychangu.com/payment",
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${PAYCHANGU_SECRET_KEY}`
            },

            body:
              JSON.stringify({

                amount:
                  String(
                    PRODUCT_PRICE_MWK
                  ),

                currency:
                  "MWK",

                tx_ref:
                  txRef,

                callback_url:
                  `${BACKEND_URL}/api/payment/callback`,

                return_url:
                  `${FRONTEND_URL}/payment`,

                customization: {

                  title:
                    PRODUCT_NAME,

                  description:
                    "Caveman Cake Slice 1 Sample Pack"

                },

                meta: {

                  product_id:
                    PRODUCT_ID,

                  order_id:
                    orderId

                }

              })
          }
        );


      const data =
        await paychanguResponse.json();


      console.log(
        "PayChangu create response:",
        data
      );


      // ----------------------------------------------
      // PAYCHANGU PAYMENT CREATION FAILED
      // ----------------------------------------------

      if (
        !paychanguResponse.ok ||
        data.status !==
          "success"
      ) {

        await pool.query(
          `
            DELETE FROM orders
            WHERE id = $1
          `,
          [orderId]
        );


        return res.status(400).json({

          success: false,

          message:
            data.message ||
            "Could not create PayChangu payment."

        });
      }


      const checkoutUrl =
        data?.data?.checkout_url;


      if (
        !checkoutUrl
      ) {

        await pool.query(
          `
            DELETE FROM orders
            WHERE id = $1
          `,
          [orderId]
        );


        return res.status(500).json({

          success: false,

          message:
            "PayChangu did not return a checkout URL."

        });
      }


      return res.json({

        success: true,

        checkoutUrl,

        txRef

      });

    } catch (error) {

      console.error(
        "Payment creation error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to start payment."

      });
    }
  }
);


// ==================================================
// PAYCHANGU CALLBACK
// ==================================================

app.get(
  "/api/payment/callback",

  async (req, res) => {

    try {

      const txRef =
        req.query.tx_ref;


      if (
        !txRef ||
        typeof txRef !==
          "string"
      ) {

        return res.redirect(
          `${FRONTEND_URL}/payment?payment=failed`
        );
      }


      console.log(
        "PayChangu callback:",
        txRef
      );


      // ----------------------------------------------
      // FIND ORDER
      // ----------------------------------------------

      const order =
        await getOrderByTxRef(
          txRef
        );


      if (!order) {

        console.error(
          "Unknown payment reference:",
          txRef
        );


        return res.redirect(
          `${FRONTEND_URL}/payment?payment=failed`
        );
      }


      // ----------------------------------------------
      // VERIFY DIRECTLY WITH PAYCHANGU
      // ----------------------------------------------

      const verification =
        await verifyPayChanguTransaction(
          txRef
        );


      if (
        !verification.success
      ) {

        return res.redirect(
          `${FRONTEND_URL}/payment?payment=failed`
        );
      }


      const payment =
        verification.payment;


      // ----------------------------------------------
      // VALIDATE PAYMENT
      // ----------------------------------------------

      const validation =
        validatePayment(
          payment,
          order
        );


      if (
        !validation.valid
      ) {

        console.error(
          "Payment verification failed:",
          validation
        );


        await pool.query(
          `
            UPDATE orders
            SET
              status = 'failed',
              updated_at = NOW()
            WHERE id = $1
              AND status <> 'paid'
          `,
          [order.id]
        );


        return res.redirect(
          `${FRONTEND_URL}/payment?payment=failed`
        );
      }


      // ----------------------------------------------
      // IF ALREADY PAID
      // KEEP EXISTING TOKEN
      // ----------------------------------------------

      let finalOrder =
        order;


      if (
        order.status !==
        "paid"
      ) {

        const downloadToken =
          generateDownloadToken();

        const tokenExpiresAt =
          new Date(
            Date.now() +
            DOWNLOAD_TOKEN_LIFETIME_MS
          );


        const updateResult =
          await pool.query(
            `
              UPDATE orders
              SET
                status = 'paid',
                paid_at = COALESCE(
                  paid_at,
                  NOW()
                ),
                download_token = COALESCE(
                  download_token,
                  $1
                ),
                download_token_expires_at = COALESCE(
                  download_token_expires_at,
                  $2
                ),
                download_used = FALSE,
                download_used_at = NULL,
                paychangu_reference = COALESCE(
                  $3,
                  paychangu_reference
                ),
                updated_at = NOW()
              WHERE id = $4
                AND status <> 'paid'
              RETURNING *
            `,
            [
              downloadToken,
              tokenExpiresAt,
              payment.reference || null,
              order.id
            ]
          );


        if (
          updateResult.rows.length > 0
        ) {

          finalOrder =
            updateResult.rows[0];

        } else {

          // Another process, such as the webhook,
          // may have completed the payment first.

          finalOrder =
            await getOrderByTxRef(
              txRef
            );
        }
      }


      // ----------------------------------------------
      // SEND CUSTOMER TO DOWNLOAD PAGE
      // ----------------------------------------------

      if (
        !finalOrder ||
        !finalOrder.download_token
      ) {

        console.error(
          "Paid order has no download token:",
          txRef
        );


        return res.redirect(
          `${FRONTEND_URL}/payment?payment=failed`
        );
      }


      return res.redirect(
        `${FRONTEND_URL}/download?token=${encodeURIComponent(
          finalOrder.download_token
        )}`
      );

    } catch (error) {

      console.error(
        "Callback error:",
        error
      );


      return res.redirect(
        `${FRONTEND_URL}/payment?payment=failed`
      );
    }
  }
);


// ==================================================
// DOWNLOAD INFORMATION
// ==================================================

app.get(
  "/api/download/check",

  downloadLimiter,

  async (req, res) => {

    try {

      const token =
        req.query.token;


      if (
        !token ||
        typeof token !==
          "string"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Download token is required."

        });
      }


      const order =
        await getOrderByDownloadToken(
          token
        );


      if (
        !order ||
        order.status !==
          "paid"
      ) {

        return res.status(403).json({

          success: false,

          message:
            "Download access is not available."

        });
      }


      // ----------------------------------------------
      // TOKEN EXPIRATION
      // ----------------------------------------------

      if (
        isTokenExpired(
          order
        )
      ) {

        return res.status(403).json({

          success: false,

          message:
            "Your download link has expired."

        });
      }


      // ----------------------------------------------
      // ONE-TIME DOWNLOAD
      // ----------------------------------------------

      if (
        order.download_used
      ) {

        return res.status(403).json({

          success: false,

          message:
            "This download link has already been used."

        });
      }


      return res.json({

        success: true,

        productName:
          order.product_name,

        paidAt:
          order.paid_at,

        expiresAt:
          order.download_token_expires_at

      });

    } catch (error) {

      console.error(
        "Download check error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Could not verify download access."

      });
    }
  }
);


// ==================================================
// PROTECTED DOWNLOAD
// ==================================================

app.get(
  "/api/download",

  downloadLimiter,

  async (req, res) => {

    try {

      const token =
        req.query.token;


      if (
        !token ||
        typeof token !==
          "string"
      ) {

        return res.status(400).send(
          "Download token is required."
        );
      }


      // ----------------------------------------------
      // CHECK ZIP EXISTS FIRST
      // ----------------------------------------------

      if (
        !fs.existsSync(
          DOWNLOAD_FILE
        )
      ) {

        console.error(
          "Protected ZIP not found:",
          DOWNLOAD_FILE
        );


        return res.status(500).send(
          "The sample pack file is not available."
        );
      }


      // ----------------------------------------------
      // FIND VALID ORDER
      // ----------------------------------------------

      const order =
        await getOrderByDownloadToken(
          token
        );


      if (!order) {

        return res.status(403).send(
          "You do not have access to this download."
        );
      }


      if (
        order.status !==
        "paid"
      ) {

        return res.status(403).send(
          "You do not have access to this download."
        );
      }


      // ----------------------------------------------
      // TOKEN EXPIRATION
      // ----------------------------------------------

      if (
        isTokenExpired(
          order
        )
      ) {

        return res.status(403).send(
          "This download link has expired."
        );
      }


      // ----------------------------------------------
      // ATOMIC ONE-TIME TOKEN CONSUMPTION
      //
      // The database itself decides whether
      // this token can still be used.
      //
      // This prevents two simultaneous requests
      // from using the same token.
      // ----------------------------------------------

      const consumeResult =
        await pool.query(
          `
            UPDATE orders
            SET
              download_used = TRUE,
              download_used_at = NOW(),
              updated_at = NOW()
            WHERE id = $1
              AND status = 'paid'
              AND download_used = FALSE
              AND download_token_expires_at > NOW()
            RETURNING *
          `,
          [order.id]
        );


      if (
        consumeResult.rows.length === 0
      ) {

        return res.status(403).send(
          "This download link has already been used or has expired."
        );
      }


      // ----------------------------------------------
      // DOWNLOAD HEADERS
      // ----------------------------------------------

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );

      res.setHeader(
        "Pragma",
        "no-cache"
      );

      res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
      );


      // ----------------------------------------------
      // SEND PRIVATE ZIP
      // ----------------------------------------------

      return res.download(
        DOWNLOAD_FILE,
        "Caveman-Cake-Slice-1.zip",
        {
          dotfiles:
            "deny"
        },
        (error) => {

          if (error) {

            console.error(
              "Download transfer error:",
              error
            );

            /*
              The token has already been consumed.

              This intentionally prevents a failed
              transfer from becoming an unlimited
              reusable download link.

              A future admin/support system can
              issue a fresh token when necessary.
            */
          }
        }
      );

    } catch (error) {

      console.error(
        "Download error:",
        error
      );


      return res.status(500).send(
        "Download failed."
      );
    }
  }
);


// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "Unhandled server error:",
      error
    );


    if (
      res.headersSent
    ) {

      return next(
        error
      );
    }


    return res.status(
      500
    ).json({

      success: false,

      message:
        "An unexpected server error occurred."

    });
  }
);


// ==================================================
// GRACEFUL SHUTDOWN
// ==================================================

async function shutdown(
  signal
) {

  console.log(
    `${signal} received. Shutting down...`
  );

  try {

    await pool.end();

    console.log(
      "PostgreSQL connection pool closed."
    );

    process.exit(0);

  } catch (error) {

    console.error(
      "Error during shutdown:",
      error
    );

    process.exit(1);
  }
}


process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);


// ==================================================
// START SERVER
// ==================================================

app.listen(
  PORT,
  () => {

    console.log(
      `✅ Caveman Cake API running at ${BACKEND_URL}`
    );

    console.log(
      `💰 Product price: MWK ${PRODUCT_PRICE_MWK}`
    );

    console.log(
      `🔐 Download token lifetime: 30 minutes`
    );

    console.log(
      `🗄️ Database: PostgreSQL`
    );

    console.log(
      `📦 Protected file: ${DOWNLOAD_FILE}`
    );

  }
);
