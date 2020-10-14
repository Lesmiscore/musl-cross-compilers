const core = require("@actions/core");
const tc = require("@actions/tool-cache");
const path = require("path");

const target = core.getInput("target", { required: true });
const variant = core.getInput("variant", { required: true });

(async () => {
  try {
    const url = `${target}-${variant}.tar.gz`;

    let cachedPath = tc.find("mcm", `https://github.com/nao20010128nao/musl-cross-compilers/releases/download/hello/output-${target}-${variant.replace("/","_")}.tar.gz`);
    if (cachedPath) {
      console.log(`Found cache at ${cachedPath}`);
    } else {
      const toolchainPath = await tc.downloadTool(url);
      const toolchainExtractedFolder = await tc.extractTar(toolchainPath);
      cachedPath = await tc.cacheDir(
        toolchainExtractedFolder,
        "mcm",
        `${target}-${variant}.tar.gz`
      );
      console.log(`Installed at ${cachedPath}`);
    }
    cachedPath = path.join(cachedPath, "outputs", "bin");
    console.log(`Binaries are at ${cachedPath}`);
    core.addPath(cachedPath);
    core.setOutput("path", cachedPath);
  } catch (e) {
    core.setFailed(e);
  }
})();
