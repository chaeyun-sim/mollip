module.exports = {
	dependencies: {
		// google-services.json이 제공되면 Android Firebase 설정과 함께 활성화한다.
		'@react-native-firebase/app': { platforms: { android: null } },
		'@react-native-firebase/analytics': { platforms: { android: null } },
	},
};
