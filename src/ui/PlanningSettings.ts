export interface SearchParameters {
	searchPhrase: string;
	fuzzySearch: boolean;
}

export interface WipLimit {
	dailyLimit: number;
	isLimited: boolean;
}

export interface PlanningSettings {
	searchParameters: SearchParameters;
	hideEmpty: boolean;
	wipLimit: WipLimit;
	showTags: boolean;
	showStartTime: boolean;
}

export function getDefaultSettings(): PlanningSettings {
	return {
		searchParameters: {
			fuzzySearch: false,
			searchPhrase: "",
		},
		hideEmpty: true,
		showTags: true,
		showStartTime: true,
		wipLimit: {
			dailyLimit: 5,
			isLimited: false,
		},
	};
}
