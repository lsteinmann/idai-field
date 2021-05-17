module.exports = {
    preset: 'jest-expo',
    setupFiles: ['./jest.setup.js'],
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    transformIgnorePatterns: [
      'node_modules/(?!(jest-)?react-native|react-clone-referenced-element|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|sentry-expo|native-base|@react-native-picker)',
      '../core/dist/src'
    ],
    coverageReporters: ['json-summary', 'text', 'lcov'],
};
