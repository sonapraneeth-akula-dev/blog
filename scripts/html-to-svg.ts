import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';

const START = '<!-- SVG_CONTENT_START -->';
const END = '<!-- SVG_CONTENT_END -->';

const [, , inputArg, outputArg] = process.argv;

if (!inputArg || !outputArg) {
  console.error('Usage: bun scripts/html-to-svg.ts <input.html> <output.svg>');
  process.exit(1);
}

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);

if (extname(inputPath).toLowerCase() !== '.html' || extname(outputPath).toLowerCase() !== '.svg') {
  console.error('Expected an .html input and an .svg output.');
  process.exit(1);
}

const html = await readFile(inputPath, 'utf8');
const start = html.indexOf(START);
const end = html.indexOf(END);

if (start === -1 || end === -1 || end <= start) {
  console.error(`Input must contain ${START} and ${END} markers.`);
  process.exit(1);
}

const width = html.match(/<meta name="svg-width" content="(\d+)"\s*\/>/)?.[1];
const height = html.match(/<meta name="svg-height" content="(\d+)"\s*\/>/)?.[1];

if (!width || !height) {
  console.error('Input must declare svg-width and svg-height meta values.');
  process.exit(1);
}

const content = html.slice(start + START.length, end).trim();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <foreignObject width="100%" height="100%">
    ${content}
  </foreignObject>
</svg>
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, svg, 'utf8');
console.log(`${outputPath} (${width}x${height})`);