module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'inline-dotenv',
        {
          path: '.env.development', // Usa .env.development por defecto
        },
      ],
      'react-native-reanimated/plugin', // Debe ser el ÚLTIMO plugin
    ],
  };
};
