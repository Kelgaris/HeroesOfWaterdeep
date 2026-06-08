const { getBannerInfo, CURRENT_BANNER } = require("../services/gachaService");

describe("Gacha Banner Info", () => {
  it("expone rates alineados con configuracion real", () => {
    const info = getBannerInfo();

    expect(info).toBeDefined();
    expect(info.rates.featuredRate).toBe(
      `${(CURRENT_BANNER.featuredRate * 100).toFixed(0)}%`,
    );
    expect(info.rates.rateUp4StarRate).toBe(
      `${(CURRENT_BANNER.rateUp4StarRate * 100).toFixed(0)}%`,
    );
  });

  it("siempre devuelve un featuredHero valido", () => {
    const info = getBannerInfo();

    expect(info.featuredHero).toBeDefined();
    expect(info.featuredHero._id).toBeTruthy();
    expect(info.featuredHero.name).toBeTruthy();
  });
});
