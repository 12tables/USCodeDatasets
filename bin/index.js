#!/usr/bin/env node
/**
 * Decompress US Code Datafiles with Node
 */

const fs = require('fs');
const path = require('path');
const lzma = require('lzma-native');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const { y } = yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> options')
    .command('decompress', 'Decompress one or all of the US Code archives')
    .example('$0 -y 2020', 'Decompress the 2020 archive')
    .alias('y', 'year')
    .nargs('y', 1)
    .describe('y', 'The year to decompress')
    .argv;

const decompress = (file) => new Promise((resolve) => {
    const decompressor = lzma.createDecompressor();

    console.log(`Decompressing ${file}`);
    const [ name, ext ] = file.split('.');
    const out = fs.createWriteStream(path.join(
        __dirname, '..', 'data', `${name}.${ext}`,
    ));
    fs.createReadStream(path.join(
        __dirname, '..', 'data', file,
    )).pipe(decompressor).pipe(out).on('finish', () => {
        console.log(`Wrote ${name}.${ext}`);
        resolve();
    });
});

(async () => {
    let files = (await fs.promises.readdir(path.join(__dirname, '..', 'data'), {
        withFileTypes: true,
    })).filter(f => /^.*\.xz$/.test(f.name));

    if (y) {
        const year = y.toString().substring(2);
        files = Array.from(files).filter(f => f.name.includes(year));
    }

    for await (const file of files) {
        await decompress(file.name);
    }
})();



