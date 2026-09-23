const dotenv = require("dotenv");

dotenv.config();

const pool = require("./config/database");

async function testDatabase() {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time"
    );

    console.log("✅ PostgreSQL connection successful.");
    console.log("Database time:", result.rows[0].current_time);
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:");
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();