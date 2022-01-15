const Neat = require('../neat')
const { lFn } = require('../helpers/lossHelper')
const mse = lFn[0]

const nn = new Neat(3, 1, { maxPop: 2000 })

const xorFitness = (client) => {
    const results = [
        [client.predict([0, 0, 0]), [0]],
        [client.predict([0, 0, 1]), [1]],
        [client.predict([0, 1, 0]), [1]],
        [client.predict([0, 1, 1]), [0]],
        [client.predict([1, 0, 0]), [1]],
        [client.predict([1, 0, 1]), [0]],
        [client.predict([1, 1, 0]), [0]],
        [client.predict([1, 1, 1]), [0]],
    ]
    return -mse(results)
}

nn.trainFn(xorFitness, 0)