const Neat = require('./neat')
describe('solve xor', () => {
    it('should be able to solve xor using trainFn', () => {
        const neat = new Neat(2, 1, { maxPop: 2000 })
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
        const { client, gen } = neat.trainFn(xorFitness, 0, 0.01)
        expect(Math.round(client.predict([1, 1]))).toBe(0)
        expect(Math.round(client.predict([1, 0]))).toBe(1)
        expect(Math.round(client.predict([0, 1]))).toBe(1)
        expect(Math.round(client.predict([0, 0]))).toBe(0)
        expect(gen < 1000).toBe(true)
    })
    it('should be able to solve xor using trainData', () => {
        const neat = new Neat(2, 1, { maxPop: 2000 })
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
        const { client, gen } = neat.trainData(trainingData)
        expect(Math.round(client.predict([1, 1]))).toBe(0)
        expect(Math.round(client.predict([1, 0]))).toBe(1)
        expect(Math.round(client.predict([0, 1]))).toBe(1)
        expect(Math.round(client.predict([0, 0]))).toBe(0)
        expect(gen < 1000).toBe(true)
    })
})