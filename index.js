const core = require("@actions/core");
const tc = require("@actions/tool-cache");
const exec = require("@actions/exec");
const io = require("@actions/io");
const path = require("path");

const target = core.getInput("target", { required: true });
const variant = core.getInput("variant", { required: true });
const build = core.getInput("build").toUpperCase() === "TRUE";
const buildDest = path.join("/opt/", target, variant);

const tags = {
  "pmmp/musl-cross-make": "eraser",
  "richfelker/musl-cross-make": "eraser",
};

(async () => {
  try {
    const url = `https://github.com/nao20010128nao/musl-cross-compilers/releases/download/${tags[variant]}/output-${target}-${variant.replace(
      "/",
      "_"
    )}.tar.gz`;

    let cachedPath;
    if (build) {
      const destDir = buildDest;
      await io.mkdirP(destDir);
      let ret = await exec.exec("git", ["clone", `https://github.com/${variant}.git`, destDir], {
        ignoreReturnCode: true,
      });
      if (ret != 0) {
        throw new Error(`git clone failed with code ${ret}`);
      }

      ret = await exec.exec("make", ["-j4"], {
        cwd: destDir,
        ignoreReturnCode: true,
        env: {
          TARGET: target,
        },
      });
      if (ret != 0) {
        throw new Error(`make -j4 failed with code ${ret}`);
      }

      ret = await exec.exec("make", ["install"], {
        cwd: destDir,
        ignoreReturnCode: true,
        env: {
          TARGET: target,
        },
      });
      if (ret != 0) {
        throw new Error(`make install failed with code ${ret}`);
      }
      cachedPath = destDir;
    } else {
      cachedPath = tc.find("mcm", `${target}-${variant}.tar.gz`);
    }
    if (cachedPath) {
      console.log(`Found installation at ${cachedPath}`);
    } else {
      const toolchainPath = await tc.downloadTool(url);
      const toolchainExtractedFolder = await tc.extractTar(toolchainPath);
      cachedPath = await tc.cacheDir(toolchainExtractedFolder, "mcm", `${target}-${variant}.tar.gz`);
      console.log(`Installed at ${cachedPath}`);
    }
    cachedPath = path.join(cachedPath, "output", "bin");
    console.log(`Binaries are at ${cachedPath}`);
    core.addPath(cachedPath);
    core.setOutput("path", cachedPath);
  } catch (e) {
    if (build) {
      console.log("Build error occured and showing last config.log");
      await exec.exec("bash", ["-c", `LC_ALL=en_US.UTF-8 find . -name config.log -printf "%T@ %p\n" | sort -n | awk '{print $NF}' | xargs cat`], {
        ignoreReturnCode: true,
      });
    }
    core.setFailed(e);
  }
})();
