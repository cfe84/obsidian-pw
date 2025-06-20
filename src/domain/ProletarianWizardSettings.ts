export interface ProletarianWizardSettings {
	version: number;
	ignoredFolders: string[];
	ignoreArchivedTodos: boolean;
	defaultDailyWipLimit: number;
	dueDateAttribute: string;
	completedDateAttribute: string;
	selectedAttribute: string;
	useDataviewSyntax: boolean;
	firstWeekday: number;
	showWeekEnds: boolean;
	startedAttribute: string;
	trackStartTime: boolean;
	defaultStartHour: string;
	defaultEndHour: string;
	displayTodayProgressBar: boolean;
}

export const DEFAULT_SETTINGS: ProletarianWizardSettings = {
	version: 4,
	ignoredFolders: [],
	ignoreArchivedTodos: true,
	defaultDailyWipLimit: 5,
	dueDateAttribute: "due",
	completedDateAttribute: "completed",
	selectedAttribute: "selected",
	useDataviewSyntax: false,
	firstWeekday: 1,
	showWeekEnds: true,
	startedAttribute: "started",
	trackStartTime: true,
	defaultStartHour: "08:00",
	defaultEndHour: "17:00",
	displayTodayProgressBar: true,
};
