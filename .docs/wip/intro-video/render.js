// 사용법: node render.js <작업폴더(node_modules·a/ 위치)> <출력.mp4> [--preview t1,t2,...]
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const workDir = path.resolve(process.argv[2]);
const outPath = path.resolve(process.argv[3]);
const previewArg = process.argv.indexOf('--preview');
const { chromium } = require(path.join(workDir, 'node_modules/playwright'));
const ffmpegPath = require(path.join(workDir, 'node_modules/ffmpeg-static'));

const FPS = 30;

const main = async () => {
	const html = fs
		.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
		.replace('__ASSET_BASE__', `file://${workDir}/`);
	const htmlPath = path.join(workDir, 'index.rendered.html');
	fs.writeFileSync(htmlPath, html);

	const browser = await chromium.launch();
	const page = await browser.newPage({
		viewport: { width: 1080, height: 1920 },
		deviceScaleFactor: 1,
	});
	await page.goto(`file://${htmlPath}`);
	await page.evaluate(async () => {
		await document.fonts.ready;
		await Promise.all([...document.images].map((img) => img.decode()));
	});

	// 미리보기 모드: 지정한 시각의 프레임만 PNG로 저장
	if (previewArg > -1) {
		const times = process.argv[previewArg + 1].split(',').map(Number);
		for (const t of times) {
			await page.evaluate((tt) => window.render(tt), t);
			await page.screenshot({ path: `${outPath}-${t}.png` });
		}
		await browser.close();
		return;
	}

	const duration = await page.evaluate(() => window.DURATION);
	const total = Math.round(duration * FPS);
	const ff = spawn(ffmpegPath, [
		'-y',
		'-loglevel',
		'error',
		'-f',
		'image2pipe',
		'-framerate',
		String(FPS),
		'-c:v',
		'mjpeg',
		'-i',
		'-',
		'-f',
		'lavfi',
		'-i',
		'anullsrc=r=44100:cl=stereo',
		'-shortest',
		'-c:v',
		'libx264',
		'-pix_fmt',
		'yuv420p',
		'-crf',
		'18',
		'-preset',
		'medium',
		'-c:a',
		'aac',
		'-b:a',
		'128k',
		'-movflags',
		'+faststart',
		outPath,
	]);
	ff.stderr.pipe(process.stderr);

	for (let f = 0; f < total; f++) {
		await page.evaluate((tt) => window.render(tt), f / FPS);
		const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
		if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
		if (f % 150 === 0) console.log(`frame ${f}/${total}`);
	}
	ff.stdin.end();
	await new Promise((r) => ff.on('close', r));
	await browser.close();
	console.log(`done: ${outPath}`);
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
