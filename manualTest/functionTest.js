const Neat = require('../neat')
const { lFn } = require('../helpers/lossHelper')
const mse = lFn[0]

const nn = new Neat(2, 1, { maxPop: 2000 })
const xorFitness = (client) => {
    const result = [
        [client.predict([1, 1]), [0]],
        [client.predict([1, 0]), [1]],
        [client.predict([0, 1]), [1]],
        [client.predict([0, 0]), [0]],
    ]
    let fitness = 0
    for (let r of result) {
        fitness -= Math.abs(r[0][0] - r[1][0])
    }
    return fitness
}

const andFitness = (client) => {
    const result = [
        [client.predict([1, 1]), [1]],
        [client.predict([1, 0]), [0]],
        [client.predict([0, 1]), [0]],
        [client.predict([0, 0]), [0]],
    ]
    return -mse(result)
}

const orFitness = (client) => {
    const result = [
        [client.predict([1, 1]), [1]],
        [client.predict([1, 0]), [1]],
        [client.predict([0, 1]), [1]],
        [client.predict([0, 0]), [0]],
    ]
    return -mse(result)
}


///
{
    console.time('Time Taken')
    const { client, gen } = nn.trainFn(andFitness, 0, 0.01, false)
    console.log('====================')
    console.log('AND Score:', `${Math.round((1-(Math.abs(client.score)) / 1) * 10000) / 100}%`)
    console.log(`Solved on gen: ${gen}`)
    console.timeEnd('Time Taken')
}
nn.reset();
///
{
    console.log('====================')
    console.time('Time Taken')
    const { client, gen } = nn.trainFn(orFitness, 0, 0.01, false)
    console.log('OR Score:', `${Math.round((1-(Math.abs(client.score)) / 1) * 10000) / 100}%`)
    console.log(`Solved on gen: ${gen}`)
    console.timeEnd('Time Taken')
}
nn.reset();
///
{
    console.log('====================')
    console.time('Time Taken')
    const { client, gen } = nn.trainFn(xorFitness, 0, 0.01, false)
    console.log('XOR Score:', `${Math.round((1-(Math.abs(client.score)) / 1) * 10000) / 100}%`)
    console.log(`Solved on gen: ${gen}`)
    console.timeEnd('Time Taken')
    console.log('====================')
}
nn.reset()