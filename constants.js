module.exports = {
	HEIGHT_DEFAULT: process.env.HEIGHT_DEFAULT || 720,
	HEIGHT_MAXIMUM: process.env.HEIGHT_MAXIMUM || 10000,
	PERMITTED_PORTS: [
		'80',
		'443',
		'591',
		'2082',
		'2083',
		'2086',
		'2087',
		'2095',
		'2096',
		'2222',
		'8008',
		'8080',
		'8443',
		'8880'
	],
	PERMITTED_PROTOCOLS: [
		'http',
		'https'
	],
	PORT: process.env.PORT || 8080,
	WIDTH_DEFAULT: process.env.WIDTH_DEFAULT || 1280,
	WIDTH_MAXIMUM: process.env.WIDTH_MAXIMUM || 1920,
}
