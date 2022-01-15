const Neat = require('../neat')

const nn = new Neat(2, 1, { maxPop: 1000 })
const trainingData = [
    [
        [1, 1],
        [0]
    ],
    [
        [1, 0],
        [1]
    ],
    [
        [0, 1],
        [1]
    ],
    [
        [0, 0],
        [0]
    ]
]

///

{
    console.time('Time Taken')
    const { client, gen } = nn.trainData(trainingData, 0.01, true)
    console.log('====================')
    console.log('XOR Score:', `${Math.round((1-(Math.abs(client.score)) / 1) * 10000) / 100}%`)
    console.log(`Solved on gen: ${gen}`)
    console.timeEnd('Time Taken')
    console.log('====================')
}
nn.reset()