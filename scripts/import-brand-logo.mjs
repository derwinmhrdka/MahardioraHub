const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const candidates = [
  path.join(
    process.env.USERPROFILE || "",
    ".cursor",
    "projects",
    "d-derwin-mahardika-iu-Documents-Apps-DealHub",
    "assets",
    "c__Users_derwin.mahardika-iu_AppData_Roaming_Cursor_User_workspaceStorage_d1c577849eb1b9d8ed831739452659fc_images_mahardiora-hub-05c8cd1e-cf25-4f96-814e-ad6692cd3e56.png"
  ),
  path.join(
    process.env.USERPROFILE || "",
    "AppData",
    "Roaming",
    "Cursor",
    "User",
    "workspaceStorage",
    "d1c577849eb1b9d8ed831739452659fc",
    "images",
    "mahardiora-hub-05c8cd1e-cf25-4f96-814e-ad6692cd3e56.png"
  ),
];

async function main() {
  const src = candidates.find((c) => fs.existsSync(c));
  if (!src) {
    console.error("logo source not found");
    for (const c of candidates) console.error("-", c, fs.existsSync(c));
    process.exit(1);
  }

  fs.mkdirSync("public/brand", { recursive: true });
  fs.copyFileSync(src, "public/brand/mahardiora-hub.png");
  console.log("copied", src, "-> public/brand/mahardiora-hub.png");

  await Promise.all([
    sharp(src)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toFile("public/brand/icon-512.png"),
    sharp(src)
      .resize(192, 192, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toFile("public/icon-store.png"),
    sharp(src)
      .resize(32, 32, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toFile("app/icon.png"),
    sharp(src)
      .resize(180, 180, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toFile("app/apple-icon.png"),
    sharp(src)
      .resize(1200, 630, {
        fit: "contain",
        background: { r: 247, g: 243, b: 235, alpha: 1 },
      })
      .png()
      .toFile("public/brand/og.png"),
  ]);

  console.log("icons generated");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
