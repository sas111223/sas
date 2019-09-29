const { readdir, stat, copyFile } = require("fs-extra");
const { constants } = require("fs");
const { join, basename } = require("path");

const packagesFolder = "..";

const jsFile = dir => join(dir, "index.js");
const jsMapFile = dir => join(dir, "index.js.map");
const sourceJs = jsFile("dist");
const sourceJsMap = jsMapFile("dist");

const appPackages = join(packagesFolder, "server", "appPackages");

const publicMain = appName => join(appPackages, appName, "public", "main");
const publicUnauth = appName => join(appPackages, appName, "public", "unauthenticated");
const nodeModules = appName => join(appPackages, appName, "node_modules", "@budibase", "standard-components", "dist");

(async () => {

    const apps = await readdir(appPackages);

    const copySource = file => async toDir => {
        const dest = join(toDir, basename(file));
        try {
            await copyFile(file, dest, constants.COPYFILE_FICLONE);
            console.log(`COPIED ${file} to ${dest}`);
        } catch(e) {
            console.log(`COPY FAILED ${file} to ${dest}: ${e}`);
        }
    }

    const copySourceJs = copySource(sourceJs);
    const copySourceJsMap = copySource(sourceJsMap);
    

    for(let app of apps) {
        if(!(await stat(join(appPackages, app))).isDirectory()) continue;

        await copySourceJs(nodeModules(app));
        await copySourceJsMap(nodeModules(app));

        await copySourceJs(publicMain(app));
        await copySourceJsMap(publicMain(app));

        await copySourceJs(publicUnauth(app));
        await copySourceJsMap(publicUnauth(app));
    }

})();