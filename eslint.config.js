// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
	expoConfig,
	prettierConfig,
	{
		ignores: ['dist/*'],
	},
	{
		rules: {
			// Fetch-on-mount hooks set loading/data after talking to Supabase/external APIs.
			// The compiler rule treats that as cascading renders; keep the documented
			// useEffect sync pattern rather than migrating every list/detail hook to React Query.
			'react-hooks/set-state-in-effect': 'off',
		},
	},
]);
