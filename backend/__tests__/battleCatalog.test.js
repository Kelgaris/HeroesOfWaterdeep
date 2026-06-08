const { BASE_ENEMIES } = require("../models/Enemy");
const { BASE_STAGES } = require("../models/Stage");

describe("Battle catalog", () => {
  it("mantiene un catálogo pequeño con solo 6 enemigos base", () => {
    const expectedEnemies = [
      "enemy_goblin",
      "enemy_killer_bee",
      "enemy_blue_sphere",
      "enemy_carbuncle",
      "enemy_lycanthrope",
      "enemy_deadly_eye",
    ];

    expect(BASE_ENEMIES).toHaveLength(expectedEnemies.length);

    expectedEnemies.forEach((enemyId) => {
      const enemy = BASE_ENEMIES.find((entry) => entry.enemyId === enemyId);

      expect(enemy).toBeDefined();
      expect(enemy.asset?.imagePath).toMatch(/^\/assets\/monsters\//);
      expect(enemy.battleProfile).toBeDefined();
    });
  });

  it("deja todos los stages referenciando solo enemigos existentes", () => {
    const enemyIds = new Set(BASE_ENEMIES.map((enemy) => enemy.enemyId));

    BASE_STAGES.forEach((stage) => {
      stage.enemies.forEach((enemy) => {
        expect(enemyIds.has(enemy.enemyId)).toBe(true);
      });
    });
  });

  it("asigna un background persistible a todos los stages", () => {
    expect(BASE_STAGES.length).toBeGreaterThan(0);

    BASE_STAGES.forEach((stage) => {
      expect(stage.backgroundAsset?.imagePath).toMatch(
        /^\/assets\/backgrounds\//,
      );
    });
  });
});
