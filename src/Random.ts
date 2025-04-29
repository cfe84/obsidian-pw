export class Random {
	private state: number;

	constructor(...seed: any[]) {
		if (seed.length === 0) {
			this.state = Math.round(Math.random() * 0x6d2b79f5);
		} else {
			this.state = Random.hashString(seed.join("-"));
		}
	}

	// Returns a float between 0 and 1
	next(): number {
		let t = (this.state += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	// Returns a float in a given range
	nextFloat(min: number, max: number): number {
		return min + this.next() * (max - min);
	}

	// Returns an int in a given range (inclusive)
	nextInt(min: number, max: number): number {
		return Math.floor(this.nextFloat(min, max + 1));
	}

	pick<T>(array: T[]): T {
		const i = this.nextInt(0, array.length - 1);
		return array[i];
	}

	pickString(array: string): string {
		const i = this.nextInt(0, array.length - 1);
		return array[i];
	}

	// Shuffle an array in place
	shuffle<T>(array: T[]): T[] {
		for (let i = array.length - 1; i > 0; i--) {
			const j = this.nextInt(0, i);
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	private static hashString(str: string): number {
		let h = 0x811c9dc5;
		for (let i = 0; i < str.length; i++) {
			h ^= str.charCodeAt(i);
			h = Math.imul(h, 0x01000193);
		}
		return h >>> 0;
	}
}
