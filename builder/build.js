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
    workflow_dispatch: {
      inputs: {
        do_release: {
          description:
            'Create a release and upload files? (type "yes" to create)',
          required: true,
          default: "no",
        },
        release: {
          description: "Release tag and name",
          required: true,
        },
      },
    },
    schedule: [{ cron: "0 6,18 * * *" }],
  },
  jobs: {
    prepare: {
      "runs-on": "ubuntu-latest",
      outputs: {
        upload_url: "${{ steps.create_release.outputs.upload_url }}",
      },
      steps: [
        {
          name: "Create release",
          uses: "actions/create-release@v1",
          id: "create_release",
          if: '${{ github.event.inputs.do_release == \'yes\' }}',
          with: {
            tag_name: "${{ github.event.inputs.release }}",
            release_name: "${{ github.event.inputs.release }}",
            draft: false,
            prerelease: false,
          },
          env: {
            GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
          },
        },
      ],
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
        REPO: "${{ matrix.repo }}",
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
          id: "package",
          run: [
            "tar -cvf ../output-${{ matrix.target }}.tar.gz output/",
            "echo ::set-output name=source_escaped::${REPO%%/*}_${REPO##*/}",
          ].join("\n"),
          "working-directory": "mcm",
        },
        {
          name: "Upload artifacts",
          uses: "actions/upload-artifact@v2",
          with: {
            path: "output-${{ matrix.target }}.tar.gz",
            name:
              "${{ matrix.target }}-${{ steps.package.outputs.source_escaped }}",
          },
        },
        {
          id: "upload",
          name: "Upload to releases",
          uses: "actions/upload-release-asset@v1",
          if: '${{ github.event.inputs.do_release == \'yes\' }}',
          with: {
            asset_path: "output-${{ matrix.target }}.tar.gz",
            asset_name:
              "output-${{ matrix.target }}-${{ steps.package.outputs.source_escaped }}.tar.gz",
            upload_url: "${{ needs.prepare.outputs.upload_url }}",
            asset_content_type: "application/gzip",
          },
          env: {
            GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
          },
        },
      ],
    },
  },
};

console.log(yaml.dump(data));
