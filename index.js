import module from './src'

if (!process.nextTick) {
  process.nextTick = function (callback) {
    setTimeout(callback, 0);
  };
}

export default module;
