export const ONBOARDING_WALL_CANVAS = { width: 1080, height: 1080 };

interface WallFrame {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	mask: number[];
	oval: boolean;
	image: number;
}

const scaledMask = (
	mask: number[],
	assetWidth: number,
	assetHeight: number,
	width: number,
	height: number,
) => {
	const sx = width / assetWidth;
	const sy = height / assetHeight;
	return [mask[0] * sx, mask[1] * sy, mask[2] * sx, mask[3] * sy];
};

const place = (
	frame: {
		id: string;
		width: number;
		height: number;
		mask: number[];
		oval: boolean;
		image: number;
	},
	x: number,
	y: number,
	size: number,
): WallFrame => {
	return {
		id: frame.id,
		x,
		y,
		width: frame.width * size,
		height: frame.height * size,
		mask: frame.mask.map((value) => value * size),
		oval: frame.oval,
		image: frame.image,
	};
};

const RAW = {
	frame1: {
		id: 'frame-1',
		width: 302,
		height: 467,
		mask: [67, 87, 167, 302],
		oval: false,
		image: require('../../assets/images/onboarding/frame-1.png'),
	},
	frame2: {
		id: 'frame-2',
		width: 366,
		height: 290,
		mask: [56, 59, 253, 170],
		oval: false,
		image: require('../../assets/images/onboarding/frame-2.png'),
	},
	frame3: {
		id: 'frame-3',
		width: 395,
		height: 504,
		mask: [76, 96, 239, 313],
		oval: false,
		image: require('../../assets/images/onboarding/frame-3.png'),
	},
	frame4: {
		id: 'frame-4',
		width: 370,
		height: 500,
		mask: scaledMask([62, 67, 180, 267], 305, 410, 370, 500),
		oval: false,
		image: require('../../assets/images/onboarding/frame-4.png'),
	},
	frame5: {
		id: 'frame-5',
		width: 400,
		height: 316,
		mask: scaledMask([56, 60, 262, 174], 372, 297, 400, 316),
		oval: false,
		image: require('../../assets/images/onboarding/frame-5.png'),
	},
};

export const ONBOARDING_WALL_FRAMES: WallFrame[] = [
	place(RAW.frame1, 52, 144, 0.86),
	place(RAW.frame2, 100, 676, 0.84),
	place(RAW.frame3, 328, 190, 0.94),
	place(RAW.frame4, 712, 106, 0.88),
	place(RAW.frame5, 658, 642, 0.84),
];
