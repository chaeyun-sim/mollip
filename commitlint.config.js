export default {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-empty': [2, 'never'],
		'scope-empty': [2, 'never'],
		'subject-empty': [2, 'never'],
		'subject-case': [0],
		'scope-enum': [2, 'always', ['app', 'api', 'ui', 'store', 'tts', 'supabase', 'deps', 'config']],
	},
};
