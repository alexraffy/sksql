
const Path = require("path");
const FS   = require("fs");

function ThroughDirectory(Directory) {
    FS.readdirSync(Directory).forEach(File => {
        const Absolute = Path.join(Directory, File);
        if (FS.statSync(Absolute).isDirectory()) {
            return ThroughDirectory(Absolute);
        }
        else {

            if (File.endsWith(".js") || File.endsWith(".d.ts") || File.endsWith((".js.map"))) {
                console.log(Absolute);
                FS.rmSync(Absolute);
            }

        }
    });
}

ThroughDirectory("./src");


