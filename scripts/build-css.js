const { spawnSync } = require('node:child_process');

const bin = process.platform === 'win32' ? 'tailwindcss.cmd' : 'tailwindcss';

const result = spawnSync(
    bin,
    ['-i', './input.css', '-o', './styles.css', '--minify'],
    {
        env: {
            ...process.env,
            BROWSERSLIST_IGNORE_OLD_DATA: '1'
        },
        shell: process.platform === 'win32',
        stdio: 'inherit'
    }
);

if (result.error) {
    throw result.error;
}

process.exit(result.status ?? 1);
