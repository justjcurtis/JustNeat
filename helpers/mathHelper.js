const gaussianRand = (n = 6) => {
    var rand = 0;
    for (var i = 0; i < n; i++) {
        rand += Math.random();
    }
    return rand / n;
}

const randomStd0 = () => (gaussianRand() - 0.5) * 2

const randomRange = (min, max) => min + (Math.random() * (max - min + 1))

const randomInt = (min, max) => Math.floor(randomRange(min, max))

const sigmoid = x => 1 / (1 + Math.exp(-x))

const erf = x => {
    var a1 = 0.254829592;
    var a2 = -0.284496736;
    var a3 = 1.421413741;
    var a4 = -1.453152027;
    var a5 = 1.061405429;
    var p = 0.3275911;

    var sign = ((x < 0) ? -1 : 1);
    x = Math.abs(x);

    var t = 1.0 / (1.0 + p * x);
    var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-(x ** 2));

    return sign * y;
}


const softPlus = x => Math.log(1 + Math.exp(x));

module.exports = {
    gaussianRand,
    randomInt,
    randomRange,
    randomStd0,
    sigmoid,
    erf,
    softPlus,
}