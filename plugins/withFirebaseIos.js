const { withPodfile } = require('@expo/config-plugins');
const withFirebaseApp = require('@react-native-firebase/app/app.plugin.js');
const withFirebaseAnalytics = require('@react-native-firebase/analytics/app.plugin.js');

// Android 설정 파일이 아직 없으므로 RNFirebase의 Android Google Services mod는 등록하지 않는다.
module.exports = (config) => {
	const androidMods = { ...config.mods?.android };
	config = withFirebaseApp(config);
	config.mods.android = androidMods;
	config = withFirebaseAnalytics(config, { ios: { withoutAdIdSupport: true } });
	return withPodfile(config, (result) => {
		const flag = '$RNFirebaseAsStaticFramework = true';
		if (!result.modResults.contents.includes(flag)) {
			result.modResults.contents = `${flag}\n${result.modResults.contents}`;
		}
		return result;
	});
};
