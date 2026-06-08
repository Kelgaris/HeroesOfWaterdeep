process.env.NODE_ENV = "test";
process.env.CORS_ORIGINS = "https://heroes.example.com";

const request = require("supertest");
const { app } = require("../app");

describe("API Health and Validation", () => {
  it("GET /api/health responde ok", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.timestamp).toBeDefined();
  });

  it("POST /api/auth/register rechaza payload invalido", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username: "a",
      email: "correo-invalido",
      password: "123",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Datos de entrada inválidos");
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  it("POST /api/auth/login rechaza payload vacio", async () => {
    const response = await request(app).post("/api/auth/login").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Datos de entrada inválidos");
  });
});
