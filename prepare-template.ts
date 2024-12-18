/**
 * The MIT License (MIT)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @license MIT
 * @author Falcion
 * @year 2023-2024
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';

import * as readline from 'readline';

import { green, yellow, cyan, red, bgRed, bgGreen, white, bgBlue, bold } from 'colors/safe';


/**
 * Represents the PREPARE_MODULE for searching through files and updating the manifest.
 */
class PREPARE_MODULE {
    /** The root directory of the module. */
    ROOT_DIRECTORY: string = __dirname;

    /** An array of folder names to exclude from traversal. */
    EXCLUDING_FOLDER: string[] = ['node_modules', 'venv', '.git', 'out'];
    /** An array of values to include in the search. */
    INCLUDING_VALUES: string[] = ['FALCION',
        'PATTERNU',
        'PATTERNUGIT'];

    /**
     * Creates an instance of the PREPARE_MODULE.
     * @param {string[]} entries - An array of custom entries to include for searching.
     */
    constructor(entries: string[]) {
        if (entries[0] != 'NO')
            for (const item in entries)
                this.INCLUDING_VALUES.push(item);
    }

    /**
     * Searches for specified data within a file.
     * @param {string} filepath - The path of the file to search.
     * @param {string[]} data - An array of strings to search for within the file.
     * @returns {Promise<void>} - A promise that resolves when the search is complete.
     */
    async search(filepath: string,
        data: string[]) {
        const content = (await fs.readFile(filepath, 'utf-8')).split('\n');

        for (let i = 0; i < content.length; i++) {
            const line = content[i].toUpperCase();

            for (const target of data)
                if (line.includes(target))
                    console.info(green(`Found "${target}" in L#${i} of:\n` + cyan(filepath)))
        }
    }

    /**
     * Recursively traverses a directory and searches for files.
     * @param {string} directory - The directory path to traverse.
     * @returns {Promise<void>} - A promise that resolves when the traversal is complete.
     */
    async traverse(directory: string) {
        try {
            const files: string[] = await fs.readdir(directory);

            for (const file of files) {
                const filepath = path.join(directory, file);
                const filestat = await fs.stat(filepath);

                if (filestat.isDirectory()) {
                    if (!this.EXCLUDING_FOLDER.includes(file)) {
                        await this.traverse(filepath);
                    }
                } else if (filestat.isFile()) {
                    await this.search(filepath, this.INCLUDING_VALUES);
                } else {
                    throw new Error(red('No correct data was found, exception attribute is:') + bgRed(` ${filepath}`));
                }
            }
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                console.error(red(`File or directory not found: ${err.path}`));
            } else {
                console.error(red('Error via reading given directory: ' + `${err}`));
            }
        }
    }
}

fs.ensureFileSync(path.join(__dirname, '.env'));
fs.ensureFileSync(path.join(__dirname, 'manifest.json'));

fs.writeFileSync(path.join(__dirname, '.env'), 'EXAMPLE_API_KEY=');
fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify({}, undefined, 4));

dotenv.config({
    path: '.env',
    encoding: 'utf-8'
});

const PACKAGE_JSON: any = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));

const MANIFEST: any = JSON.parse(fs.readFileSync('manifest.json', { encoding: 'utf-8' }));

if (PACKAGE_JSON.name === MANIFEST.id &&
    PACKAGE_JSON.displayName === MANIFEST.name &&
    PACKAGE_JSON.description === MANIFEST.description &&
    PACKAGE_JSON.author.name === MANIFEST.author &&
    PACKAGE_JSON.author.url === MANIFEST.authorUrl &&
    PACKAGE_JSON.license === MANIFEST.license &&
    PACKAGE_JSON.version === MANIFEST.version) {
    console.warn(bgGreen(white('Manifest is synced with package, keep everything as it was.')));
}
else {
    console.warn(bgBlue(yellow('Manifest is not synced with package\'s information, rewriting it.')));

    fs.copyFileSync('manifest.json', 'manifest-backup.json');

    const input_json: any = {
        id: PACKAGE_JSON.name,
        name: PACKAGE_JSON.displayName,
        description: PACKAGE_JSON.description,
        author: PACKAGE_JSON.author.name,
        authorUrl: PACKAGE_JSON.author.url,
        license: PACKAGE_JSON.license,
        version: PACKAGE_JSON.version,
    };

    fs.writeFileSync('manifest.json', JSON.stringify(input_json, undefined, 4));
}

const RL = readline.createInterface({ input: process.stdin, output: process.stdout });

RL.question(bold('Change finding signatures (words) for the finder script? [Y/N]: '), (ASW1) => {
    if (ASW1.toUpperCase() == 'Y') {
        RL.question(bold('Enter your custom signatures (words) separatedly by commas: '), (ASW2) => {
            const input: string[] = ASW2.split(',');

            new PREPARE_MODULE(input).traverse(__dirname);

            RL.close();
        })
    }
    else {
        new PREPARE_MODULE(['NO']).traverse(__dirname);

        RL.close();
    }
});