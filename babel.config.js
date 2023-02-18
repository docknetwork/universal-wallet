module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
};

// module.exports = {
//   presets: [
//     [
//       '@babel/preset-env',
//       {
//         modules: 'commonjs',
//         loose: true,
//       },
//     ],
//   ],
// };

