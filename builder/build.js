// obtain list of targets at http://pkg.musl.cc/db/
const fs = require("fs");
const yaml = require("js-yaml");

const targets = fs
  .readFileSync("targets.txt")
  .toString()
  .trim()
  .split(/[\r\n]+/);
//console.log(targets);
const repositories = ["richfelker/musl-cross-make", "pmmp/musl-cross-make"];

const data = {
  name: "Build cross compilers",
  on: {
    push: {
      branches: ["master"],
    },
    workflow_dispatch: { inputs: {} },
    schedule: [{ cron: "0 6,18 * * *" }],
  },
  jobs: {
    prepare: {
      "runs-on": "ubuntu-latest",
      steps: [{ uses: "actions/checkout@v2" }],
    },
    compile: {
      needs: "prepare",
      "runs-on": "ubuntu-latest",
      "continue-on-error": true,
      strategy: {
        matrix: {
          target: targets,
          repo: repositories,
        },
      },
      env: {
        TARGET: "${{ matrix.target }}",
      },
      steps: [
        { uses: "actions/checkout@v2" },
        {
          name: "Clone ${{ matrix.repo }}",
          run: "git clone https://github.com/${{ matrix.repo }} mcm",
        },
        {
          name: "Build ${{ matrix.target }}",
          run: ["make -j4", "make install", "ls output"].join("\n"),
          "working-directory": "mcm",
        },
        {
          name: "Package ${{ matrix.target }}",
          run: ["tar -cvf ../output-${{ matrix.target }}.tar.gz output/"].join(
            "\n"
          ),
          "working-directory": "mcm",
        },
        {
          name: "Upload artifacts",
          uses: "actions/upload-artifact@v2",
          with: {
            path: "output-${{ matrix.target }}.tar.gz",
            name: "${{ matrix.target }}-${{ matrix.repo }}",
          },
        },
      ],
    },
  },
};

console.log(yaml.dump(data));
