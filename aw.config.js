module.exports = {
  coverage: true,
  glob: ['./test/unit/**/*.spec.js'],
  src: ['./src/**/*(!index).js'],
  nyc: {
    babel: false,
  },
  mocha: {
    bail: false,
  },
};
