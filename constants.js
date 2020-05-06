module.exports = {
	HEIGHT_DEFAULT: 800,
	HEIGHT_MAXIMUM: 1200,
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
	WIDTH_DEFAULT: 1280,
	WIDTH_MAXIMUM: 1920,
}
