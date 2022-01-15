const { sigmoid, erf, softPlus } = require('./mathHelper')

const aFn = [
    (x) => x,
    (x) => sigmoid(x),
    (x) => Math.max(x, 0),
    (x) => x < 0 ? 0 : 1,
    (x) => x < 0 ? -1 : 1,
    (x) => Math.tanh(x),
    (x) => Math.max(0.1 * x, 0),
    (x) => x * sigmoid(x),
    (x) => 1 - x,
    (x) => (2 * sigmoid(x)) - 1,
    (x) => Math.max(-1, Math.min(1, x)),
    (x) => Math.atan(x),
    (x) => x / (1 + Math.abs(x)),
    (x) => ((x == 0) ? 1 : (Math.sin(x) / x)),
    (x) => Math.sin(x),
    (x) => Math.exp(-(x ** 2)),
    (x) => (x / Math.sqrt(1 + (x ** 2))),
    (x) => (x / 2) * (1 + erf(x / Math.SQRT2)),
    (x) => ((Math.sqrt((x ** 2) + 1) - 1) / 2) + x,
    (x) => softPlus(x),
    (x) => x * Math.tanh(softPlus(x)),
    (x) => x > 2 ? 1 : x < -2 ? -1 : x + (x ** 2) / 4,
    (x) => erf(x),
    (x) => ((x > 0) ? x : (Math.expm1(x))),
    (x) => 1.0507 * ((x > 0) ? x : (1.67326 * Math.expm1(x)))
]

const aNm = {
    id: 0,
    sig: 1,
    relu: 2,
    bin: 3,
    bipol: 4,
    tanh: 5,
    swish: 6,
    invert: 7,
    bipolSig: 8,
    hardTanh: 9,
    arcTan: 10,
    softSign: 11,
    sinc: 12,
    sin: 13,
    gaussian: 14,
    isru: 15,
    gelu: 16,
    bentId: 17,
    softPlus: 18,
    mish: 19,
    sqnl: 20,
    erf: 21,
    elu: 22,
    selu: 23
}

module.exports = { aNm, aFn }