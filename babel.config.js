// module.exports = {
//   ignore: [/node_modules\/(?!@digitalbazaar)/],
//   presets: [
//     [
//       '@babel/preset-env',
//       {
//         targets: {
//           node: 'current',
//         },
//       },
//     ],
//   ],
// };

module.exports = function (api) {
  api.cache(true);
  const presets = [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ];

  return {
    // ignore: [/node_modules\/(?!lodash-es)/],
    ignore: [/node_modules\/(?!@digitalbazaar)/],
    presets,
  };
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

