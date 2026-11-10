const { app } = require("@azure/functions");
const sql = require("mssql");

// ค่าเหล่านี้ตั้งใน Static Web App > Environment variables (ไม่ใส่รหัสผ่านในโค้ด)
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { encrypt: true },
  // ฐานข้อมูล free serverless จะ auto-pause ครั้งแรกที่เรียกอาจต้องรอนาน
  connectionTimeout: 60000,
  requestTimeout: 60000,
};

let poolPromise;
function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect().catch((err) => {
      poolPromise = null; // ให้ลองเชื่อมต่อใหม่ในครั้งถัดไป
      throw err;
    });
  }
  return poolPromise;
}

function validate(body) {
  const name = (body && body.name ? String(body.name) : "").trim();
  const email = (body && body.email ? String(body.email) : "").trim();
  if (!name) return { error: "กรุณากรอกชื่อ-นามสกุล" };
  if (name.length > 100) return { error: "ชื่อยาวเกิน 100 ตัวอักษร" };
  if (email.length > 100) return { error: "อีเมลยาวเกิน 100 ตัวอักษร" };
  return { name, email: email || null };
}

app.http("students", {
  methods: ["GET", "POST", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "students/{id?}",
  handler: async (request, context) => {
    try {
      const pool = await getPool();
      const id = request.params.id ? parseInt(request.params.id, 10) : null;

      switch (request.method) {
        case "GET": {
          const result = await pool
            .request()
            .query("SELECT Id, Name, Email, CreatedAt FROM Students ORDER BY Id DESC");
          return { jsonBody: result.recordset };
        }

        case "POST": {
          const v = validate(await request.json());
          if (v.error) return { status: 400, jsonBody: { error: v.error } };
          const result = await pool
            .request()
            .input("name", sql.NVarChar(100), v.name)
            .input("email", sql.NVarChar(100), v.email)
            .query(
              "INSERT INTO Students (Name, Email) OUTPUT INSERTED.* VALUES (@name, @email)"
            );
          return { status: 201, jsonBody: result.recordset[0] };
        }

        case "PUT": {
          if (!Number.isInteger(id)) return { status: 400, jsonBody: { error: "ต้องระบุ id" } };
          const v = validate(await request.json());
          if (v.error) return { status: 400, jsonBody: { error: v.error } };
          const result = await pool
            .request()
            .input("id", sql.Int, id)
            .input("name", sql.NVarChar(100), v.name)
            .input("email", sql.NVarChar(100), v.email)
            .query(
              "UPDATE Students SET Name = @name, Email = @email OUTPUT INSERTED.* WHERE Id = @id"
            );
          if (result.recordset.length === 0)
            return { status: 404, jsonBody: { error: "ไม่พบรายชื่อนี้" } };
          return { jsonBody: result.recordset[0] };
        }

        case "DELETE": {
          if (!Number.isInteger(id)) return { status: 400, jsonBody: { error: "ต้องระบุ id" } };
          const result = await pool
            .request()
            .input("id", sql.Int, id)
            .query("DELETE FROM Students WHERE Id = @id");
          if (result.rowsAffected[0] === 0)
            return { status: 404, jsonBody: { error: "ไม่พบรายชื่อนี้" } };
          return { status: 204 };
        }

        default:
          return { status: 405 };
      }
    } catch (err) {
      context.error("students API error:", err);
      return {
        status: 500,
        jsonBody: { error: "เชื่อมต่อฐานข้อมูลไม่ได้ ลองใหม่อีกครั้งใน 1 นาที" },
      };
    }
  },
});
